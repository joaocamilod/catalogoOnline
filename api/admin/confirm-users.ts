import { createClient } from "@supabase/supabase-js";

const env = ((globalThis as any).process?.env ?? {}) as Record<string, string | undefined>;
const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Endpoint de uso único para confirmar os emails de todos os usuários existentes.
 * Chame com: POST /api/admin/confirm-users
 * Body: { "secret": "<valor de ADMIN_SECRET env var>" }
 *
 * Isso resolve o erro "invalid_credentials" para contas antigas cujo email
 * nunca foi confirmado.
 */
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({
      error: "SUPABASE_SERVICE_ROLE_KEY não configurada no servidor.",
    });
  }

  const adminSecret = env.ADMIN_SECRET;
  const { secret } = req.body || {};

  if (adminSecret && secret !== adminSecret) {
    return res.status(401).json({ error: "Não autorizado." });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let page = 1;
  const perPage = 1000;
  let totalConfirmed = 0;
  let totalSkipped = 0;
  const errors: string[] = [];

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });

    if (error) {
      return res.status(500).json({ error: `Erro ao listar usuários: ${error.message}` });
    }

    if (!data || data.users.length === 0) break;

    for (const user of data.users) {
      if (user.email_confirmed_at) {
        totalSkipped++;
        continue;
      }

      const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { email_confirm: true },
      );

      if (updateError) {
        errors.push(`${user.email}: ${updateError.message}`);
      } else {
        totalConfirmed++;
      }
    }

    if (data.users.length < perPage) break;
    page++;
  }

  return res.status(200).json({
    message: `Concluído. ${totalConfirmed} emails confirmados, ${totalSkipped} já confirmados.`,
    errors: errors.length > 0 ? errors : undefined,
  });
}
