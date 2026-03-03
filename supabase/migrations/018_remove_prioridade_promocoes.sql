DROP INDEX IF EXISTS public.idx_promocoes_produto_prioridade;

ALTER TABLE public.promocoes_produto
  DROP COLUMN IF EXISTS prioridade;
