-- ANEXOS (plano gratuito do Supabase Storage). Rode no SQL Editor DEPOIS do schema-fase2.sql.
-- Bucket privado: o arquivo só é acessível por link gerado pelo sistema.

insert into storage.buckets (id, name, public)
values ('anexos', 'anexos', false)
on conflict (id) do nothing;

-- Equipe logada pode enviar e ver anexos
create policy "anexos enviar" on storage.objects for insert to authenticated
  with check (bucket_id = 'anexos' and public.fn_funcao() in ('admin','financeiro','supervisao','agente'));
create policy "anexos ver" on storage.objects for select to authenticated
  using (bucket_id = 'anexos' and public.fn_funcao() in ('admin','financeiro','supervisao','agente'));

-- Só admin, financeiro e supervisão apagam anexos
create policy "anexos apagar" on storage.objects for delete to authenticated
  using (bucket_id = 'anexos' and public.fn_funcao() in ('admin','financeiro','supervisao'));
