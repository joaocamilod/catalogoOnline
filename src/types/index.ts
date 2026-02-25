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
}

export interface CartItem {
  product: CatalogProduct;
  quantity: number;
}

export function normalizeProduto(p: Produto): CatalogProduct {
  const imagemPrincipal =
    p.imagens?.find((i) => i.isimagemdestaque)?.url ??
    p.imagens?.[0]?.url ??
    "https://cdn.pixabay.com/photo/2019/04/16/10/35/box-4131401_1280.png";

  return {
    id: p.id,
    name: p.descricao,
    description: p.infadicional ?? "",
    price: p.valorunitariocomercial,
    category: p.departamento?.descricao ?? "",
    departamento_id: p.departamento_id,
    image: imagemPrincipal,
    imagens: p.imagens ?? [],
    stock: p.quantidademinima,
    featured: p.destaque,
    available: p.ativo && p.exibircatalogo,
    rating: 5,
  };
}
