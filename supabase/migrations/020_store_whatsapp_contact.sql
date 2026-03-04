alter table public.loja_config
  add column if not exists telefone_contato_whatsapp text not null default '';
