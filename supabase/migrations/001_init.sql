CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE public.user_role AS ENUM ('admin', 'user');

CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text UNIQUE NOT NULL,
  name        text        NOT NULL DEFAULT '',
  role        public.user_role NOT NULL DEFAULT 'user',
  phone       text,
  avatar_url  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.departamentos (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  descricao   text NOT NULL,
  ativo       boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.produtos (
  id                     uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  descricao              text    NOT NULL,
  infadicional           text,
  valorunitariocomercial numeric(12,2) NOT NULL DEFAULT 0,
  quantidademinima       integer NOT NULL DEFAULT 0,
  departamento_id        uuid    REFERENCES public.departamentos(id) ON DELETE SET NULL,
  destaque               boolean NOT NULL DEFAULT false,
  ativo                  boolean NOT NULL DEFAULT true,
  exibircatalogo         boolean NOT NULL DEFAULT true,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.imagens_produto (
  id                uuid    PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id        uuid    NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  url               text    NOT NULL,
  isimagemdestaque  boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_produtos_departamento   ON public.produtos(departamento_id);
CREATE INDEX IF NOT EXISTS idx_produtos_exibircatalogo ON public.produtos(exibircatalogo);
CREATE INDEX IF NOT EXISTS idx_imagens_produto_id      ON public.imagens_produto(produto_id);

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_departamentos_updated_at
  BEFORE UPDATE ON public.departamentos
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_produtos_updated_at
  BEFORE UPDATE ON public.produtos
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura própria do perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Atualização própria do perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin lê todos os perfis"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

ALTER TABLE public.departamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública de departamentos"
  ON public.departamentos FOR SELECT
  USING (ativo = true);

CREATE POLICY "Admin gerencia departamentos"
  ON public.departamentos FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública de produtos no catálogo"
  ON public.produtos FOR SELECT
  USING (exibircatalogo = true AND ativo = true);

CREATE POLICY "Admin gerencia produtos"
  ON public.produtos FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

ALTER TABLE public.imagens_produto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública de imagens"
  ON public.imagens_produto FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.produtos pr
      WHERE pr.id = produto_id
        AND pr.exibircatalogo = true
        AND pr.ativo = true
    )
  );

CREATE POLICY "Admin gerencia imagens"
  ON public.imagens_produto FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

INSERT INTO storage.buckets (id, name, public)
VALUES ('produtos', 'produtos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Leitura pública do bucket produtos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'produtos');

CREATE POLICY "Admin faz upload no bucket produtos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'produtos' AND public.is_admin());

CREATE POLICY "Admin deleta no bucket produtos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'produtos' AND public.is_admin());
