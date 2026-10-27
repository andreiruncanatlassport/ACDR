-- ============================================================================
-- ACDR — Înțelegeri: chat, negociere pe versiuni, clauze, etape, notificări
-- Ruleaza acest fisier AL TREISPREZECELEA, dupa 0012.
--
-- Model:
--   deals            — o intelegere intre DOUA firme (pornita dintr-un RFQ sau direct)
--   deal_versions    — fiecare propunere de termeni e o VERSIUNE completa (snapshot).
--                      Asa avem istoric real: "cine ce a schimbat si cand".
--   deal_messages    — chat-ul asociat intelegerii
--   clause_templates — biblioteca de clauze predefinite, pe categorii
--   notifications    — notificari in aplicatie (+ email, daca e configurat SMTP)
-- ============================================================================

-- --------------------------------------------------------------------------
-- ÎNȚELEGERI
-- --------------------------------------------------------------------------
create table public.deals (
  id                  uuid primary key default gen_random_uuid(),
  rfq_id              uuid references public.rfqs (id) on delete set null,
  company_a_id        uuid not null references public.companies (id) on delete cascade,
  company_b_id        uuid not null references public.companies (id) on delete cascade,
  titlu               text not null,

  -- draft      — abia creata, inca nu s-a propus nimic
  -- negociere  — exista cel putin o versiune propusa
  -- acceptat   — ambele parti au acceptat aceeasi versiune
  -- finalizat  — ambele parti au confirmat ca lucrarea s-a incheiat
  -- anulat     — una dintre parti a renuntat
  status              text not null default 'draft'
    check (status in ('draft', 'negociere', 'acceptat', 'finalizat', 'anulat')),

  versiune_acceptata_id uuid,

  finalizat_de_a_la   timestamptz,
  finalizat_de_b_la   timestamptz,
  anulat_de           uuid references public.companies (id),
  motiv_anulare       text,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  check (company_a_id <> company_b_id)
);

create index deals_company_a_idx on public.deals (company_a_id, status);
create index deals_company_b_idx on public.deals (company_b_id, status);
create index deals_rfq_idx on public.deals (rfq_id);

-- --------------------------------------------------------------------------
-- VERSIUNI — fiecare propunere e un snapshot complet al termenilor.
-- Clauzele si etapele stau ca jsonb in interiorul versiunii: asa o versiune
-- veche ramane exact cum a fost propusa, chiar daca sabloanele se schimba.
-- --------------------------------------------------------------------------
create table public.deal_versions (
  id                  uuid primary key default gen_random_uuid(),
  deal_id             uuid not null references public.deals (id) on delete cascade,
  numar               integer not null,
  propus_de           uuid not null references public.companies (id),

  descriere_lucrare   text,
  pret_total          numeric,
  moneda              text not null default 'RON' check (moneda in ('RON', 'EUR')),
  modalitate_plata    text,
  termen_start        date,
  termen_final        date,

  -- [{ titlu, continut }]
  clauze              jsonb not null default '[]'::jsonb,
  -- [{ titlu, descriere, termen, suma }]
  etape               jsonb not null default '[]'::jsonb,

  nota_modificare     text,
  status              text not null default 'propusa'
    check (status in ('propusa', 'acceptata', 'respinsa', 'inlocuita')),
  raspuns_la          uuid references public.deal_versions (id),

  created_at          timestamptz not null default now(),
  unique (deal_id, numar)
);

create index deal_versions_deal_idx on public.deal_versions (deal_id, numar desc);

alter table public.deals
  add constraint deals_versiune_acceptata_fk
  foreign key (versiune_acceptata_id) references public.deal_versions (id) on delete set null;

-- --------------------------------------------------------------------------
-- CHAT
-- --------------------------------------------------------------------------
create table public.deal_messages (
  id                uuid primary key default gen_random_uuid(),
  deal_id           uuid not null references public.deals (id) on delete cascade,
  sender_company_id uuid not null references public.companies (id),
  continut          text not null,
  -- mesaj de sistem: "Firma X a propus versiunea 2"
  sistem            boolean not null default false,
  citit             boolean not null default false,
  created_at        timestamptz not null default now()
);

create index deal_messages_deal_idx on public.deal_messages (deal_id, created_at);

-- --------------------------------------------------------------------------
-- BIBLIOTECA DE CLAUZE — predefinite, optional legate de o categorie
-- --------------------------------------------------------------------------
create table public.clause_templates (
  id            uuid primary key default gen_random_uuid(),
  category_id   uuid references public.categories (id) on delete cascade,
  titlu         text not null,
  continut      text not null,
  ordine        integer not null default 0,
  created_at    timestamptz not null default now()
);

create index clause_templates_category_idx on public.clause_templates (category_id, ordine);

-- --------------------------------------------------------------------------
-- NOTIFICĂRI
-- --------------------------------------------------------------------------
create table public.notifications (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references public.profiles (id) on delete cascade,
  tip           text not null,
  titlu         text not null,
  mesaj         text,
  link          text,
  citit         boolean not null default false,
  email_trimis  boolean not null default false,
  created_at    timestamptz not null default now()
);

create index notifications_profile_idx on public.notifications (profile_id, citit, created_at desc);

-- --------------------------------------------------------------------------
-- Nr. de colaborari finalizate — semnal de incredere pe profil
-- --------------------------------------------------------------------------
alter table public.companies add column if not exists colaborari_finalizate integer not null default 0;

create or replace function public.refresh_colaborari_finalizate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  a uuid;
  b uuid;
begin
  a := coalesce(new.company_a_id, old.company_a_id);
  b := coalesce(new.company_b_id, old.company_b_id);

  update public.companies c
  set colaborari_finalizate = (
    select count(*) from public.deals d
    where d.status = 'finalizat' and (d.company_a_id = c.id or d.company_b_id = c.id)
  )
  where c.id in (a, b);

  return coalesce(new, old);
end;
$$;

create trigger deals_refresh_colaborari
  after insert or update or delete on public.deals
  for each row execute procedure public.refresh_colaborari_finalizate();

create trigger deals_updated_at before update on public.deals
  for each row execute procedure public.set_updated_at();

-- ============================================================================
-- FUNCȚII AJUTĂTOARE (SECURITY DEFINER — evita recursivitatea intre politici,
-- exact problema reparata in 0012)
-- ============================================================================
create or replace function public.participa_la_deal(target_deal_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.deals d
    join public.companies c on c.id in (d.company_a_id, d.company_b_id)
    where d.id = target_deal_id
      and c.owner_id = auth.uid()
  );
$$;

grant execute on function public.participa_la_deal(uuid) to anon, authenticated;

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.deals enable row level security;
alter table public.deal_versions enable row level security;
alter table public.deal_messages enable row level security;
alter table public.clause_templates enable row level security;
alter table public.notifications enable row level security;

-- Înțelegeri — doar cele doua firme implicate (si adminii)
create policy "intelegere vizibila partilor" on public.deals
  for select using (
    public.owns_company(company_a_id)
    or public.owns_company(company_b_id)
    or public.is_admin_or_mod()
  );

create policy "o firma isi poate crea intelegeri" on public.deals
  for insert with check (public.owns_company(company_a_id));

create policy "partile pot actualiza intelegerea" on public.deals
  for update using (
    public.owns_company(company_a_id)
    or public.owns_company(company_b_id)
    or public.is_admin_or_mod()
  );

-- Versiuni
create policy "versiuni vizibile partilor" on public.deal_versions
  for select using (public.participa_la_deal(deal_id) or public.is_admin_or_mod());

create policy "partile propun versiuni" on public.deal_versions
  for insert with check (
    public.participa_la_deal(deal_id) and public.owns_company(propus_de)
  );

create policy "partile actualizeaza statusul versiunii" on public.deal_versions
  for update using (public.participa_la_deal(deal_id) or public.is_admin_or_mod());

-- Chat
create policy "mesaje vizibile partilor" on public.deal_messages
  for select using (public.participa_la_deal(deal_id) or public.is_admin_or_mod());

create policy "partile trimit mesaje" on public.deal_messages
  for insert with check (
    public.participa_la_deal(deal_id) and public.owns_company(sender_company_id)
  );

create policy "destinatarul marcheaza mesajul citit" on public.deal_messages
  for update using (public.participa_la_deal(deal_id));

-- Clauze predefinite — publice la citire, editabile doar de admini
create policy "clauze publice" on public.clause_templates for select using (true);
create policy "clauze editabile de admin" on public.clause_templates
  for all using (public.is_admin_or_mod()) with check (public.is_admin_or_mod());

-- Notificari — strict personale
create policy "notificari proprii" on public.notifications
  for select using (profile_id = auth.uid());
create policy "notificari proprii - marcare citit" on public.notifications
  for update using (profile_id = auth.uid());
