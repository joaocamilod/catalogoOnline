alter table public.loja_config
  add column if not exists footer_descricao text not null default 'Sua loja virtual completa com os melhores produtos e precos do mercado. Qualidade e conveniencia em um so lugar.',
  add column if not exists footer_observacoes text not null default '',
  add column if not exists facebook_url text not null default '',
  add column if not exists instagram_url text not null default '',
  add column if not exists twitter_url text not null default '',
  add column if not exists youtube_url text not null default '';
