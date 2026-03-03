CREATE TABLE IF NOT EXISTS public.promocoes_produto (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id uuid NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text,
  tipo_desconto text NOT NULL CHECK (tipo_desconto IN ('percentual', 'valor_fixo', 'preco_fixo')),
  valor_desconto numeric(12,2) NOT NULL,
  quantidade_minima integer NOT NULL DEFAULT 1,
  ativo boolean NOT NULL DEFAULT true,
  data_inicio timestamptz,
  data_fim timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT promocoes_produto_valor_non_negative CHECK (valor_desconto >= 0),
  CONSTRAINT promocoes_produto_quantidade_minima_positive CHECK (quantidade_minima >= 1),
  CONSTRAINT promocoes_produto_data_valida CHECK (data_fim IS NULL OR data_inicio IS NULL OR data_fim >= data_inicio),
  CONSTRAINT promocoes_produto_percentual_range CHECK (
    tipo_desconto <> 'percentual' OR (valor_desconto >= 0 AND valor_desconto <= 100)
  )
);

CREATE INDEX IF NOT EXISTS idx_promocoes_produto_produto_id
  ON public.promocoes_produto(produto_id);
CREATE INDEX IF NOT EXISTS idx_promocoes_produto_ativo
  ON public.promocoes_produto(ativo);
CREATE INDEX IF NOT EXISTS idx_promocoes_produto_periodo
  ON public.promocoes_produto(data_inicio, data_fim);

DROP TRIGGER IF EXISTS trg_promocoes_produto_updated_at ON public.promocoes_produto;
CREATE TRIGGER trg_promocoes_produto_updated_at
  BEFORE UPDATE ON public.promocoes_produto
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

ALTER TABLE public.promocoes_produto ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura pública de promoções ativas de produtos" ON public.promocoes_produto;
CREATE POLICY "Leitura pública de promoções ativas de produtos"
  ON public.promocoes_produto FOR SELECT
  USING (
    ativo = true
    AND (data_inicio IS NULL OR data_inicio <= now())
    AND (data_fim IS NULL OR data_fim >= now())
    AND EXISTS (
      SELECT 1
      FROM public.produtos pr
      WHERE pr.id = produto_id
        AND pr.ativo = true
        AND pr.exibircatalogo = true
    )
  );

DROP POLICY IF EXISTS "Admin gerencia promoções de produtos" ON public.promocoes_produto;
CREATE POLICY "Admin gerencia promoções de produtos"
  ON public.promocoes_produto FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
