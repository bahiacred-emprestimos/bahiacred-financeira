-- FASE 2: login do Supabase + regras por função.
-- REVISE antes de rodar. Rode no SQL Editor DEPOIS do schema.sql.

-- 1) Perfis: uma linha por usuário do Supabase Auth, com função e vínculo de agente.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null default '',
  funcao text not null check (funcao in ('admin','financeiro','supervisao','agente')),
  agent_id text,                       -- id do agente no sistema (para o agente ver só o dele)
  ativo boolean not null default true
);
alter table public.profiles enable row level security;

-- Função auxiliar: devolve a função do usuário logado (ou null).
create or replace function public.fn_funcao() returns text
language sql stable security definer set search_path = public as $$
  select funcao from public.profiles where id = auth.uid() and ativo
$$;

-- Usuário lê o próprio perfil; admin lê todos.
create policy "perfil proprio" on public.profiles for select
  using (id = auth.uid() or public.fn_funcao() = 'admin');
create policy "admin gerencia perfis" on public.profiles for all
  using (public.fn_funcao() = 'admin') with check (public.fn_funcao() = 'admin');

-- 2) Remove a regra provisória aberta.
drop policy if exists "acesso provisorio" on public.docs;

-- 3) Regras da tabela docs por coleção e função.
-- Coleções financeiras e de configuração: só admin e financeiro.
create policy "financeiro ve financeiro" on public.docs for all
  using (col in ('desp','rcts','recs','dividas','metas','registro','snaps','config')
         and public.fn_funcao() in ('admin','financeiro'))
  with check (col in ('desp','rcts','recs','dividas','metas','registro','snaps','config')
         and public.fn_funcao() in ('admin','financeiro'));

-- Vendas, clientes e importações: admin, financeiro e supervisão veem tudo.
create policy "equipe ve vendas e clientes" on public.docs for all
  using (col in ('vendas','clients','imports','leads','atendimentos')
         and public.fn_funcao() in ('admin','financeiro','supervisao'))
  with check (col in ('vendas','clients','imports','leads','atendimentos')
         and public.fn_funcao() in ('admin','financeiro','supervisao'));

-- Contratos (loans): admin e financeiro veem tudo; agente só os que têm o próprio agent_id.
create policy "contratos por funcao" on public.docs for all
  using (col = 'loans' and (
           public.fn_funcao() in ('admin','financeiro')
           or (public.fn_funcao() = 'agente' and data->>'agentId' = (select agent_id from public.profiles where id = auth.uid()))))
  with check (col = 'loans' and (
           public.fn_funcao() in ('admin','financeiro')
           or (public.fn_funcao() = 'agente' and data->>'agentId' = (select agent_id from public.profiles where id = auth.uid()))));

-- Agentes: qualquer usuário logado lê a lista (sem dados sensíveis gravados aqui);
-- só admin escreve. A senha antiga do sistema NÃO vai para esta tabela.
create policy "agentes leitura" on public.docs for select
  using (col = 'agents' and public.fn_funcao() is not null);
create policy "agentes so admin escreve" on public.docs for all
  using (col = 'agents' and public.fn_funcao() = 'admin')
  with check (col = 'agents' and public.fn_funcao() = 'admin');
