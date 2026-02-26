ALTER TABLE public.vendas
  ADD COLUMN IF NOT EXISTS meio_pagamento text;

COMMENT ON COLUMN public.vendas.meio_pagamento IS
  'Forma de pagamento escolhida pelo comprador: pix | credito | debito | dinheiro';
