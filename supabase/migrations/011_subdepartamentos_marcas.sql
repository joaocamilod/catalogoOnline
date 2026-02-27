CREATE TABLE IF NOT EXISTS public.subdepartamentos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome text NOT NULL,
  departamento_id uuid NOT NULL REFERENCES public.departamentos(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT subdepartamentos_nome_departamento_unique UNIQUE (nome, departamento_id)
);

CREATE TABLE IF NOT EXISTS public.marcas (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS subdepartamento_id uuid REFERENCES public.subdepartamentos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS marca_id uuid REFERENCES public.marcas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_subdepartamentos_departamento_id
  ON public.subdepartamentos(departamento_id);

CREATE INDEX IF NOT EXISTS idx_produtos_subdepartamento
  ON public.produtos(subdepartamento_id);

CREATE INDEX IF NOT EXISTS idx_produtos_marca
  ON public.produtos(marca_id);

ALTER TABLE public.subdepartamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública de subdepartamentos"
  ON public.subdepartamentos FOR SELECT
  USING (true);

CREATE POLICY "Admin gerencia subdepartamentos"
  ON public.subdepartamentos FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

ALTER TABLE public.marcas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública de marcas"
  ON public.marcas FOR SELECT
  USING (true);

CREATE POLICY "Admin gerencia marcas"
  ON public.marcas FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
