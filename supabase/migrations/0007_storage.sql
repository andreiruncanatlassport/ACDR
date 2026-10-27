-- ============================================================================
-- ACDR — Storage: buckete pentru poze si documente
-- Ruleaza acest fisier AL SAPTELEA, dupa 0006.
--
-- Doua bucket-uri:
--   company-media   — public (avatar, banner, poze de proiect) — oricine vede,
--                      doar proprietarul firmei (sau admin) poate scrie.
--   review-proofs   — privat (contracte/dovezi de colaborare) — doar cel care
--                      incarca si adminii pot vedea fisierul.
--
-- Conventie de organizare a fisierelor (importanta pentru politicile de mai
-- jos, care verifica primul "folder" din calea fisierului):
--   company-media/{company_id}/avatar.jpg
--   company-media/{company_id}/banner.jpg
--   company-media/{company_id}/proiecte/{project_id}/{fisier}
--   review-proofs/{reviewer_company_id}/{fisier}
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('company-media', 'company-media', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('review-proofs', 'review-proofs', false)
on conflict (id) do nothing;

-- --------------------------------------------------------------------------
-- company-media — citire publica, scriere doar de proprietarul firmei
-- --------------------------------------------------------------------------
create policy "citire publica company-media" on storage.objects
  for select using (bucket_id = 'company-media');

create policy "proprietarul incarca in company-media" on storage.objects
  for insert with check (
    bucket_id = 'company-media'
    and (public.owns_company((storage.foldername(name))[1]::uuid) or public.is_admin_or_mod())
  );

create policy "proprietarul actualizeaza in company-media" on storage.objects
  for update using (
    bucket_id = 'company-media'
    and (public.owns_company((storage.foldername(name))[1]::uuid) or public.is_admin_or_mod())
  );

create policy "proprietarul sterge din company-media" on storage.objects
  for delete using (
    bucket_id = 'company-media'
    and (public.owns_company((storage.foldername(name))[1]::uuid) or public.is_admin_or_mod())
  );

-- --------------------------------------------------------------------------
-- review-proofs — privat: doar cel ce incarca si adminii pot citi
-- --------------------------------------------------------------------------
create policy "reviewerul incarca dovada" on storage.objects
  for insert with check (
    bucket_id = 'review-proofs'
    and public.owns_company((storage.foldername(name))[1]::uuid)
  );

create policy "reviewerul si adminii vad dovada" on storage.objects
  for select using (
    bucket_id = 'review-proofs'
    and (public.owns_company((storage.foldername(name))[1]::uuid) or public.is_admin_or_mod())
  );

create policy "reviewerul sau adminul sterge dovada" on storage.objects
  for delete using (
    bucket_id = 'review-proofs'
    and (public.owns_company((storage.foldername(name))[1]::uuid) or public.is_admin_or_mod())
  );
