-- Adiciona coluna de cancelamentos semanais à tabela conversoes_semanais
alter table public.conversoes_semanais
add column if not exists cancellations integer default 0;
