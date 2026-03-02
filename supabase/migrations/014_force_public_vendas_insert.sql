alter table public.vendas enable row level security;

grant usage on schema public to anon, authenticated;
grant insert on table public.vendas to anon, authenticated;

drop policy if exists "Inserção pública de vendas" on public.vendas;
drop policy if exists "Insercao publica de vendas" on public.vendas;
drop policy if exists "Inserção de vendas" on public.vendas;

create policy "Inserção pública de vendas"
  on public.vendas
  for insert
  to anon, authenticated
  with check (true);
