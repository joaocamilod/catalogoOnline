export interface Profile {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  created_at?: string;
}

export type UserRole = "admin" | "user";

export interface Departamento {
  id: string;
  descricao: string;
  ativo: boolean;
  created_at?: string;
}

export interface Vendedor {
  id: string;
  nome: string;
  telefone_whatsapp: string;
  email: string;
  ativo: boolean;
  created_at?: string;
}

export interface ImagemProduto {
  id: string;
  produto_id: string;
  url: string;
  isimagemdestaque: boolean;
  created_at?: string;
}

export interface Produto {
  id: string;
  descricao: string;
  infadicional?: string;
  valorunitariocomercial: number;
  quantidademinima: number;
  destaque: boolean;
  ativo: boolean;
  exibircatalogo: boolean;
  departamento_id?: string;
  departamento?: Departamento;
  imagens?: ImagemProduto[];
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
  created_at?: string;
}

export interface CatalogProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  departamento_id?: string;
  image: string;
  imagens: ImagemProduto[];
  stock: number;
  featured: boolean;
  available: boolean;
  rating?: number;
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
}

export interface CartItem {
  product: CatalogProduct;
  quantity: number;
}

export function normalizeProduto(p: Produto): CatalogProduct {
  const imagensOrdenadas = [...(p.imagens ?? [])].sort((a, b) => {
    const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
    const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
    return ta - tb;
  });

  const imagemPrincipal =
    imagensOrdenadas[0]?.url ??
    "https://cdn.pixabay.com/photo/2019/04/16/10/35/box-4131401_1280.png";

  return {
    id: p.id,
    name: p.descricao,
    description: p.infadicional ?? "",
    price: p.valorunitariocomercial,
    category: p.departamento?.descricao ?? "",
    departamento_id: p.departamento_id,
    image: imagemPrincipal,
    imagens: imagensOrdenadas,
    stock: p.quantidademinima,
    featured: p.destaque,
    available: p.ativo && p.exibircatalogo,
    rating: 5,
    exibir_frete_gratis: p.exibir_frete_gratis ?? false,
    frete_gratis_valor_minimo: p.frete_gratis_valor_minimo ?? null,
    frete_gratis_texto: p.frete_gratis_texto ?? null,
    exibir_compra_segura: p.exibir_compra_segura ?? false,
    compra_segura_texto: p.compra_segura_texto ?? null,
    exibir_criptografia_ssl: p.exibir_criptografia_ssl ?? false,
    criptografia_ssl_texto: p.criptografia_ssl_texto ?? null,
    exibir_devolucao_gratis: p.exibir_devolucao_gratis ?? false,
    devolucao_dias: p.devolucao_dias ?? null,
    devolucao_texto: p.devolucao_texto ?? null,
    exibir_guia_tamanhos: p.exibir_guia_tamanhos ?? false,
    guia_tamanhos_link: p.guia_tamanhos_link ?? null,
    guia_tamanhos_texto: p.guia_tamanhos_texto ?? null,
    preco_original: p.preco_original ?? null,
    desconto_percentual: p.desconto_percentual ?? null,
    preco_pix: p.preco_pix ?? null,
    desconto_pix_percentual: p.desconto_pix_percentual ?? null,
    parcelas_quantidade: p.parcelas_quantidade ?? null,
    total_cartao: p.total_cartao ?? null,
    texto_adicional_preco: p.texto_adicional_preco ?? null,
  };
}
