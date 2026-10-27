-- ============================================================================
-- ACDR — extinderi: profil bogat, portofoliu, recenzii, favorite, reauth
-- Ruleaza acest fisier AL SASELEA, dupa 0001-0005.
-- ============================================================================

-- --------------------------------------------------------------------------
-- Companii — campuri noi de profil
-- --------------------------------------------------------------------------
alter table public.companies add column if not exists banner_url text;
alter table public.companies add column if not exists facebook_url text;
alter table public.companies add column if not exists instagram_url text;
alter table public.companies add column if not exists linkedin_url text;
alter table public.companies add column if not exists tags text[];
alter table public.companies add column if not exists vizualizari integer not null default 0;

-- owner-ul poate sterge acum propria firma (inainte era doar admin)
drop policy if exists "doar adminul sterge firme" on public.companies;
create policy "proprietarul sau adminul sterge firma" on public.companies
  for delete using (owner_id = auth.uid() or public.is_admin_or_mod());

-- --------------------------------------------------------------------------
-- RECONFIRMARE EMAIL — poarta de siguranta inainte de editare/stergere
-- --------------------------------------------------------------------------
create table public.reauth_confirmations (
  user_id       uuid primary key references public.profiles (id) on delete cascade,
  confirmed_at  timestamptz not null default now()
);

alter table public.reauth_confirmations enable row level security;

create policy "userul isi gestioneaza propria reconfirmare" on public.reauth_confirmations
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- --------------------------------------------------------------------------
-- PERSOANE DE CONTACT — mai multe, pe departamente
-- --------------------------------------------------------------------------
create table public.company_contacts (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies (id) on delete cascade,
  nume          text not null,
  rol           text,
  departament   text,
  telefon       text,
  email         text,
  ordine        integer not null default 0,
  created_at    timestamptz not null default now()
);

create index company_contacts_company_idx on public.company_contacts (company_id);

alter table public.company_contacts enable row level security;

create policy "vizibil daca firma e publica sau proprie" on public.company_contacts
  for select using (
    exists (select 1 from public.companies c where c.id = company_id and (c.status = 'approved' or c.owner_id = auth.uid()))
    or public.is_admin_or_mod()
  );
create policy "editabil de proprietar/admin" on public.company_contacts
  for all using (public.owns_company(company_id) or public.is_admin_or_mod())
  with check (public.owns_company(company_id) or public.is_admin_or_mod());

-- --------------------------------------------------------------------------
-- PORTOFOLIU — pagina de "lucrari", cate una per proiect, cu poze proprii
-- --------------------------------------------------------------------------
create table public.company_projects (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies (id) on delete cascade,
  titlu         text not null,
  descriere     text,
  locatie       text,
  an            integer,
  cover_url     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index company_projects_company_idx on public.company_projects (company_id);

create table public.project_images (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.company_projects (id) on delete cascade,
  url           text not null,
  ordine        integer not null default 0,
  created_at    timestamptz not null default now()
);

create index project_images_project_idx on public.project_images (project_id);

alter table public.company_projects enable row level security;
alter table public.project_images enable row level security;

create policy "vizibil daca firma e publica sau proprie" on public.company_projects
  for select using (
    exists (select 1 from public.companies c where c.id = company_id and (c.status = 'approved' or c.owner_id = auth.uid()))
    or public.is_admin_or_mod()
  );
create policy "editabil de proprietar/admin" on public.company_projects
  for all using (public.owns_company(company_id) or public.is_admin_or_mod())
  with check (public.owns_company(company_id) or public.is_admin_or_mod());

create policy "vizibil daca proiectul e vizibil" on public.project_images
  for select using (
    exists (
      select 1 from public.company_projects p
      join public.companies c on c.id = p.company_id
      where p.id = project_id and (c.status = 'approved' or c.owner_id = auth.uid())
    )
    or public.is_admin_or_mod()
  );
create policy "editabil de proprietarul proiectului/admin" on public.project_images
  for all using (
    exists (select 1 from public.company_projects p where p.id = project_id and public.owns_company(p.company_id))
    or public.is_admin_or_mod()
  )
  with check (
    exists (select 1 from public.company_projects p where p.id = project_id and public.owns_company(p.company_id))
    or public.is_admin_or_mod()
  );

-- --------------------------------------------------------------------------
-- RECENZII — doar intre firme, aprobate manual pe baza unei dovezi
-- --------------------------------------------------------------------------
create table public.reviews (
  id                    uuid primary key default gen_random_uuid(),
  reviewer_company_id   uuid not null references public.companies (id) on delete cascade,
  reviewed_company_id   uuid not null references public.companies (id) on delete cascade,
  rating                integer not null check (rating between 1 and 5),
  comentariu            text,
  dovada_url            text,
  status                text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  motiv_respingere      text,
  aprobat_de            uuid references public.profiles (id),
  aprobat_la            timestamptz,
  created_at            timestamptz not null default now(),
  check (reviewer_company_id <> reviewed_company_id),
  unique (reviewer_company_id, reviewed_company_id)
);

create index reviews_reviewed_idx on public.reviews (reviewed_company_id, status);

alter table public.reviews enable row level security;

-- recenziile aprobate sunt publice; cele in asteptare le vede doar autorul,
-- firma recenzata (ca sa stie ca a primit o recenzie) si adminii
create policy "recenzii vizibile" on public.reviews
  for select using (
    status = 'approved'
    or public.owns_company(reviewer_company_id)
    or public.owns_company(reviewed_company_id)
    or public.is_admin_or_mod()
  );

create policy "o firma verificata poate lasa o recenzie" on public.reviews
  for insert with check (public.owns_company(reviewer_company_id) and status = 'pending');

-- doar adminul aproba/respinge (schimba status) — protejat si de trigger mai jos
create policy "adminul modereaza recenzii" on public.reviews
  for update using (public.is_admin_or_mod());

create function public.protect_review_moderation_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.is_admin_or_mod() or auth.role() = 'service_role') then
    new.status := old.status;
    new.aprobat_de := old.aprobat_de;
    new.aprobat_la := old.aprobat_la;
    new.motiv_respingere := old.motiv_respingere;
  end if;
  return new;
end;
$$;

create trigger reviews_protect_moderation
  before update on public.reviews
  for each row execute procedure public.protect_review_moderation_fields();

-- --------------------------------------------------------------------------
-- FAVORITE — firme salvate de un utilizator
-- --------------------------------------------------------------------------
create table public.company_favorites (
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  company_id  uuid not null references public.companies (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (profile_id, company_id)
);

alter table public.company_favorites enable row level security;

create policy "userul isi gestioneaza propriile favorite" on public.company_favorites
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- --------------------------------------------------------------------------
-- Contor de vizualizari — incrementat printr-o functie (nu direct din client)
-- --------------------------------------------------------------------------
create function public.increment_company_view(target_company_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.companies set vizualizari = vizualizari + 1 where id = target_company_id and status = 'approved';
end;
$$;

grant execute on function public.increment_company_view(uuid) to anon, authenticated;

-- --------------------------------------------------------------------------
-- Rating mediu al unei firme — functie folosita in UI (evita N+1 pe client)
-- --------------------------------------------------------------------------
create function public.company_rating(target_company_id uuid)
returns table (medie numeric, numar bigint)
language sql
stable
as $$
  select coalesce(avg(rating), 0)::numeric(10,2), count(*)
  from public.reviews
  where reviewed_company_id = target_company_id and status = 'approved';
$$;

grant execute on function public.company_rating(uuid) to anon, authenticated;
