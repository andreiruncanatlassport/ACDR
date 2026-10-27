-- ============================================================================
-- ACDR — reparare recursivitate infinita in politicile pentru cereri de oferta
-- Ruleaza acest fisier AL DOISPREZECELEA, dupa 0011.
--
-- PROBLEMA (prinsa la testare, inainte de productie):
--   politica de SELECT de pe "rfqs" interoga tabelul "rfq_recipients", iar
--   politica de SELECT de pe "rfq_recipients" interoga inapoi "rfqs" —
--   fiecare o declansa pe cealalta, la infinit:
--     ERROR: infinite recursion detected in policy for relation "rfqs"
--   Efectul: orice incercare de a citi o cerere de oferta esua.
--
-- SOLUTIA: mutam verificarile in functii SECURITY DEFINER, care ruleaza cu
--   drepturile proprietarului si deci NU declanseaza RLS pe tabelele
--   interogate. E acelasi tipar folosit deja pentru public.owns_company().
-- ============================================================================

-- Adevarat daca una dintre firmele utilizatorului curent e destinatara cererii.
create or replace function public.este_destinatar_rfq(target_rfq_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.rfq_recipients r
    join public.companies c on c.id = r.company_id
    where r.rfq_id = target_rfq_id
      and c.owner_id = auth.uid()
  );
$$;

-- Adevarat daca utilizatorul curent e autorul cererii.
create or replace function public.detine_rfq(target_rfq_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.rfqs q
    join public.companies c on c.id = q.requester_company_id
    where q.id = target_rfq_id
      and c.owner_id = auth.uid()
  );
$$;

grant execute on function public.este_destinatar_rfq(uuid) to anon, authenticated;
grant execute on function public.detine_rfq(uuid) to anon, authenticated;

-- --------------------------------------------------------------------------
-- Rescriem politicile folosind functiile de mai sus
-- --------------------------------------------------------------------------
drop policy if exists "cerere vizibila autorului si destinatarilor" on public.rfqs;
create policy "cerere vizibila autorului si destinatarilor" on public.rfqs
  for select using (
    public.owns_company(requester_company_id)
    or public.este_destinatar_rfq(id)
    or public.is_admin_or_mod()
  );

drop policy if exists "destinatari vizibili partilor implicate" on public.rfq_recipients;
create policy "destinatari vizibili partilor implicate" on public.rfq_recipients
  for select using (
    public.owns_company(company_id)
    or public.detine_rfq(rfq_id)
    or public.is_admin_or_mod()
  );

drop policy if exists "autorul cererii adauga destinatari" on public.rfq_recipients;
create policy "autorul cererii adauga destinatari" on public.rfq_recipients
  for insert with check (public.detine_rfq(rfq_id));

drop policy if exists "raspunsuri vizibile partilor implicate" on public.rfq_responses;
create policy "raspunsuri vizibile partilor implicate" on public.rfq_responses
  for select using (
    public.owns_company(company_id)
    or public.detine_rfq(rfq_id)
    or public.is_admin_or_mod()
  );

drop policy if exists "destinatarul poate raspunde" on public.rfq_responses;
create policy "destinatarul poate raspunde" on public.rfq_responses
  for insert with check (
    public.owns_company(company_id)
    and public.este_destinatar_rfq(rfq_id)
  );
