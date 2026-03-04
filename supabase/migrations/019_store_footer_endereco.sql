alter table public.loja_config
  add column if not exists footer_endereco text not null default '';
