ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS exibir_frete_gratis boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS frete_gratis_valor_minimo numeric(12,2),
  ADD COLUMN IF NOT EXISTS frete_gratis_texto text,

  ADD COLUMN IF NOT EXISTS exibir_compra_segura boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS compra_segura_texto text,

  ADD COLUMN IF NOT EXISTS exibir_criptografia_ssl boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS criptografia_ssl_texto text,

  ADD COLUMN IF NOT EXISTS exibir_devolucao_gratis boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS devolucao_dias integer,
  ADD COLUMN IF NOT EXISTS devolucao_texto text,

  ADD COLUMN IF NOT EXISTS exibir_guia_tamanhos boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS guia_tamanhos_link text,
  ADD COLUMN IF NOT EXISTS guia_tamanhos_texto text,

  ADD COLUMN IF NOT EXISTS preco_original numeric(12,2),
  ADD COLUMN IF NOT EXISTS desconto_percentual numeric(5,2),
  ADD COLUMN IF NOT EXISTS preco_pix numeric(12,2),
  ADD COLUMN IF NOT EXISTS desconto_pix_percentual numeric(5,2),
  ADD COLUMN IF NOT EXISTS parcelas_quantidade integer,
  ADD COLUMN IF NOT EXISTS total_cartao numeric(12,2),
  ADD COLUMN IF NOT EXISTS texto_adicional_preco text;

ALTER TABLE public.produtos
  ALTER COLUMN desconto_percentual SET DEFAULT 0,
  ALTER COLUMN desconto_pix_percentual SET DEFAULT 0,
  ALTER COLUMN parcelas_quantidade SET DEFAULT 12;

ALTER TABLE public.produtos
  ADD CONSTRAINT produtos_desconto_percentual_range
    CHECK (desconto_percentual IS NULL OR (desconto_percentual >= 0 AND desconto_percentual <= 100)),
  ADD CONSTRAINT produtos_desconto_pix_percentual_range
    CHECK (desconto_pix_percentual IS NULL OR (desconto_pix_percentual >= 0 AND desconto_pix_percentual <= 100)),
  ADD CONSTRAINT produtos_devolucao_dias_range
    CHECK (devolucao_dias IS NULL OR devolucao_dias >= 0),
  ADD CONSTRAINT produtos_parcelas_quantidade_range
    CHECK (parcelas_quantidade IS NULL OR parcelas_quantidade BETWEEN 1 AND 24),
  ADD CONSTRAINT produtos_precos_positive
    CHECK (
      (preco_original IS NULL OR preco_original >= 0)
      AND (preco_pix IS NULL OR preco_pix >= 0)
      AND (total_cartao IS NULL OR total_cartao >= 0)
      AND (frete_gratis_valor_minimo IS NULL OR frete_gratis_valor_minimo >= 0)
    );
