CREATE TABLE IF NOT EXISTS public.lojas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  nome text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.lojas (id, slug, nome)
VALUES ('00000000-0000-0000-0000-000000000001', 'global-default', 'Global Default')
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.lojas(id);

ALTER TABLE public.departamentos
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.lojas(id);
ALTER TABLE public.subdepartamentos
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.lojas(id);
ALTER TABLE public.marcas
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.lojas(id);
ALTER TABLE public.vendedores
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.lojas(id);
ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.lojas(id);
ALTER TABLE public.imagens_produto
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.lojas(id);
ALTER TABLE public.vendas
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.lojas(id);
ALTER TABLE public.catalogo_temas
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.lojas(id);
ALTER TABLE public.loja_config
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.lojas(id);
ALTER TABLE public.subdepartamentos_departamentos
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.lojas(id);

UPDATE public.profiles SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.departamentos SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.subdepartamentos SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.marcas SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.vendedores SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.produtos SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.imagens_produto SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.vendas SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.catalogo_temas SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.loja_config SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.subdepartamentos_departamentos SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;

ALTER TABLE public.profiles ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.departamentos ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.subdepartamentos ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.marcas ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.vendedores ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.produtos ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.imagens_produto ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.vendas ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.catalogo_temas ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.loja_config ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.subdepartamentos_departamentos ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.loja_config DROP CONSTRAINT IF EXISTS loja_config_single_row;
ALTER TABLE public.loja_config DROP CONSTRAINT IF EXISTS loja_config_pkey;
CREATE UNIQUE INDEX IF NOT EXISTS idx_loja_config_tenant ON public.loja_config (tenant_id);

CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON public.profiles (tenant_id);
CREATE INDEX IF NOT EXISTS idx_departamentos_tenant ON public.departamentos (tenant_id);
CREATE INDEX IF NOT EXISTS idx_subdepartamentos_tenant ON public.subdepartamentos (tenant_id);
CREATE INDEX IF NOT EXISTS idx_marcas_tenant ON public.marcas (tenant_id);
CREATE INDEX IF NOT EXISTS idx_vendedores_tenant ON public.vendedores (tenant_id);
CREATE INDEX IF NOT EXISTS idx_produtos_tenant ON public.produtos (tenant_id);
CREATE INDEX IF NOT EXISTS idx_imagens_produto_tenant ON public.imagens_produto (tenant_id);
CREATE INDEX IF NOT EXISTS idx_vendas_tenant ON public.vendas (tenant_id);
CREATE INDEX IF NOT EXISTS idx_temas_tenant ON public.catalogo_temas (tenant_id);
CREATE INDEX IF NOT EXISTS idx_subdep_dep_tenant ON public.subdepartamentos_departamentos (tenant_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  new_tenant uuid;
  new_role public.user_role;
BEGIN
  new_tenant := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'tenant_id', '')::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid
  );

  new_role := CASE
    WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'user') = 'admin' THEN 'admin'::public.user_role
    ELSE 'user'::public.user_role
  END;

  INSERT INTO public.profiles (id, email, name, role, tenant_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    new_role,
    new_tenant
  );

  RETURN NEW;
END;
$$;

ALTER TABLE public.lojas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura de lojas por tenant do usuário" ON public.lojas;
CREATE POLICY "Leitura de lojas por tenant do usuário"
  ON public.lojas
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.tenant_id = lojas.id
    )
  );

DROP POLICY IF EXISTS "Admin cria lojas" ON public.lojas;
CREATE POLICY "Admin cria lojas"
  ON public.lojas
  FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Leitura por tenant (profiles)" ON public.profiles;
CREATE POLICY "Leitura por tenant (profiles)"
  ON public.profiles
  FOR SELECT
  USING (
    tenant_id = (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Atualização por tenant (profiles)" ON public.profiles;
CREATE POLICY "Atualização por tenant (profiles)"
  ON public.profiles
  FOR UPDATE
  USING (
    tenant_id = (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id = (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Leitura pública de produtos no catálogo" ON public.produtos;
DROP POLICY IF EXISTS "Admin gerencia produtos" ON public.produtos;

CREATE POLICY "tenant_select_produtos"
  ON public.produtos
  FOR SELECT
  USING (
    tenant_id = (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
    OR (ativo = true AND exibircatalogo = true)
  );

CREATE POLICY "tenant_insert_produtos"
  ON public.produtos
  FOR INSERT
  WITH CHECK (
    tenant_id = (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
    AND public.is_admin()
  );

CREATE POLICY "tenant_update_produtos"
  ON public.produtos
  FOR UPDATE
  USING (
    tenant_id = (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
    AND public.is_admin()
  )
  WITH CHECK (
    tenant_id = (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
    AND public.is_admin()
  );

CREATE POLICY "tenant_delete_produtos"
  ON public.produtos
  FOR DELETE
  USING (
    tenant_id = (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
    AND public.is_admin()
  );
