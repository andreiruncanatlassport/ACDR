-- ============================================================================
-- 0040 — CERCURI
-- Grupuri mici (6–8 antreprenori) care se intalnesc lunar, isi spun deciziile
-- grele, isi iau angajamente pentru luna urmatoare si se roaga unii pentru altii.
--
--   circles               — cercul (creat de admin/moderator, are un lider)
--   circle_members        — cereri de intrare + membri activi
--   circle_meetings       — intalnirile programate de lider
--   circle_meeting_rsvps  — "vin" / "nu vin"
--   circle_commitments    — angajamentele lunare ale fiecarui membru
--   circle_messages       — mesajele grupului
--
-- Tot ce tine de un cerc e vizibil DOAR membrilor activi ai cercului (si
-- adminilor). Lista de cercuri si numarul de locuri libere sunt vizibile
-- oricarui utilizator autentificat.
--
-- Ruleaza in Supabase -> proiectul acdr -> SQL Editor.
-- ============================================================================

create table public.circles (
  id            uuid primary key default gen_random_uuid(),
  nume          text not null check (char_length(nume) between 3 and 80),
  oras          text not null check (char_length(oras) between 2 and 60),
  judet_cod     text references public.judete (cod),
  domeniu       text check (domeniu is null or char_length(domeniu) <= 80),
  ritm          text check (ritm is null or char_length(ritm) <= 80),   -- ex: "lunar, joia seara"
  descriere     text check (descriere is null or char_length(descriere) <= 1000),
  max_membri    integer not null default 8 check (max_membri between 3 and 12),
  activ         boolean not null default true,
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index circles_activ_idx on public.circles (activ, judet_cod);

create table public.circle_members (
  circle_id     uuid not null references public.circles (id) on delete cascade,
  profile_id    uuid not null references public.profiles (id) on delete cascade,
  rol           text not null default 'membru' check (rol in ('lider', 'membru')),
  status        text not null default 'cerere' check (status in ('cerere', 'activ')),
  mesaj         text check (mesaj is null or char_length(mesaj) <= 500),
  created_at    timestamptz not null default now(),
  joined_at     timestamptz,
  primary key (circle_id, profile_id)
);

create index circle_members_profile_idx on public.circle_members (profile_id, status);

create table public.circle_meetings (
  id            uuid primary key default gen_random_uuid(),
  circle_id     uuid not null references public.circles (id) on delete cascade,
  starts_at     timestamptz not null,
  loc           text check (loc is null or char_length(loc) <= 160),
  tema          text check (tema is null or char_length(tema) <= 200),
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now()
);

create index circle_meetings_circle_idx on public.circle_meetings (circle_id, starts_at);

create table public.circle_meeting_rsvps (
  meeting_id    uuid not null references public.circle_meetings (id) on delete cascade,
  profile_id    uuid not null references public.profiles (id) on delete cascade,
  raspuns       text not null check (raspuns in ('vin', 'nu_vin')),
  updated_at    timestamptz not null default now(),
  primary key (meeting_id, profile_id)
);

create table public.circle_commitments (
  id            uuid primary key default gen_random_uuid(),
  circle_id     uuid not null references public.circles (id) on delete cascade,
  profile_id    uuid not null references public.profiles (id) on delete cascade,
  text          text not null check (char_length(text) between 3 and 200),
  luna          date not null,          -- prima zi a lunii la care se refera
  facut         boolean not null default false,
  created_at    timestamptz not null default now()
);

create index circle_commitments_idx on public.circle_commitments (circle_id, luna);

create table public.circle_messages (
  id            uuid primary key default gen_random_uuid(),
  circle_id     uuid not null references public.circles (id) on delete cascade,
  profile_id    uuid not null references public.profiles (id) on delete cascade,
  continut      text not null check (char_length(continut) between 1 and 2000),
  created_at    timestamptz not null default now()
);

create index circle_messages_idx on public.circle_messages (circle_id, created_at desc);

-- --------------------------------------------------------------------------
-- Functii ajutatoare (SECURITY DEFINER ca sa evite recursivitatea in RLS)
-- --------------------------------------------------------------------------
create function public.is_circle_member(p_circle uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.circle_members
    where circle_id = p_circle and profile_id = auth.uid() and status = 'activ'
  );
$$;

create function public.is_circle_leader(p_circle uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.circle_members
    where circle_id = p_circle and profile_id = auth.uid() and status = 'activ' and rol = 'lider'
  );
$$;

-- Cate locuri ocupate are fiecare cerc activ (pentru lista publica de cercuri,
-- fara sa expunem cine sunt membrii).
create function public.circle_counts()
returns table (circle_id uuid, membri_activi integer)
language sql
security definer
stable
set search_path = public
as $$
  select c.id, coalesce(count(m.profile_id) filter (where m.status = 'activ'), 0)::integer
  from public.circles c
  left join public.circle_members m on m.circle_id = c.id
  where c.activ = true and auth.uid() is not null
  group by c.id;
$$;

-- Numele si poza membrilor unui cerc. Merge doar pentru membrii activi ai
-- cercului si pentru admini — ceilalti primesc lista goala.
create function public.circle_member_profiles(p_circle uuid)
returns table (
  profile_id    uuid,
  nume_complet  text,
  avatar_url    text,
  titlu         text,
  firma         text,
  rol           text,
  status        text,
  mesaj         text,
  created_at    timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select p.id, p.nume_complet, p.avatar_url, p.titlu, p.firma_declarata,
         m.rol, m.status,
         case when public.is_circle_leader(p_circle) or public.is_admin_or_mod() then m.mesaj else null end,
         m.created_at
  from public.circle_members m
  join public.profiles p on p.id = m.profile_id
  where m.circle_id = p_circle
    and (public.is_circle_member(p_circle) or public.is_admin_or_mod())
    and (m.status = 'activ' or public.is_circle_leader(p_circle) or public.is_admin_or_mod())
  order by m.rol = 'lider' desc, m.status = 'activ' desc, p.nume_complet;
$$;

-- --------------------------------------------------------------------------
-- Triggere de protectie
-- --------------------------------------------------------------------------

-- Un membru obisnuit nu-si poate schimba singur statusul ("cerere" -> "activ")
-- sau rolul ("membru" -> "lider"). Doar liderul cercului, adminii sau serverul.
create function public.protect_circle_member_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.is_circle_leader(new.circle_id) or public.is_admin_or_mod() or auth.role() = 'service_role') then
    new.status := old.status;
    new.rol := old.rol;
    new.joined_at := old.joined_at;
  end if;
  if new.status = 'activ' and old.status <> 'activ' and new.joined_at is null then
    new.joined_at := now();
  end if;
  return new;
end;
$$;

create trigger circle_members_protect
  before update on public.circle_members
  for each row execute procedure public.protect_circle_member_fields();

-- Cercul nu poate trece de numarul maxim de membri activi.
create function public.check_circle_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_max integer;
  v_activi integer;
begin
  if new.status <> 'activ' then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.status = 'activ' then
    return new;
  end if;

  select max_membri into v_max from public.circles where id = new.circle_id for update;
  select count(*) into v_activi from public.circle_members
    where circle_id = new.circle_id and status = 'activ';

  if v_activi >= v_max then
    raise exception 'Cercul este complet' using errcode = 'P0001';
  end if;
  if new.joined_at is null then
    new.joined_at := now();
  end if;
  return new;
end;
$$;

create trigger circle_members_capacity
  before insert or update on public.circle_members
  for each row execute procedure public.check_circle_capacity();

create function public.touch_circle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger circles_touch_updated_at
  before update on public.circles
  for each row execute procedure public.touch_circle_updated_at();

-- --------------------------------------------------------------------------
-- RLS
-- --------------------------------------------------------------------------
alter table public.circles enable row level security;
alter table public.circle_members enable row level security;
alter table public.circle_meetings enable row level security;
alter table public.circle_meeting_rsvps enable row level security;
alter table public.circle_commitments enable row level security;
alter table public.circle_messages enable row level security;

-- circles
create policy "cercurile active sunt vizibile utilizatorilor autentificati" on public.circles
  for select using ((activ and auth.uid() is not null) or public.is_circle_member(id) or public.is_admin_or_mod());
create policy "adminul creeaza cercuri" on public.circles
  for insert with check (public.is_admin_or_mod());
create policy "adminul sau liderul editeaza cercul" on public.circles
  for update using (public.is_admin_or_mod() or public.is_circle_leader(id))
  with check (public.is_admin_or_mod() or public.is_circle_leader(id));
create policy "adminul sterge cercuri" on public.circles
  for delete using (public.is_admin_or_mod());

-- circle_members
create policy "vad propria cerere si membrii cercurilor mele" on public.circle_members
  for select using (
    profile_id = auth.uid()
    or public.is_admin_or_mod()
    or (public.is_circle_member(circle_id) and (status = 'activ' or public.is_circle_leader(circle_id)))
  );
create policy "un membru verificat cere loc intr-un cerc" on public.circle_members
  for insert with check (
    public.is_admin_or_mod()
    or (
      profile_id = auth.uid()
      and status = 'cerere'
      and rol = 'membru'
      and exists (select 1 from public.profiles where id = auth.uid() and stare_verificare = 'verificat' and activ)
      and exists (select 1 from public.circles where id = circle_id and activ)
    )
  );
create policy "liderul sau adminul aproba cererile" on public.circle_members
  for update using (public.is_circle_leader(circle_id) or public.is_admin_or_mod())
  with check (public.is_circle_leader(circle_id) or public.is_admin_or_mod());
create policy "pleci singur sau te scoate liderul" on public.circle_members
  for delete using (profile_id = auth.uid() or public.is_circle_leader(circle_id) or public.is_admin_or_mod());

-- circle_meetings
create policy "membrii vad intalnirile" on public.circle_meetings
  for select using (public.is_circle_member(circle_id) or public.is_admin_or_mod());
create policy "liderul programeaza intalniri" on public.circle_meetings
  for insert with check (public.is_circle_leader(circle_id) or public.is_admin_or_mod());
create policy "liderul modifica intalniri" on public.circle_meetings
  for update using (public.is_circle_leader(circle_id) or public.is_admin_or_mod());
create policy "liderul sterge intalniri" on public.circle_meetings
  for delete using (public.is_circle_leader(circle_id) or public.is_admin_or_mod());

-- circle_meeting_rsvps
create policy "membrii vad confirmarile" on public.circle_meeting_rsvps
  for select using (
    exists (select 1 from public.circle_meetings mt where mt.id = meeting_id
            and (public.is_circle_member(mt.circle_id) or public.is_admin_or_mod()))
  );
create policy "membrul isi confirma prezenta" on public.circle_meeting_rsvps
  for insert with check (
    profile_id = auth.uid()
    and exists (select 1 from public.circle_meetings mt where mt.id = meeting_id and public.is_circle_member(mt.circle_id))
  );
create policy "membrul isi schimba raspunsul" on public.circle_meeting_rsvps
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "membrul isi retrage raspunsul" on public.circle_meeting_rsvps
  for delete using (profile_id = auth.uid());

-- circle_commitments
create policy "membrii vad angajamentele cercului" on public.circle_commitments
  for select using (public.is_circle_member(circle_id) or public.is_admin_or_mod());
create policy "membrul isi adauga angajamente" on public.circle_commitments
  for insert with check (profile_id = auth.uid() and public.is_circle_member(circle_id));
create policy "membrul isi bifeaza angajamentele" on public.circle_commitments
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "membrul isi sterge angajamentele" on public.circle_commitments
  for delete using (profile_id = auth.uid());

-- circle_messages
create policy "membrii vad mesajele cercului" on public.circle_messages
  for select using (public.is_circle_member(circle_id) or public.is_admin_or_mod());
create policy "membrii scriu in cerc" on public.circle_messages
  for insert with check (profile_id = auth.uid() and public.is_circle_member(circle_id));
create policy "autorul sau adminul sterge mesajul" on public.circle_messages
  for delete using (profile_id = auth.uid() or public.is_admin_or_mod());

grant execute on function public.circle_counts() to authenticated;
grant execute on function public.circle_member_profiles(uuid) to authenticated;
