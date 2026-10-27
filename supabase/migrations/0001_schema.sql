-- ============================================================================
-- ACDR — schema initial
-- Ruleaza acest fisier primul, in Supabase Dashboard > SQL Editor > New query.
-- ============================================================================

-- Extensii necesare -----------------------------------------------------
create extension if not exists pgcrypto;                      -- gen_random_uuid()
create extension if not exists postgis with schema public;    -- cautare pe raza geografica

-- ============================================================================
-- PROFILES — datele personale ale persoanei care s-a inregistrat
-- (numele, telefonul si emailul PERSONAL — nu cele ale firmei).
-- Randul se creeaza automat cand cineva isi face cont (vezi trigger mai jos).
-- ============================================================================
create table public.profiles (
  id                  uuid primary key references auth.users (id) on delete cascade,
  nume_complet        text not null,
  telefon_personal    text,
  email_personal      text,
  rol                 text not null default 'user' check (rol in ('user', 'moderator', 'admin')),
  activ               boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.profiles is 'Date personale ale utilizatorilor. Vizibile doar catre proprietar, admini si firme cu conexiune acceptata (vezi RLS).';

-- ============================================================================
-- JUDETE — lista fixa de referinta (42 de intrari: 41 judete + Bucuresti)
-- ============================================================================
create table public.judete (
  cod   text primary key,        -- ex: 'CJ'
  nume  text not null            -- ex: 'Cluj'
);

-- ============================================================================
-- CATEGORII — taxonomia proprie, prietenoasa (domenii + subdomenii)
-- parent_id = null  -> categorie principala
-- parent_id = X     -> subcategorie a categoriei X
-- ============================================================================
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name_ro     text not null,
  name_en     text not null,
  parent_id   uuid references public.categories (id) on delete cascade,
  ordine      integer not null default 0,
  created_at  timestamptz not null default now()
);

create index categories_parent_idx on public.categories (parent_id);

-- Mapare categorie -> coduri CAEN (multe coduri CAEN pot fi atribuite unei categorii)
create table public.category_caen_codes (
  id            uuid primary key default gen_random_uuid(),
  category_id   uuid not null references public.categories (id) on delete cascade,
  caen_code     text not null,                 -- ex: '4120'
  caen_version  text not null default 'rev2' check (caen_version in ('rev2', 'rev3')),
  descriere     text,
  unique (category_id, caen_code, caen_version)
);

create index category_caen_codes_code_idx on public.category_caen_codes (caen_code);

-- ============================================================================
-- COMPANIES — profilul public al firmei
-- ============================================================================
create table public.companies (
  id                       uuid primary key default gen_random_uuid(),
  owner_id                 uuid not null references public.profiles (id) on delete cascade,

  -- date preluate de la ANAF ------------------------------------------------
  cui                      bigint not null unique,
  denumire                 text not null,
  nr_reg_com               text,
  adresa_sediu             text,
  judet_cod                text references public.judete (cod),
  localitate               text,
  cod_postal               text,
  stare_inregistrare       text,               -- ex: 'INREGISTRAT din data ...'
  data_inregistrare        date,
  radiata                  boolean not null default false,
  cod_caen_principal       text,
  den_caen_principal       text,
  tva_activ                boolean,
  tva_data_actualizare     timestamptz,
  anaf_ultima_verificare   timestamptz,
  anaf_raspuns_brut        jsonb,              -- raspunsul complet, pt. audit/depanare

  -- geografie (pentru cautare pe raza) ---------------------------------------
  lat                      double precision,
  lng                      double precision,
  geo                      geography(Point, 4326),
  raza_deservire_km        integer,            -- null = doar judetul sediului

  -- date completate de firma la inregistrare ---------------------------------
  telefon_firma            text,
  email_firma              text,
  website                  text,
  logo_url                 text,
  descriere                text,
  numar_angajati           integer,
  dimensiune_echipa        text check (dimensiune_echipa in ('1', '2-9', '10-49', '50-249', '250+')),

  -- cifra de afaceri -----------------------------------------------------
  cifra_afaceri_an         integer,
  cifra_afaceri_valoare    numeric,
  cifra_afaceri_sursa      text check (cifra_afaceri_sursa in ('anaf_auto', 'manual', 'indisponibila')),

  -- ce cauta / ce ofera firma in retea ---------------------------------------
  cum_poate_ajuta_grupul   text,

  -- moderare -------------------------------------------------------------
  status                   text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'suspended')),
  motiv_respingere         text,
  aprobat_de               uuid references public.profiles (id),
  aprobat_la               timestamptz,

  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index companies_status_idx on public.companies (status);
create index companies_judet_idx on public.companies (judet_cod);
create index companies_cui_idx on public.companies (cui);
create index companies_geo_idx on public.companies using gist (geo);
create index companies_denumire_trgm_idx on public.companies using gin (to_tsvector('simple', denumire));

-- firma <-> categorii (domeniu principal + domenii secundare)
create table public.company_categories (
  company_id    uuid not null references public.companies (id) on delete cascade,
  category_id   uuid not null references public.categories (id) on delete cascade,
  is_primary    boolean not null default false,
  primary key (company_id, category_id)
);

create index company_categories_category_idx on public.company_categories (category_id);

-- firma <-> judete deservite explicit (in plus fata de raza km, optional)
create table public.company_judete (
  company_id  uuid not null references public.companies (id) on delete cascade,
  judet_cod   text not null references public.judete (cod),
  primary key (company_id, judet_cod)
);

-- nevoile de suport ale firmei (in ce domenii cauta ajutor)
create table public.company_support_needs (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies (id) on delete cascade,
  category_id   uuid references public.categories (id),
  nota          text,
  created_at    timestamptz not null default now()
);

-- domeniile in care firma e dispusa sa ajute alte firme
create table public.company_support_offers (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies (id) on delete cascade,
  category_id   uuid references public.categories (id),
  nota          text,
  created_at    timestamptz not null default now()
);

-- istoricul cifrelor de afaceri (pe ani), util pentru grafic evolutie
create table public.financial_snapshots (
  company_id    uuid not null references public.companies (id) on delete cascade,
  an            integer not null,
  cifra_afaceri numeric,
  profit_net    numeric,
  numar_salariati integer,
  sursa         text not null default 'anaf_auto' check (sursa in ('anaf_auto', 'manual')),
  fetched_at    timestamptz not null default now(),
  primary key (company_id, an)
);

-- ============================================================================
-- CONEXIUNI intre firme — dau acces la datele personale ale reprezentantului
-- ============================================================================
create table public.connections (
  id                    uuid primary key default gen_random_uuid(),
  requester_company_id  uuid not null references public.companies (id) on delete cascade,
  target_company_id     uuid not null references public.companies (id) on delete cascade,
  status                text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  mesaj                 text,
  created_at            timestamptz not null default now(),
  responded_at          timestamptz,
  check (requester_company_id <> target_company_id),
  unique (requester_company_id, target_company_id)
);

create index connections_target_idx on public.connections (target_company_id, status);
create index connections_requester_idx on public.connections (requester_company_id, status);

-- ============================================================================
-- MESAJE (chat) — rezervat pentru Faza 2, tabela e pregatita de pe acum
-- ============================================================================
create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  connection_id   uuid not null references public.connections (id) on delete cascade,
  sender_company_id uuid not null references public.companies (id),
  continut        text not null,
  citit           boolean not null default false,
  created_at      timestamptz not null default now()
);

create index messages_connection_idx on public.messages (connection_id, created_at);

-- ============================================================================
-- JURNAL ADMIN — audit pentru actiunile de moderare
-- ============================================================================
create table public.admin_audit_log (
  id            uuid primary key default gen_random_uuid(),
  admin_id      uuid references public.profiles (id),
  company_id    uuid references public.companies (id),
  actiune       text not null,
  detalii       jsonb,
  created_at    timestamptz not null default now()
);

-- ============================================================================
-- Trigger: creeaza automat un rand in profiles cand se inregistreaza un user nou
-- ============================================================================
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nume_complet, email_personal)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nume_complet', ''),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger: mentine geography(Point) sincronizat cu lat/lng
create function public.sync_company_geo()
returns trigger
language plpgsql
as $$
begin
  if new.lat is not null and new.lng is not null then
    new.geo := ST_SetSRID(ST_MakePoint(new.lng, new.lat), 4326)::geography;
  else
    new.geo := null;
  end if;
  return new;
end;
$$;

create trigger companies_sync_geo
  before insert or update of lat, lng on public.companies
  for each row execute procedure public.sync_company_geo();

-- Trigger generic: updated_at
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger companies_updated_at before update on public.companies
  for each row execute procedure public.set_updated_at();
