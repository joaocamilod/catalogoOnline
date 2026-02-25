alter table public.vendedores
  add column if not exists telefone_whatsapp text not null default '',
  add column if not exists email text not null default '';

update public.vendedores
set
  telefone_whatsapp = case
    when contato like '%@%' then ''
    else contato
  end,
  email = case
    when contato like '%@%' then contato
    else ''
  end
where coalesce(contato, '') <> ''
  and coalesce(telefone_whatsapp, '') = ''
  and coalesce(email, '') = '';

alter table public.vendedores
  drop constraint if exists vendedores_contato_obrigatorio;

alter table public.vendedores
  add constraint vendedores_contato_obrigatorio
  check (
    nullif(btrim(telefone_whatsapp), '') is not null
    or nullif(btrim(email), '') is not null
  );

alter table public.vendedores
  drop column if exists contato;
