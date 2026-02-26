create table if not exists public.vendas (
  id               uuid primary key default uuid_generate_v4(),
  vendedor_id      uuid references public.vendedores(id) on delete set null,
  itens            jsonb not null,
  total            numeric(12, 2),
  comprador_nome   text,
  comprador_telefone text,
  comprador_email  text,
  url_imagem       text,
  texto_mensagem   text,
  status           text not null default 'pendente',   
  whatsapp_enviado boolean not null default false,
  criado_em        timestamptz not null default now()
);

create index if not exists idx_vendas_vendedor_id  on public.vendas(vendedor_id);
create index if not exists idx_vendas_status       on public.vendas(status);
create index if not exists idx_vendas_criado_em    on public.vendas(criado_em desc);

create table if not exists public.mensagens_venda (
  id         uuid primary key default uuid_generate_v4(),
  venda_id   uuid references public.vendas(id) on delete cascade,
  direcao    text not null,   
  provedor   text not null,   
  payload    jsonb,
  enviado_em timestamptz not null default now()
);

create index if not exists idx_mensagens_venda_venda_id on public.mensagens_venda(venda_id);

alter table public.vendas enable row level security;
alter table public.mensagens_venda enable row level security;

create policy "Inserção pública de vendas"
  on public.vendas for insert
  with check (true);

create policy "Admin lê vendas"
  on public.vendas for select
  using (public.is_admin());

create policy "Admin atualiza vendas"
  on public.vendas for update
  using (public.is_admin());

create policy "Admin deleta vendas"
  on public.vendas for delete
  using (public.is_admin());

create policy "Admin lê mensagens"
  on public.mensagens_venda for select
  using (public.is_admin());