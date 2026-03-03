CREATE INDEX IF NOT EXISTS idx_produtos_catalogo_created_at
  ON public.produtos(created_at DESC)
  WHERE ativo = true AND exibircatalogo = true;

CREATE INDEX IF NOT EXISTS idx_catalogo_temas_created_at
  ON public.catalogo_temas(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vendedores_ativos_nome
  ON public.vendedores(ativo, nome);
