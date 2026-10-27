-- ============================================================================
-- ACDR — reduceri intre membri, marime proiect, slug-uri SEO, cereri de oferta
-- Ruleaza acest fisier AL UNSPREZECELEA, dupa 0001-0010.
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. REDUCERI INTRE MEMBRI
--    O firma poate oferi o reducere celorlalti membri verificati ai platformei.
--    E unul dintre cele mai puternice motive de a face parte dintr-o breasla.
-- --------------------------------------------------------------------------
alter table public.companies add column if not exists discount_procent integer
  check (discount_procent is null or (discount_procent between 1 and 100));
alter table public.companies add column if not exists discount_descriere text;
alter table public.companies add column if not exists discount_conditii text;

-- --------------------------------------------------------------------------
-- 2. MARIMEA OPTIMA A PROIECTULUI
--    Ajuta la potrivirea corecta: nu trimiti un proiect de 500k unei firme
--    care lucreaza proiecte de 5k, si invers.
-- --------------------------------------------------------------------------
alter table public.companies add column if not exists proiect_marime text
  check (proiect_marime in ('sub_5k', '5k_25k', '25k_100k', '100k_500k', 'peste_500k'));

-- --------------------------------------------------------------------------
-- 3. SLUG — adrese prietenoase si bune pentru Google
--    /firma/instalatii-popescu in loc de /firma/8f3a-...-uuid
-- --------------------------------------------------------------------------
alter table public.companies add column if not exists slug text unique;

-- Genereaza un slug din denumire: diacritice eliminate, spatii -> "-",
-- si un sufix numeric daca slug-ul e deja luat.
create or replace function public.genereaza_slug_firma()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  baza text;
  candidat text;
  contor integer := 1;
begin
  if new.slug is not null and new.slug <> '' then
    return new;
  end if;

  baza := lower(new.denumire);
  -- eliminam diacriticele romanesti
  baza := translate(baza, 'ăâîșşțţĂÂÎȘŞȚŢ', 'aaissttaaisstt');
  -- pastram doar litere, cifre si spatii; restul devin spatiu
  baza := regexp_replace(baza, '[^a-z0-9]+', ' ', 'g');
  baza := trim(baza);
  baza := regexp_replace(baza, '\s+', '-', 'g');

  if baza = '' then
    baza := 'firma';
  end if;

  candidat := baza;
  while exists (select 1 from public.companies where slug = candidat and id <> new.id) loop
    contor := contor + 1;
    candidat := baza || '-' || contor;
  end loop;

  new.slug := candidat;
  return new;
end;
$$;

create trigger companies_genereaza_slug
  before insert or update of denumire on public.companies
  for each row execute procedure public.genereaza_slug_firma();

-- Completam slug-urile pentru firmele deja existente
update public.companies set denumire = denumire where slug is null;

create index if not exists companies_slug_idx on public.companies (slug);

-- --------------------------------------------------------------------------
-- 4. CERERI DE OFERTA (RFQ)
--    O firma descrie o nevoie si o trimite catre una sau mai multe firme
--    din catalog. Fata de cegek.ro (unde e un simplu formular de contact),
--    aici cererea e structurata (buget, termen, categorie) si poate merge
--    catre mai multe firme deodata, cu raspunsuri urmarite in platforma.
-- --------------------------------------------------------------------------
create table public.rfqs (
  id                    uuid primary key default gen_random_uuid(),
  requester_company_id  uuid not null references public.companies (id) on delete cascade,
  titlu                 text not null,
  descriere             text not null,
  category_id           uuid references public.categories (id),
  judet_cod             text references public.judete (cod),
  buget_min             numeric,
  buget_max             numeric,
  termen_limita         date,
  status                text not null default 'deschis' check (status in ('deschis', 'inchis', 'anulat')),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index rfqs_requester_idx on public.rfqs (requester_company_id);
create index rfqs_status_idx on public.rfqs (status, created_at desc);

-- Catre ce firme a fost trimisa cererea
create table public.rfq_recipients (
  id            uuid primary key default gen_random_uuid(),
  rfq_id        uuid not null references public.rfqs (id) on delete cascade,
  company_id    uuid not null references public.companies (id) on delete cascade,
  vazut_la      timestamptz,
  created_at    timestamptz not null default now(),
  unique (rfq_id, company_id)
);

create index rfq_recipients_company_idx on public.rfq_recipients (company_id, created_at desc);

-- Raspunsurile firmelor la cerere
create table public.rfq_responses (
  id            uuid primary key default gen_random_uuid(),
  rfq_id        uuid not null references public.rfqs (id) on delete cascade,
  company_id    uuid not null references public.companies (id) on delete cascade,
  mesaj         text not null,
  pret_estimat  numeric,
  created_at    timestamptz not null default now(),
  unique (rfq_id, company_id)
);

create index rfq_responses_rfq_idx on public.rfq_responses (rfq_id, created_at);

alter table public.rfqs enable row level security;
alter table public.rfq_recipients enable row level security;
alter table public.rfq_responses enable row level security;

-- Cererea e vizibila autorului si firmelor carora le-a fost trimisa
create policy "cerere vizibila autorului si destinatarilor" on public.rfqs
  for select using (
    public.owns_company(requester_company_id)
    or exists (
      select 1 from public.rfq_recipients r
      where r.rfq_id = rfqs.id and public.owns_company(r.company_id)
    )
    or public.is_admin_or_mod()
  );

create policy "o firma verificata poate crea cereri" on public.rfqs
  for insert with check (public.owns_company(requester_company_id));

create policy "autorul isi editeaza cererea" on public.rfqs
  for update using (public.owns_company(requester_company_id) or public.is_admin_or_mod());

create policy "autorul isi sterge cererea" on public.rfqs
  for delete using (public.owns_company(requester_company_id) or public.is_admin_or_mod());

create policy "destinatari vizibili partilor implicate" on public.rfq_recipients
  for select using (
    public.owns_company(company_id)
    or exists (select 1 from public.rfqs q where q.id = rfq_id and public.owns_company(q.requester_company_id))
    or public.is_admin_or_mod()
  );

create policy "autorul cererii adauga destinatari" on public.rfq_recipients
  for insert with check (
    exists (select 1 from public.rfqs q where q.id = rfq_id and public.owns_company(q.requester_company_id))
  );

create policy "destinatarul isi marcheaza cererea vazuta" on public.rfq_recipients
  for update using (public.owns_company(company_id));

create policy "raspunsuri vizibile partilor implicate" on public.rfq_responses
  for select using (
    public.owns_company(company_id)
    or exists (select 1 from public.rfqs q where q.id = rfq_id and public.owns_company(q.requester_company_id))
    or public.is_admin_or_mod()
  );

-- Poti raspunde doar daca esti pe lista de destinatari
create policy "destinatarul poate raspunde" on public.rfq_responses
  for insert with check (
    public.owns_company(company_id)
    and exists (
      select 1 from public.rfq_recipients r
      where r.rfq_id = rfq_responses.rfq_id and r.company_id = rfq_responses.company_id
    )
  );

create trigger rfqs_updated_at before update on public.rfqs
  for each row execute procedure public.set_updated_at();
