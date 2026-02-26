create table if not exists public.catalogo_temas (
  id             uuid primary key default uuid_generate_v4(),
  nome           text not null,
  ativo          boolean not null default false,
  header_bg_de       text not null default '#4f46e5',  
  header_bg_para     text not null default '#7e22ce',  
  header_texto_cor   text not null default '#ffffff',
  cor_primaria       text not null default '#7c3aed',
  cor_secundaria     text not null default '#6366f1',
  botao_bg_de        text not null default '#7c3aed',
  botao_bg_para      text not null default '#4f46e5',
  botao_texto_cor    text not null default '#ffffff',
  botao_borda_raio   text not null default '0.5rem',
  card_borda_raio    text not null default '0.75rem',
  card_sombra        text not null default 'sm',
  footer_bg_cor      text not null default '#0f1724',
  footer_texto_cor   text not null default '#ffffff',
  pagina_bg_cor      text not null default '#f9fafb',
  fonte_familia      text not null default 'Inter',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create or replace function public.desativar_outros_temas()
returns trigger language plpgsql as $$
begin
  if NEW.ativo = true then
    update public.catalogo_temas set ativo = false where id <> NEW.id and ativo = true;
  end if;
  return NEW;
end;
$$;

create or replace trigger trg_desativar_outros_temas
  before insert or update on public.catalogo_temas
  for each row execute procedure public.desativar_outros_temas();

create or replace trigger trg_catalogo_temas_updated_at
  before update on public.catalogo_temas
  for each row execute procedure public.handle_updated_at();

alter table public.catalogo_temas enable row level security;

create policy "Leitura pública de temas"
  on public.catalogo_temas for select
  using (true);

create policy "Admin gerencia temas"
  on public.catalogo_temas for all
  using (public.is_admin())
  with check (public.is_admin());
