-- Rode este SQL no Supabase: menu SQL Editor > New query > Run.
create table if not exists public.docs (
  col text not null,
  id text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (col, id)
);
alter table public.docs enable row level security;
-- Fase 1 (provisória): acesso liberado para a chave anon, igual ao sistema atual.
-- Na fase 2 trocamos por login do Supabase e regras por função.
create policy "acesso provisorio" on public.docs for all using (true) with check (true);
-- Tempo real: habilita as mudanças da tabela para o app.
alter publication supabase_realtime add table public.docs;
