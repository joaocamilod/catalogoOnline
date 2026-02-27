import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Variáveis de ambiente do Supabase não configuradas. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env",
  );
}

const _lockHeld = new Set<string>();
const _lockQueue = new Map<string, Array<() => void>>();

function inMemoryLock<R>(
  name: string,
  _acquireTimeout: number,
  fn: () => Promise<R>,
): Promise<R> {
  return new Promise<R>((resolve, reject) => {
    const tryRun = () => {
      if (_lockHeld.has(name)) {
        if (!_lockQueue.has(name)) _lockQueue.set(name, []);
        _lockQueue.get(name)!.push(tryRun);
        return;
      }
      _lockHeld.add(name);
      fn()
        .then(resolve, reject)
        .finally(() => {
          _lockHeld.delete(name);
          const next = _lockQueue.get(name)?.shift();
          if (next) {
            next();
          } else {
            _lockQueue.delete(name);
          }
        });
    };
    tryRun();
  });
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key",
  {
    auth: {
      lock: inMemoryLock,
    },
  },
);

let activeTenantId: string | null = null;

export function setTenantContext(tenantId: string | null) {
  activeTenantId = tenantId;
}

function requireTenantId() {
  if (!activeTenantId) {
    throw new Error("Loja não encontrada");
  }
  return activeTenantId;
}

function withTenantFilter(query: any) {
  if (!activeTenantId) return query;
  return query.eq("tenant_id", activeTenantId);
}

export interface Loja {
  id: string;
  slug: string;
  nome: string;
}

export const DEFAULT_STORE_NAME = "Catálogo Online";

export interface StoreSettings {
  nome_loja: string;
  footer_descricao: string;
  footer_observacoes: string;
  facebook_url: string;
  instagram_url: string;
  twitter_url: string;
  youtube_url: string;
}

const DEFAULT_STORE_SETTINGS: StoreSettings = {
  nome_loja: DEFAULT_STORE_NAME,
  footer_descricao:
    "Sua loja virtual completa com os melhores produtos e preços do mercado. Qualidade e conveniência em um só lugar.",
  footer_observacoes: "",
  facebook_url: "",
  instagram_url: "",
  twitter_url: "",
  youtube_url: "",
};

function normalizeStoreSettings(
  data?: Partial<StoreSettings> | null,
): StoreSettings {
  return {
    nome_loja: data?.nome_loja?.trim() || DEFAULT_STORE_SETTINGS.nome_loja,
    footer_descricao:
      data?.footer_descricao?.trim() || DEFAULT_STORE_SETTINGS.footer_descricao,
    footer_observacoes: data?.footer_observacoes?.trim() || "",
    facebook_url: data?.facebook_url?.trim() || "",
    instagram_url: data?.instagram_url?.trim() || "",
    twitter_url: data?.twitter_url?.trim() || "",
    youtube_url: data?.youtube_url?.trim() || "",
  };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signUp(
  email: string,
  password: string,
  name: string,
  tenantId?: string | null,
  role: "admin" | "user" = "user",
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, tenant_id: tenantId ?? null, role } },
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
  let query = supabase.from("profiles").select("*").eq("id", userId);

  if (activeTenantId) {
    query = query.eq("tenant_id", activeTenantId);
  }

  const { data, error } = await query.single();
  if (error) throw error;
  return data;
}

export async function fetchLojasPublic() {
  const { data, error } = await supabase
    .from("lojas")
    .select("id, slug, nome")
    .order("nome", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Loja[];
}

export async function fetchLojaBySlug(slug: string) {
  const { data, error } = await supabase
    .from("lojas")
    .select("id, slug, nome")
    .eq("slug", slug)
    .single();
  if (error) throw error;
  return data as Loja;
}

export async function fetchLojaById(id: string) {
  const { data, error } = await supabase
    .from("lojas")
    .select("id, slug, nome")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Loja;
}

export async function createLoja(payload: { slug: string; nome: string }) {
  const { data, error } = await supabase
    .from("lojas")
    .insert({
      slug: payload.slug.trim().toLowerCase(),
      nome: payload.nome.trim(),
    })
    .select("id, slug, nome")
    .single();
  if (error) throw error;
  return data as Loja;
}

export async function fetchDepartamentos(page = 1, limit = 20, search = "") {
  let query = withTenantFilter(
    supabase
      .from("departamentos")
      .select("*", { count: "exact" })
      .eq("ativo", true)
      .order("descricao", { ascending: true })
      .range((page - 1) * limit, page * limit - 1),
  );

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
  const { data, error } = await withTenantFilter(
    supabase
      .from("departamentos")
      .select("*")
      .eq("ativo", true)
      .order("descricao", { ascending: true }),
  );
  if (error) throw error;
  return data ?? [];
}

export async function fetchDepartamentosComProdutos() {
  const tenantId = requireTenantId();
  const { data, error } = await supabase
    .from("departamentos")
    .select("id, descricao, ativo, produtos!inner(id)")
    .eq("tenant_id", tenantId)
    .eq("ativo", true)
    .eq("produtos.tenant_id", tenantId)
    .eq("produtos.ativo", true)
    .eq("produtos.exibircatalogo", true)
    .order("descricao", { ascending: true });

  if (error) throw error;
  const unique = new Map<
    string,
    { id: string; descricao: string; ativo: boolean }
  >();
  for (const row of data ?? []) {
    unique.set((row as any).id, {
      id: (row as any).id,
      descricao: (row as any).descricao,
      ativo: (row as any).ativo ?? true,
    });
  }
  return [...unique.values()];
}

async function attachDepartamentosToSubdepartamentos<
  T extends { id: string; nome: string; created_at?: string },
>(subdepartamentos: T[]) {
  if (subdepartamentos.length === 0) {
    return [] as Array<
      T & {
        departamento_ids: string[];
        departamentos: { id: string; descricao: string; ativo: boolean }[];
      }
    >;
  }

  const ids = subdepartamentos.map((item) => item.id);
  const { data: links, error } = await withTenantFilter(
    supabase
      .from("subdepartamentos_departamentos")
      .select(
        "subdepartamento_id, departamento:departamentos(id, descricao, ativo)",
      )
      .in("subdepartamento_id", ids),
  );

  if (error) throw error;

  const bySubdepId = new Map<
    string,
    {
      departamento_ids: string[];
      departamentos: { id: string; descricao: string; ativo: boolean }[];
    }
  >();

  for (const link of links ?? []) {
    const subId = (link as any).subdepartamento_id as string;
    const dep = (link as any).departamento as {
      id: string;
      descricao: string;
      ativo?: boolean;
    } | null;
    if (!dep) continue;

    if (!bySubdepId.has(subId)) {
      bySubdepId.set(subId, { departamento_ids: [], departamentos: [] });
    }

    bySubdepId.get(subId)!.departamento_ids.push(dep.id);
    bySubdepId.get(subId)!.departamentos.push({
      id: dep.id,
      descricao: dep.descricao,
      ativo: dep.ativo ?? true,
    });
  }

  return subdepartamentos.map((item) => {
    const rel = bySubdepId.get(item.id) ?? {
      departamento_ids: [],
      departamentos: [],
    };
    return { ...item, ...rel };
  });
}

export async function fetchSubdepartamentos(
  page = 1,
  limit = 20,
  search = "",
  departamentoId = "",
) {
  let query = withTenantFilter(
    supabase
      .from("subdepartamentos")
      .select("*", { count: "exact" })
      .order("nome", { ascending: true })
      .range((page - 1) * limit, page * limit - 1),
  );

  if (search.trim()) {
    query = query.ilike("nome", `%${search.trim()}%`);
  }
  if (departamentoId) {
    const { data: links, error: linksError } = await withTenantFilter(
      supabase
        .from("subdepartamentos_departamentos")
        .select("subdepartamento_id")
        .eq("departamento_id", departamentoId),
    );
    if (linksError) throw linksError;

    const ids = [
      ...new Set((links ?? []).map((item: any) => item.subdepartamento_id)),
    ];
    if (ids.length === 0) {
      return { subdepartamentos: [], totalPages: 1 };
    }
    query = query.in("id", ids);
  }

  const { data, count, error } = await query;
  if (error) throw error;
  const enriched = await attachDepartamentosToSubdepartamentos(data ?? []);
  return {
    subdepartamentos: enriched,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

export async function fetchAllSubdepartamentos(departamentoId = "") {
  let query = withTenantFilter(
    supabase
      .from("subdepartamentos")
      .select("*")
      .order("nome", { ascending: true }),
  );

  if (departamentoId) {
    const { data: links, error: linksError } = await withTenantFilter(
      supabase
        .from("subdepartamentos_departamentos")
        .select("subdepartamento_id")
        .eq("departamento_id", departamentoId),
    );
    if (linksError) throw linksError;

    const ids = [
      ...new Set((links ?? []).map((item: any) => item.subdepartamento_id)),
    ];
    if (ids.length === 0) return [];
    query = query.in("id", ids);
  }

  const { data, error } = await query;
  if (error) throw error;
  return attachDepartamentosToSubdepartamentos(data ?? []);
}

export async function fetchSubdepartamentosComProdutos() {
  const tenantId = requireTenantId();
  const { data, error } = await supabase
    .from("subdepartamentos")
    .select("id, nome, produtos!inner(id)")
    .eq("tenant_id", tenantId)
    .eq("produtos.tenant_id", tenantId)
    .eq("produtos.ativo", true)
    .eq("produtos.exibircatalogo", true)
    .order("nome", { ascending: true });

  if (error) throw error;
  const unique = new Map<string, { id: string; nome: string }>();
  for (const row of data ?? []) {
    unique.set((row as any).id, {
      id: (row as any).id,
      nome: (row as any).nome,
    });
  }
  const normalized = [...unique.values()];
  return attachDepartamentosToSubdepartamentos(normalized);
}

export async function createSubdepartamento(
  nome: string,
  departamentoIds: string[],
) {
  const uniqueDepartamentoIds = [...new Set(departamentoIds.filter(Boolean))];
  if (uniqueDepartamentoIds.length === 0) {
    throw new Error("Informe ao menos um departamento.");
  }

  const tenantId = requireTenantId();
  const { data, error } = await supabase
    .from("subdepartamentos")
    .insert({ nome: nome.trim(), tenant_id: tenantId })
    .select()
    .single();
  if (error) throw error;

  const { error: linksError } = await supabase
    .from("subdepartamentos_departamentos")
    .insert(
      uniqueDepartamentoIds.map((departamentoId) => ({
        subdepartamento_id: data.id,
        departamento_id: departamentoId,
        tenant_id: tenantId,
      })),
    );
  if (linksError) throw linksError;

  return data;
}

export async function updateSubdepartamento(
  id: string,
  nome: string,
  departamentoIds: string[],
) {
  const uniqueDepartamentoIds = [...new Set(departamentoIds.filter(Boolean))];
  if (uniqueDepartamentoIds.length === 0) {
    throw new Error("Informe ao menos um departamento.");
  }

  const tenantId = requireTenantId();
  const { data, error } = await supabase
    .from("subdepartamentos")
    .update({ nome: nome.trim() })
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .select()
    .single();
  if (error) throw error;

  const { error: deleteLinksError } = await supabase
    .from("subdepartamentos_departamentos")
    .delete()
    .eq("subdepartamento_id", id)
    .eq("tenant_id", tenantId);
  if (deleteLinksError) throw deleteLinksError;

  const { error: insertLinksError } = await supabase
    .from("subdepartamentos_departamentos")
    .insert(
      uniqueDepartamentoIds.map((departamentoId) => ({
        subdepartamento_id: id,
        departamento_id: departamentoId,
        tenant_id: tenantId,
      })),
    );
  if (insertLinksError) throw insertLinksError;

  return data;
}

export async function deleteSubdepartamento(id: string) {
  const tenantId = requireTenantId();
  const { error } = await supabase
    .from("subdepartamentos")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId);
  if (error) throw error;
}

export async function fetchMarcas(page = 1, limit = 20, search = "") {
  let query = withTenantFilter(
    supabase
      .from("marcas")
      .select("*", { count: "exact" })
      .order("nome", { ascending: true })
      .range((page - 1) * limit, page * limit - 1),
  );

  if (search.trim()) {
    query = query.ilike("nome", `%${search.trim()}%`);
  }

  const { data, count, error } = await query;
  if (error) throw error;
  return {
    marcas: data ?? [],
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

export async function fetchAllMarcas() {
  const { data, error } = await withTenantFilter(
    supabase.from("marcas").select("*").order("nome", { ascending: true }),
  );
  if (error) throw error;
  return data ?? [];
}

export async function fetchMarcasComProdutos() {
  const tenantId = requireTenantId();
  const { data, error } = await supabase
    .from("marcas")
    .select("id, nome, produtos!inner(id)")
    .eq("tenant_id", tenantId)
    .eq("produtos.tenant_id", tenantId)
    .eq("produtos.ativo", true)
    .eq("produtos.exibircatalogo", true)
    .order("nome", { ascending: true });

  if (error) throw error;
  const unique = new Map<string, { id: string; nome: string }>();
  for (const row of data ?? []) {
    unique.set((row as any).id, {
      id: (row as any).id,
      nome: (row as any).nome,
    });
  }
  return [...unique.values()];
}

export async function createMarca(nome: string) {
  const tenantId = requireTenantId();
  const { data, error } = await supabase
    .from("marcas")
    .insert({ nome: nome.trim(), tenant_id: tenantId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateMarca(id: string, nome: string) {
  const tenantId = requireTenantId();
  const { data, error } = await supabase
    .from("marcas")
    .update({ nome: nome.trim() })
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMarca(id: string) {
  const tenantId = requireTenantId();
  const { error } = await supabase
    .from("marcas")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId);
  if (error) throw error;
}

export async function createDepartamento(descricao: string, ativo: boolean) {
  const tenantId = requireTenantId();
  const { data, error } = await supabase
    .from("departamentos")
    .insert({ descricao, ativo, tenant_id: tenantId })
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
  const tenantId = requireTenantId();
  const { data, error } = await supabase
    .from("departamentos")
    .update({ descricao, ativo })
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDepartamento(id: string) {
  const tenantId = requireTenantId();
  const { error } = await supabase
    .from("departamentos")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId);
  if (error) throw error;
}

export async function fetchVendedores(page = 1, limit = 20, search = "") {
  let query = withTenantFilter(
    supabase
      .from("vendedores")
      .select("*", { count: "exact" })
      .order("nome", { ascending: true })
      .range((page - 1) * limit, page * limit - 1),
  );

  if (search.trim()) {
    query = query.or(
      `nome.ilike.%${search.trim()}%,telefone_whatsapp.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`,
    );
  }

  const { data, count, error } = await query;
  if (error) throw error;
  return {
    vendedores: data ?? [],
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

export async function fetchAllVendedores() {
  const { data, error } = await withTenantFilter(
    supabase
      .from("vendedores")
      .select("*")
      .eq("ativo", true)
      .order("nome", { ascending: true }),
  );

  if (error) throw error;
  return data ?? [];
}

export async function createVendedor(
  nome: string,
  telefoneWhatsapp: string,
  email: string,
  ativo: boolean,
) {
  const tenantId = requireTenantId();
  const normalizedTelefone = telefoneWhatsapp.trim();
  const normalizedEmail = email.trim();

  if (!normalizedTelefone && !normalizedEmail) {
    throw new Error("Informe telefone/whatsapp ou email do vendedor.");
  }

  const { data, error } = await supabase
    .from("vendedores")
    .insert({
      nome: nome.trim(),
      telefone_whatsapp: normalizedTelefone,
      email: normalizedEmail,
      ativo,
      tenant_id: tenantId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateVendedor(
  id: string,
  nome: string,
  telefoneWhatsapp: string,
  email: string,
  ativo: boolean,
) {
  const tenantId = requireTenantId();
  const normalizedTelefone = telefoneWhatsapp.trim();
  const normalizedEmail = email.trim();

  if (!normalizedTelefone && !normalizedEmail) {
    throw new Error("Informe telefone/whatsapp ou email do vendedor.");
  }

  const { data, error } = await supabase
    .from("vendedores")
    .update({
      nome: nome.trim(),
      telefone_whatsapp: normalizedTelefone,
      email: normalizedEmail,
      ativo,
    })
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteVendedor(id: string) {
  const tenantId = requireTenantId();
  const { error } = await supabase
    .from("vendedores")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId);
  if (error) throw error;
}

export async function fetchProdutos(
  page = 1,
  limit = 20,
  search = "",
  departamentoId = "",
) {
  const tenantId = requireTenantId();
  let query = supabase
    .from("produtos")
    .select(
      `
      *,
      departamento:departamentos(id, descricao),
      subdepartamento:subdepartamentos(id, nome),
      marca:marcas(id, nome),
      imagens:imagens_produto(*)
    `,
      { count: "planned" },
    )
    .eq("tenant_id", tenantId)
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
  const tenantId = requireTenantId();
  const { data, error } = await supabase
    .from("produtos")
    .select(
      `
      *,
      departamento:departamentos(id, descricao),
      subdepartamento:subdepartamentos(id, nome),
      marca:marcas(id, nome),
      imagens:imagens_produto(*)
    `,
    )
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();
  if (error) throw error;
  return data;
}

export async function fetchTodosProdutos(page = 1, limit = 20, search = "") {
  const tenantId = requireTenantId();
  let query = supabase
    .from("produtos")
    .select(
      `
      *,
      departamento:departamentos(id, descricao),
      subdepartamento:subdepartamentos(id, nome),
      marca:marcas(id, nome),
      imagens:imagens_produto(*)
    `,
      { count: "planned" },
    )
    .eq("tenant_id", tenantId)
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
  subdepartamento_id?: string;
  marca_id?: string;
  exibir_frete_gratis?: boolean;
  frete_gratis_valor_minimo?: number | null;
  frete_gratis_texto?: string | null;
  exibir_compra_segura?: boolean;
  compra_segura_texto?: string | null;
  exibir_criptografia_ssl?: boolean;
  criptografia_ssl_texto?: string | null;
  exibir_devolucao_gratis?: boolean;
  devolucao_dias?: number | null;
  devolucao_texto?: string | null;
  exibir_guia_tamanhos?: boolean;
  guia_tamanhos_link?: string | null;
  guia_tamanhos_texto?: string | null;
  preco_original?: number | null;
  desconto_percentual?: number | null;
  preco_pix?: number | null;
  desconto_pix_percentual?: number | null;
  parcelas_quantidade?: number | null;
  total_cartao?: number | null;
  texto_adicional_preco?: string | null;
}) {
  const tenantId = requireTenantId();
  const { data, error } = await supabase
    .from("produtos")
    .insert({
      ...produto,
      tenant_id: tenantId,
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
    subdepartamento_id?: string;
    marca_id?: string;
    exibir_frete_gratis?: boolean;
    frete_gratis_valor_minimo?: number | null;
    frete_gratis_texto?: string | null;
    exibir_compra_segura?: boolean;
    compra_segura_texto?: string | null;
    exibir_criptografia_ssl?: boolean;
    criptografia_ssl_texto?: string | null;
    exibir_devolucao_gratis?: boolean;
    devolucao_dias?: number | null;
    devolucao_texto?: string | null;
    exibir_guia_tamanhos?: boolean;
    guia_tamanhos_link?: string | null;
    guia_tamanhos_texto?: string | null;
    preco_original?: number | null;
    desconto_percentual?: number | null;
    preco_pix?: number | null;
    desconto_pix_percentual?: number | null;
    parcelas_quantidade?: number | null;
    total_cartao?: number | null;
    texto_adicional_preco?: string | null;
  },
) {
  const tenantId = requireTenantId();
  const { data, error } = await supabase
    .from("produtos")
    .update(produto)
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProduto(id: string) {
  const tenantId = requireTenantId();
  const { error } = await supabase
    .from("produtos")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId);
  if (error) throw error;
}

export async function addImagemProduto(
  produtoId: string,
  url: string,
  isimagemdestaque = false,
) {
  const tenantId = requireTenantId();
  const { data, error } = await supabase
    .from("imagens_produto")
    .insert({
      produto_id: produtoId,
      url,
      isimagemdestaque,
      tenant_id: tenantId,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteImagemProduto(id: string) {
  const tenantId = requireTenantId();
  const { error } = await supabase
    .from("imagens_produto")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId);
  if (error) throw error;
}

export async function updateImagemDestaque(
  produtoId: string,
  imagemId: string,
) {
  const tenantId = requireTenantId();
  await supabase
    .from("imagens_produto")
    .update({ isimagemdestaque: false })
    .eq("produto_id", produtoId)
    .eq("tenant_id", tenantId);
  const { data, error } = await supabase
    .from("imagens_produto")
    .update({ isimagemdestaque: true })
    .eq("id", imagemId)
    .eq("tenant_id", tenantId)
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

export async function fetchStoreSettings(): Promise<StoreSettings> {
  const tenantId = requireTenantId();
  const { data, error } = await supabase
    .from("loja_config")
    .select(
      "nome_loja, footer_descricao, footer_observacoes, facebook_url, instagram_url, twitter_url, youtube_url",
    )
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) throw error;
  return normalizeStoreSettings(data);
}

export async function updateStoreSettings(
  settings: Partial<StoreSettings>,
): Promise<StoreSettings> {
  const tenantId = requireTenantId();
  const normalizedName = settings.nome_loja?.trim();

  if (normalizedName !== undefined && !normalizedName) {
    throw new Error("Informe um nome válido para a loja.");
  }

  const payload = {
    tenant_id: tenantId,
    ...(settings.nome_loja !== undefined ? { nome_loja: normalizedName } : {}),
    ...(settings.footer_descricao !== undefined
      ? { footer_descricao: settings.footer_descricao.trim() }
      : {}),
    ...(settings.footer_observacoes !== undefined
      ? { footer_observacoes: settings.footer_observacoes.trim() }
      : {}),
    ...(settings.facebook_url !== undefined
      ? { facebook_url: settings.facebook_url.trim() }
      : {}),
    ...(settings.instagram_url !== undefined
      ? { instagram_url: settings.instagram_url.trim() }
      : {}),
    ...(settings.twitter_url !== undefined
      ? { twitter_url: settings.twitter_url.trim() }
      : {}),
    ...(settings.youtube_url !== undefined
      ? { youtube_url: settings.youtube_url.trim() }
      : {}),
  };

  const { data, error } = await supabase
    .from("loja_config")
    .upsert(payload, { onConflict: "tenant_id" })
    .select(
      "nome_loja, footer_descricao, footer_observacoes, facebook_url, instagram_url, twitter_url, youtube_url",
    )
    .single();

  if (error) throw error;
  return normalizeStoreSettings(data);
}

export interface ItemVenda {
  produto_id: string;
  nome: string;
  preco: number;
  quantidade: number;
  imagem?: string;
}

export interface CriarVendaParams {
  vendedor_id: string;
  itens: ItemVenda[];
  total: number;
  comprador_nome?: string;
  comprador_telefone?: string;
  comprador_email?: string;
  url_imagem?: string;
  texto_mensagem?: string;
  meio_pagamento?: string;
}

export async function createSale(params: CriarVendaParams) {
  const tenantId = requireTenantId();
  const { data, error } = await supabase
    .from("vendas")
    .insert({
      tenant_id: tenantId,
      vendedor_id: params.vendedor_id,
      itens: params.itens,
      total: params.total,
      comprador_nome: params.comprador_nome?.trim() || null,
      comprador_telefone: params.comprador_telefone?.trim() || null,
      comprador_email: params.comprador_email?.trim() || null,
      url_imagem: params.url_imagem || null,
      texto_mensagem: params.texto_mensagem || null,
      meio_pagamento: params.meio_pagamento || null,
      status: "pendente",
      whatsapp_enviado: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchVendas(page = 1, limit = 20) {
  const tenantId = requireTenantId();
  const { data, count, error } = await supabase
    .from("vendas")
    .select("*, vendedor:vendedores(id, nome, telefone_whatsapp)", {
      count: "exact",
    })
    .eq("tenant_id", tenantId)
    .order("criado_em", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (error) throw error;
  return {
    vendas: data ?? [],
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

import type { CatalogoTema } from "../types";

export async function fetchTemas(page = 1, limit = 20, search = "") {
  let query = withTenantFilter(
    supabase
      .from("catalogo_temas")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1),
  );

  if (search.trim()) {
    query = query.ilike("nome", `%${search.trim()}%`);
  }

  const { data, count, error } = await query;
  if (error) throw error;
  return {
    temas: (data ?? []) as CatalogoTema[],
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

export async function fetchTemaAtivo(): Promise<CatalogoTema | null> {
  const { data, error } = await withTenantFilter(
    supabase.from("catalogo_temas").select("*").eq("ativo", true).maybeSingle(),
  );

  if (error) throw error;
  return data as CatalogoTema | null;
}

export async function createTema(
  tema: Omit<CatalogoTema, "id" | "created_at" | "updated_at">,
) {
  const tenantId = requireTenantId();
  const { data, error } = await supabase
    .from("catalogo_temas")
    .insert({ ...tema, tenant_id: tenantId })
    .select()
    .single();
  if (error) throw error;
  return data as CatalogoTema;
}

export async function updateTema(
  id: string,
  tema: Partial<Omit<CatalogoTema, "id" | "created_at" | "updated_at">>,
) {
  const tenantId = requireTenantId();
  const { data, error } = await supabase
    .from("catalogo_temas")
    .update(tema)
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .select()
    .single();
  if (error) throw error;
  return data as CatalogoTema;
}

export async function deleteTema(id: string) {
  const tenantId = requireTenantId();
  const { error } = await supabase
    .from("catalogo_temas")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId);
  if (error) throw error;
}

export async function ativarTema(id: string) {
  const tenantId = requireTenantId();
  const { data, error } = await supabase
    .from("catalogo_temas")
    .update({ ativo: true })
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .select()
    .single();
  if (error) throw error;
  return data as CatalogoTema;
}

export async function desativarTema(id: string) {
  const tenantId = requireTenantId();
  const { data, error } = await supabase
    .from("catalogo_temas")
    .update({ ativo: false })
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .select()
    .single();
  if (error) throw error;
  return data as CatalogoTema;
}

export async function fetchStoreName(): Promise<string> {
  const settings = await fetchStoreSettings();
  return settings.nome_loja;
}

export async function updateStoreName(nomeLoja: string): Promise<string> {
  const settings = await updateStoreSettings({ nome_loja: nomeLoja });
  return settings.nome_loja;
}
