-- ============================================================================
-- 0041 — CALENDAR FISCAL
-- Termenele ANAF care se aplica fiecarei firme, dupa profilul ei fiscal.
--
--   fiscal_obligations        — lista obligatiilor (editabila de admin, ca sa
--                               poata fi corectata cand se schimba legea, fara deploy)
--   company_fiscal_profiles   — profilul fiscal al firmei (TVA, micro/profit,
--                               angajati, SAF-T...), completat de proprietar
--   fiscal_deadline_done      — termenele bifate ca "depus"
--
-- Datele concrete (scadenta, mutarea pe prima zi lucratoare) se calculeaza in
-- aplicatie, in src/lib/calendar-fiscal.ts.
--
-- Ruleaza in Supabase -> proiectul acdr -> SQL Editor, dupa 0040.
-- ============================================================================

create table public.fiscal_obligations (
  id                    uuid primary key default gen_random_uuid(),
  cod                   text not null unique,
  formular              text,                    -- ex: 'D112'
  denumire              text not null,
  descriere             text,
  frecventa             text not null check (frecventa in ('lunar', 'trimestrial', 'anual')),
  zi                    integer not null check (zi between 1 and 31),   -- 31 = ultima zi a lunii
  luna_anuala           integer check (luna_anuala between 1 and 12),  -- doar pentru 'anual'
  decalaj_luni          integer not null default 1 check (decalaj_luni between 0 and 6),
  trimestre             integer[] not null default '{1,2,3,4}',
  perioada_an_anterior  boolean not null default true,  -- 'anual': se refera la anul precedent
  conditie              text not null check (conditie in (
                          'toti', 'angajator', 'tva_lunar', 'tva_trimestrial', 'micro', 'profit',
                          'intracomunitar', 'saft_lunar', 'saft_trimestrial', 'cladiri_auto',
                          'retineri_la_sursa')),
  activ                 boolean not null default true,
  ordine                integer not null default 0,
  updated_at            timestamptz not null default now(),
  check (frecventa <> 'anual' or luna_anuala is not null)
);

create table public.company_fiscal_profiles (
  company_id          uuid primary key references public.companies (id) on delete cascade,
  angajator           boolean not null default false,
  tva                 text not null default 'neplatitor' check (tva in ('neplatitor', 'lunar', 'trimestrial')),
  impozit             text not null default 'micro' check (impozit in ('micro', 'profit')),
  intracomunitar      boolean not null default false,
  saft                text not null default 'trimestrial' check (saft in ('nu', 'lunar', 'trimestrial')),
  cladiri_auto        boolean not null default false,
  retineri_la_sursa   boolean not null default false,
  updated_at          timestamptz not null default now()
);

create table public.fiscal_deadline_done (
  company_id      uuid not null references public.companies (id) on delete cascade,
  obligation_id   uuid not null references public.fiscal_obligations (id) on delete cascade,
  scadenta        date not null,
  done_by         uuid references public.profiles (id) on delete set null,
  done_at         timestamptz not null default now(),
  primary key (company_id, obligation_id, scadenta)
);

-- --------------------------------------------------------------------------
-- RLS
-- --------------------------------------------------------------------------
alter table public.fiscal_obligations enable row level security;
alter table public.company_fiscal_profiles enable row level security;
alter table public.fiscal_deadline_done enable row level security;

create policy "obligatiile sunt vizibile utilizatorilor autentificati" on public.fiscal_obligations
  for select using (auth.uid() is not null);
create policy "adminul editeaza obligatiile" on public.fiscal_obligations
  for all using (public.is_admin_or_mod()) with check (public.is_admin_or_mod());

create policy "proprietarul vede profilul fiscal" on public.company_fiscal_profiles
  for select using (public.owns_company(company_id) or public.is_admin_or_mod());
create policy "proprietarul creeaza profilul fiscal" on public.company_fiscal_profiles
  for insert with check (public.owns_company(company_id));
create policy "proprietarul editeaza profilul fiscal" on public.company_fiscal_profiles
  for update using (public.owns_company(company_id)) with check (public.owns_company(company_id));

create policy "proprietarul vede termenele bifate" on public.fiscal_deadline_done
  for select using (public.owns_company(company_id));
create policy "proprietarul bifeaza termene" on public.fiscal_deadline_done
  for insert with check (public.owns_company(company_id) and done_by = auth.uid());
create policy "proprietarul debifeaza termene" on public.fiscal_deadline_done
  for delete using (public.owns_company(company_id));

-- --------------------------------------------------------------------------
-- Lista initiala de obligatii (verificata in octombrie 2026).
-- Daca se schimba un termen, se corecteaza din /admin/calendar-fiscal.
-- --------------------------------------------------------------------------
insert into public.fiscal_obligations
  (cod, formular, denumire, descriere, frecventa, zi, luna_anuala, decalaj_luni, trimestre, perioada_an_anterior, conditie, ordine)
values
  ('D112', 'D112', 'Contribuții și impozit pe salarii',
   'Depunere și plată până pe 25 a lunii următoare celei în care s-au plătit salariile.',
   'lunar', 25, null, 1, '{1,2,3,4}', true, 'angajator', 10),

  ('D300_LUNAR', 'D300', 'Decontul de TVA',
   'Depunere și plată TVA până pe 25 a lunii următoare.',
   'lunar', 25, null, 1, '{1,2,3,4}', true, 'tva_lunar', 20),

  ('D300_TRIM', 'D300', 'Decontul de TVA',
   'Depunere și plată TVA până pe 25 a lunii de după trimestru.',
   'trimestrial', 25, null, 1, '{1,2,3,4}', true, 'tva_trimestrial', 21),

  ('D390', 'D390', 'Declarația recapitulativă (intracomunitar)',
   'Doar pentru lunile în care ai avut livrări, achiziții sau servicii intracomunitare.',
   'lunar', 25, null, 1, '{1,2,3,4}', true, 'intracomunitar', 30),

  ('D394_LUNAR', 'D394', 'Declarația informativă privind livrările și achizițiile',
   'Până pe 30 a lunii următoare perioadei fiscale de TVA.',
   'lunar', 30, null, 1, '{1,2,3,4}', true, 'tva_lunar', 40),

  ('D394_TRIM', 'D394', 'Declarația informativă privind livrările și achizițiile',
   'Până pe 30 a lunii de după trimestru.',
   'trimestrial', 30, null, 1, '{1,2,3,4}', true, 'tva_trimestrial', 41),

  ('D100_MICRO', 'D100', 'Impozitul pe veniturile microîntreprinderilor',
   'Trimestrial, până pe 25 a lunii de după trimestru, inclusiv pentru trimestrul IV.',
   'trimestrial', 25, null, 1, '{1,2,3,4}', true, 'micro', 50),

  ('D100_PROFIT', 'D100', 'Impozitul pe profit (plăți trimestriale)',
   'Trimestrele I–III, până pe 25 a lunii de după trimestru. Trimestrul IV se regularizează prin D101.',
   'trimestrial', 25, null, 1, '{1,2,3}', true, 'profit', 51),

  ('D101', 'D101', 'Declarația anuală privind impozitul pe profit',
   'Până pe 25 iunie, pentru anul precedent.',
   'anual', 25, 6, 0, '{1,2,3,4}', true, 'profit', 52),

  ('D406_LUNAR', 'D406', 'SAF-T (fișierul standard de control fiscal)',
   'Până în ultima zi a lunii următoare.',
   'lunar', 31, null, 1, '{1,2,3,4}', true, 'saft_lunar', 60),

  ('D406_TRIM', 'D406', 'SAF-T (fișierul standard de control fiscal)',
   'Până în ultima zi a lunii de după trimestru.',
   'trimestrial', 31, null, 1, '{1,2,3,4}', true, 'saft_trimestrial', 61),

  ('SITUATII_FINANCIARE', null, 'Situațiile financiare anuale',
   'În 150 de zile de la încheierea exercițiului financiar (pentru anul calendaristic: 30 mai).',
   'anual', 30, 5, 0, '{1,2,3,4}', true, 'toti', 70),

  ('D205', 'D205', 'Declarația informativă privind impozitul reținut la sursă',
   'Pentru dividende, drepturi de autor și alte venituri cu impozit reținut la sursă. Până în ultima zi a lunii februarie.',
   'anual', 31, 2, 0, '{1,2,3,4}', true, 'retineri_la_sursa', 80),

  ('ITL_RATA_1', null, 'Impozit pe clădiri, terenuri și mijloace de transport (rata I)',
   'La primăria unde sunt bunurile. Consiliul local poate acorda bonificație la plata integrală până la această dată.',
   'anual', 31, 3, 0, '{1,2,3,4}', false, 'cladiri_auto', 90),

  ('ITL_RATA_2', null, 'Impozit pe clădiri, terenuri și mijloace de transport (rata II)',
   'La primăria unde sunt bunurile.',
   'anual', 30, 9, 0, '{1,2,3,4}', false, 'cladiri_auto', 91);
