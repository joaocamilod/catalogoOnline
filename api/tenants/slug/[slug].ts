import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

export default async function handler(req: any, res: any) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: "Supabase não configurado" });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { slug } = req.query;

  if (!slug || typeof slug !== "string") {
    return res.status(400).json({ error: "slug inválido" });
  }

  const { data, error } = await supabase
    .from("lojas")
    .select("id, slug, nome")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: "Loja não encontrada" });
  }

  return res.status(200).json(data);
}
