import { createClient } from "@supabase/supabase-js";

const env = ((globalThis as any).process?.env ?? {}) as Record<
  string,
  string | undefined
>;
const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req: any, res: any) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({
      error:
        "Variável SUPABASE_SERVICE_ROLE_KEY não configurada no servidor. Configure-a nas variáveis de ambiente do Vercel.",
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { slug, nome, adminEmail, adminPassword } = req.body || {};
  if (!slug || !nome || !adminEmail || !adminPassword) {
    return res.status(400).json({
      error: "slug, nome, adminEmail e adminPassword são obrigatórios",
    });
  }

  const normalizedSlug = String(slug).toLowerCase().trim();
  const normalizedName = String(nome).trim();
  const normalizedEmail = String(adminEmail).trim().toLowerCase();
  const password = String(adminPassword);

  const { data: loja, error: lojaError } = await supabase
    .from("lojas")
    .insert({ slug: normalizedSlug, nome: normalizedName })
    .select("id, slug, nome")
    .single();

  if (lojaError || !loja) {
    return res
      .status(400)
      .json({ error: lojaError?.message || "Erro ao criar loja" });
  }

  const { data: createdUser, error: userError } =
    await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        name: "Administrador",
        tenant_id: loja.id,
        role: "admin",
      },
    });

  let adminUser = createdUser?.user ?? null;

  if (userError && userError.message.includes("already been registered")) {
    const { data: usersData, error: listError } =
      await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
    if (listError) {
      await supabase.from("lojas").delete().eq("id", loja.id);
      return res.status(400).json({
        error: "E-mail já cadastrado no Auth, mas falhou ao localizar usuário.",
      });
    }

    adminUser =
      usersData.users.find(
        (user) => user.email?.toLowerCase() === normalizedEmail,
      ) ?? null;

    if (!adminUser) {
      await supabase.from("lojas").delete().eq("id", loja.id);
      return res.status(400).json({
        error:
          "E-mail já cadastrado no Auth, mas usuário não foi localizado. Tente outro e-mail.",
      });
    }
  } else if (userError || !adminUser) {
    await supabase.from("lojas").delete().eq("id", loja.id);
    return res
      .status(400)
      .json({ error: userError?.message || "Erro ao criar usuário admin" });
  }

  await supabase.auth.admin.updateUserById(adminUser.id, {
    email_confirm: true,
  });

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: adminUser.id,
      email: normalizedEmail,
      name: "Administrador",
      role: "admin",
      tenant_id: loja.id,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    return res.status(500).json({
      error:
        "Usuário criado, mas falhou ao criar profile. Verifique trigger/RLS.",
    });
  }

  return res.status(201).json({
    id: loja.id,
    slug: loja.slug,
    nome: loja.nome,
    adminUserId: adminUser.id,
  });
}
