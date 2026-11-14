-- Rode este SQL no Supabase: menu SQL Editor > New query > Run.
-- Passo 1 de 2. Depois rode docs/schema-fase2.sql.
create table if not exists public.docs (
  col text not null,
  id text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (col, id)
);
alter table public.docs enable row level security;
-- Sem regra aberta: o acesso é liberado pelo schema-fase2.sql, depois do login.
-- Tempo real: habilita as mudanças da tabela para o app.
alter publication supabase_realtime add table public.docs;
