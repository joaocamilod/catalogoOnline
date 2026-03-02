alter table public.vendas enable row level security;

grant insert on table public.vendas to anon, authenticated;

drop policy if exists "Inserção pública de vendas" on public.vendas;
drop policy if exists "Insercao publica de vendas" on public.vendas;
drop policy if exists "Inserção de vendas" on public.vendas;

create policy "Inserção pública de vendas"
  on public.vendas
  for insert
  to anon, authenticated
  with check (
    vendedor_id is not null
    and exists (
      select 1
      from public.vendedores v
      where v.id = vendas.vendedor_id
        and v.ativo = true
    )
    and jsonb_typeof(itens) = 'array'
    and jsonb_array_length(itens) > 0
    and coalesce(total, 0) >= 0
    and status = 'pendente'
    and whatsapp_enviado = false
  );

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'vendas'
      and policyname = 'Admin lê vendas'
  ) then
    execute $policy$
      create policy "Admin lê vendas"
        on public.vendas
        for select
        using (public.is_admin())
    $policy$;
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'vendas'
      and policyname = 'Admin atualiza vendas'
  ) then
    execute $policy$
      create policy "Admin atualiza vendas"
        on public.vendas
        for update
        using (public.is_admin())
    $policy$;
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'vendas'
      and policyname = 'Admin deleta vendas'
  ) then
    execute $policy$
      create policy "Admin deleta vendas"
        on public.vendas
        for delete
        using (public.is_admin())
    $policy$;
  end if;
end
$$;
