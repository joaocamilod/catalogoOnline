ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS variacoes jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.produtos
SET variacoes = '[]'::jsonb
WHERE variacoes IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'produtos_variacoes_is_array'
  ) THEN
    ALTER TABLE public.produtos
      ADD CONSTRAINT produtos_variacoes_is_array
      CHECK (jsonb_typeof(variacoes) = 'array');
  END IF;
END;
$$;
