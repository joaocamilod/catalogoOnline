create table if not exists public.vendedores (
  id         uuid primary key default uuid_generate_v4(),
  nome       text not null,
  contato    text not null,
  ativo      boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_vendedores_nome on public.vendedores(nome);
create index if not exists idx_vendedores_ativo on public.vendedores(ativo);

create or replace trigger trg_vendedores_updated_at
  before update on public.vendedores
  for each row execute procedure public.handle_updated_at();

alter table public.vendedores enable row level security;

create policy "Leitura publica de vendedores ativos"
  on public.vendedores for select
  using (ativo = true);

create policy "Admin gerencia vendedores"
  on public.vendedores for all
  using (public.is_admin())
  with check (public.is_admin());
