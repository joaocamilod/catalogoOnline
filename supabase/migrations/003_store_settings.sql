create table if not exists public.loja_config (
  id         boolean primary key default true,
  nome_loja  text not null default 'Catálogo Online',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint loja_config_single_row check (id = true)
);

insert into public.loja_config (id, nome_loja)
values (true, 'Catálogo Online')
on conflict (id) do nothing;

create or replace trigger trg_loja_config_updated_at
  before update on public.loja_config
  for each row execute procedure public.handle_updated_at();

alter table public.loja_config enable row level security;

create policy "Leitura pública da configuração da loja"
  on public.loja_config for select
  using (true);

create policy "Admin atualiza configuração da loja"
  on public.loja_config for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admin insere configuração da loja"
  on public.loja_config for insert
  with check (public.is_admin());
