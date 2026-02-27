import { createClient } from "@supabase/supabase-js";

const env = ((globalThis as any).process?.env ?? {}) as Record<string, string | undefined>;
const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const supabaseServiceKey =
  env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

export default async function handler(req: any, res: any) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: "Supabase não configurado" });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { slug, nome } = req.body || {};
  if (!slug || !nome) {
    return res.status(400).json({ error: "slug e nome são obrigatórios" });
  }

  const { data, error } = await supabase
    .from("lojas")
    .insert({ slug: String(slug).toLowerCase().trim(), nome: String(nome).trim() })
    .select("id, slug, nome")
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(201).json(data);
}
