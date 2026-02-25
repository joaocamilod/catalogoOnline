import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Variáveis de ambiente do Supabase não configuradas. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env",
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key",
);

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

export async function fetchDepartamentos(page = 1, limit = 20, search = "") {
  let query = supabase
    .from("departamentos")
    .select("*", { count: "exact" })
    .eq("ativo", true)
    .order("descricao", { ascending: true })
    .range((page - 1) * limit, page * limit - 1);

  if (search.trim()) {
    query = query.ilike("descricao", `%${search.trim()}%`);
  }

  const { data, count, error } = await query;
  if (error) throw error;
  return {
    departamentos: data ?? [],
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

export async function fetchAllDepartamentos() {
  const { data, error } = await supabase
    .from("departamentos")
    .select("*")
    .eq("ativo", true)
    .order("descricao", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createDepartamento(descricao: string, ativo: boolean) {
  const { data, error } = await supabase
    .from("departamentos")
    .insert({ descricao, ativo })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDepartamento(
  id: string,
  descricao: string,
  ativo: boolean,
) {
  const { data, error } = await supabase
    .from("departamentos")
    .update({ descricao, ativo })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDepartamento(id: string) {
  const { error } = await supabase.from("departamentos").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchProdutos(
  page = 1,
  limit = 20,
  search = "",
  departamentoId = "",
) {
  let query = supabase
    .from("produtos")
    .select(
      `
      *,
      departamento:departamentos(id, descricao),
      imagens:imagens_produto(*)
    `,
      { count: "exact" },
    )
    .eq("ativo", true)
    .eq("exibircatalogo", true)
    .order("descricao", { ascending: true })
    .range((page - 1) * limit, page * limit - 1);

  if (search.trim()) {
    query = query.ilike("descricao", `%${search.trim()}%`);
  }
  if (departamentoId) {
    query = query.eq("departamento_id", departamentoId);
  }

  const { data, count, error } = await query;
  if (error) throw error;
  return {
    produtos: data ?? [],
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

export async function fetchProdutoById(id: string) {
  const { data, error } = await supabase
    .from("produtos")
    .select(
      `
      *,
      departamento:departamentos(id, descricao),
      imagens:imagens_produto(*)
    `,
    )
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function fetchTodosProdutos(page = 1, limit = 20, search = "") {
  let query = supabase
    .from("produtos")
    .select(
      `
      *,
      departamento:departamentos(id, descricao),
      imagens:imagens_produto(*)
    `,
      { count: "exact" },
    )
    .order("descricao", { ascending: true })
    .range((page - 1) * limit, page * limit - 1);

  if (search.trim()) {
    query = query.ilike("descricao", `%${search.trim()}%`);
  }

  const { data, count, error } = await query;
  if (error) throw error;
  return {
    produtos: data ?? [],
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

export async function createProduto(produto: {
  descricao: string;
  infadicional?: string;
  valorunitariocomercial: number;
  quantidademinima: number;
  destaque?: boolean;
  ativo?: boolean;
  exibircatalogo?: boolean;
  departamento_id?: string;
}) {
  const { data, error } = await supabase
    .from("produtos")
    .insert({
      ...produto,
      destaque: produto.destaque ?? false,
      ativo: produto.ativo ?? true,
      exibircatalogo: produto.exibircatalogo ?? true,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProduto(
  id: string,
  produto: {
    descricao?: string;
    infadicional?: string;
    valorunitariocomercial?: number;
    quantidademinima?: number;
    destaque?: boolean;
    ativo?: boolean;
    exibircatalogo?: boolean;
    departamento_id?: string;
  },
) {
  const { data, error } = await supabase
    .from("produtos")
    .update(produto)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProduto(id: string) {
  const { error } = await supabase.from("produtos").delete().eq("id", id);
  if (error) throw error;
}

export async function addImagemProduto(
  produtoId: string,
  url: string,
  isimagemdestaque = false,
) {
  const { data, error } = await supabase
    .from("imagens_produto")
    .insert({ produto_id: produtoId, url, isimagemdestaque })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteImagemProduto(id: string) {
  const { error } = await supabase
    .from("imagens_produto")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function updateImagemDestaque(
  produtoId: string,
  imagemId: string,
) {
  await supabase
    .from("imagens_produto")
    .update({ isimagemdestaque: false })
    .eq("produto_id", produtoId);
  const { data, error } = await supabase
    .from("imagens_produto")
    .update({ isimagemdestaque: true })
    .eq("id", imagemId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function uploadImagemProduto(
  file: File,
  produtoId: string,
): Promise<string> {
  const ext = file.name.split(".").pop();
  const fileName = `${produtoId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("produtos")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });
  if (error) throw error;

  const { data } = supabase.storage.from("produtos").getPublicUrl(fileName);
  return data.publicUrl;
}

export async function deleteImagemStorage(url: string) {
  const path = url.split("/storage/v1/object/public/produtos/")[1];
  if (!path) return;
  await supabase.storage.from("produtos").remove([path]);
}
