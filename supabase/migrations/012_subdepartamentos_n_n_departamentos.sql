CREATE TABLE IF NOT EXISTS public.subdepartamentos_departamentos (
  subdepartamento_id uuid NOT NULL REFERENCES public.subdepartamentos(id) ON DELETE CASCADE,
  departamento_id uuid NOT NULL REFERENCES public.departamentos(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (subdepartamento_id, departamento_id)
);

CREATE INDEX IF NOT EXISTS idx_subdeps_deps_departamento_id
  ON public.subdepartamentos_departamentos(departamento_id);

INSERT INTO public.subdepartamentos_departamentos (subdepartamento_id, departamento_id)
SELECT id, departamento_id
FROM public.subdepartamentos
WHERE departamento_id IS NOT NULL
ON CONFLICT (subdepartamento_id, departamento_id) DO NOTHING;

ALTER TABLE public.subdepartamentos_departamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública de vínculo subdepartamento-departamento"
  ON public.subdepartamentos_departamentos FOR SELECT
  USING (true);

CREATE POLICY "Admin gerencia vínculo subdepartamento-departamento"
  ON public.subdepartamentos_departamentos FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

ALTER TABLE public.subdepartamentos
  DROP CONSTRAINT IF EXISTS subdepartamentos_nome_departamento_unique;

ALTER TABLE public.subdepartamentos
  DROP COLUMN IF EXISTS departamento_id;
