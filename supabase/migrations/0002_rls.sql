-- ============================================================================
-- ACDR — Row Level Security (RLS)
-- Ruleaza acest fisier AL DOILEA, dupa 0001_schema.sql.
--
-- Idee de baza:
--   - datele FIRMEI (companies, categorii, financiar) sunt publice odata aprobate,
--     pentru ca sunt date despre o persoana juridica, nu date cu caracter personal.
--   - datele PERSOANEI (profiles: nume, telefon personal, email personal) sunt
--     vizibile doar catre: chiar persoana, admini/moderatori, si firmele cu care
--     firma ei are o conexiune ACCEPTATA.
-- ============================================================================

-- --------------------------------------------------------------------------
-- Functii ajutatoare (SECURITY DEFINER = ocolesc RLS ca sa evite recursivitate)
-- --------------------------------------------------------------------------
create function public.is_admin_or_mod()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and rol in ('admin', 'moderator') and activ = true
  );
$$;

create function public.owns_company(company_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.companies
    where id = company_id and owner_id = auth.uid()
  );
$$;

-- adevarat daca exista o conexiune ACCEPTATA intre o firma a lui auth.uid()
-- si o firma a lui other_user_id
create function public.has_accepted_connection(other_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.connections conn
    join public.companies my_c on my_c.owner_id = auth.uid()
    join public.companies other_c on other_c.owner_id = other_user_id
    where conn.status = 'accepted'
      and (
        (conn.requester_company_id = my_c.id and conn.target_company_id = other_c.id)
        or
        (conn.requester_company_id = other_c.id and conn.target_company_id = my_c.id)
      )
  );
$$;

-- --------------------------------------------------------------------------
-- Activare RLS
-- --------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.judete enable row level security;
alter table public.categories enable row level security;
alter table public.category_caen_codes enable row level security;
alter table public.companies enable row level security;
alter table public.company_categories enable row level security;
alter table public.company_judete enable row level security;
alter table public.company_support_needs enable row level security;
alter table public.company_support_offers enable row level security;
alter table public.financial_snapshots enable row level security;
alter table public.connections enable row level security;
alter table public.messages enable row level security;
alter table public.admin_audit_log enable row level security;

-- --------------------------------------------------------------------------
-- PROFILES (date personale)
-- --------------------------------------------------------------------------
create policy "profil propriu vizibil" on public.profiles
  for select using (
    id = auth.uid()
    or public.is_admin_or_mod()
    or public.has_accepted_connection(id)
  );

create policy "profil propriu editabil" on public.profiles
  for update using (id = auth.uid() or public.is_admin_or_mod());

-- rândul de profil e creat automat de trigger-ul handle_new_user (security definer),
-- deci nu e nevoie de policy separata de insert pentru utilizatori.

-- --------------------------------------------------------------------------
-- JUDETE / CATEGORII / CAEN — referinta publica, editabila doar de admin
-- --------------------------------------------------------------------------
create policy "judete publice" on public.judete for select using (true);

create policy "categorii publice" on public.categories for select using (true);
create policy "categorii editabile de admin" on public.categories
  for all using (public.is_admin_or_mod()) with check (public.is_admin_or_mod());

create policy "caen public" on public.category_caen_codes for select using (true);
create policy "caen editabil de admin" on public.category_caen_codes
  for all using (public.is_admin_or_mod()) with check (public.is_admin_or_mod());

-- --------------------------------------------------------------------------
-- COMPANIES
-- --------------------------------------------------------------------------
create policy "firme aprobate publice, proprii vizibile, admin vede tot" on public.companies
  for select using (
    status = 'approved'
    or owner_id = auth.uid()
    or public.is_admin_or_mod()
  );

create policy "un user isi creeaza propria firma" on public.companies
  for insert with check (
    owner_id = auth.uid()
    and (status = 'pending' or public.is_admin_or_mod())
  );

create policy "proprietarul sau adminul editeaza firma" on public.companies
  for update using (owner_id = auth.uid() or public.is_admin_or_mod());

-- Owner-ul poate edita propriul profil de firma, DAR nu poate sa-si schimbe
-- singur statusul de moderare (status/aprobat_de/aprobat_la/cui) — acele
-- campuri sunt "resetate" automat daca cel ce scrie nu e admin/moderator/
-- service_role (vezi trigger-ul mai jos). Politica de UPDATE de mai sus
-- ramane permisiva la nivel de rand; protectia fina e la nivel de coloana.
create function public.protect_company_moderation_fields()
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
    new.cui := old.cui;
  end if;
  return new;
end;
$$;

create trigger companies_protect_moderation
  before update on public.companies
  for each row execute procedure public.protect_company_moderation_fields();

create policy "doar adminul sterge firme" on public.companies
  for delete using (public.is_admin_or_mod());

-- --------------------------------------------------------------------------
-- COMPANY_CATEGORIES / COMPANY_JUDETE / NEEDS / OFFERS
-- (vizibile daca firma e publica; editabile de proprietar/admin)
-- --------------------------------------------------------------------------
create policy "vizibil daca firma e publica sau proprie" on public.company_categories
  for select using (
    exists (select 1 from public.companies c where c.id = company_id and (c.status = 'approved' or c.owner_id = auth.uid()))
    or public.is_admin_or_mod()
  );
create policy "editabil de proprietar/admin" on public.company_categories
  for all using (public.owns_company(company_id) or public.is_admin_or_mod())
  with check (public.owns_company(company_id) or public.is_admin_or_mod());

create policy "vizibil daca firma e publica sau proprie" on public.company_judete
  for select using (
    exists (select 1 from public.companies c where c.id = company_id and (c.status = 'approved' or c.owner_id = auth.uid()))
    or public.is_admin_or_mod()
  );
create policy "editabil de proprietar/admin" on public.company_judete
  for all using (public.owns_company(company_id) or public.is_admin_or_mod())
  with check (public.owns_company(company_id) or public.is_admin_or_mod());

create policy "vizibil daca firma e publica sau proprie" on public.company_support_needs
  for select using (
    exists (select 1 from public.companies c where c.id = company_id and (c.status = 'approved' or c.owner_id = auth.uid()))
    or public.is_admin_or_mod()
  );
create policy "editabil de proprietar/admin" on public.company_support_needs
  for all using (public.owns_company(company_id) or public.is_admin_or_mod())
  with check (public.owns_company(company_id) or public.is_admin_or_mod());

create policy "vizibil daca firma e publica sau proprie" on public.company_support_offers
  for select using (
    exists (select 1 from public.companies c where c.id = company_id and (c.status = 'approved' or c.owner_id = auth.uid()))
    or public.is_admin_or_mod()
  );
create policy "editabil de proprietar/admin" on public.company_support_offers
  for all using (public.owns_company(company_id) or public.is_admin_or_mod())
  with check (public.owns_company(company_id) or public.is_admin_or_mod());

-- --------------------------------------------------------------------------
-- FINANCIAL_SNAPSHOTS — vizibile odata cu firma; scrise de server (service role)
-- sau manual de proprietar cand ANAF nu are date
-- --------------------------------------------------------------------------
create policy "vizibil daca firma e publica sau proprie" on public.financial_snapshots
  for select using (
    exists (select 1 from public.companies c where c.id = company_id and (c.status = 'approved' or c.owner_id = auth.uid()))
    or public.is_admin_or_mod()
  );
create policy "proprietarul adauga date manuale" on public.financial_snapshots
  for insert with check (public.owns_company(company_id) or public.is_admin_or_mod());
create policy "proprietarul actualizeaza date manuale" on public.financial_snapshots
  for update using (public.owns_company(company_id) or public.is_admin_or_mod());

-- --------------------------------------------------------------------------
-- CONNECTIONS
-- --------------------------------------------------------------------------
create policy "vad conexiunile firmelor mele" on public.connections
  for select using (
    public.owns_company(requester_company_id)
    or public.owns_company(target_company_id)
    or public.is_admin_or_mod()
  );

create policy "firma mea poate trimite o cerere de conexiune" on public.connections
  for insert with check (public.owns_company(requester_company_id));

create policy "target-ul accepta/refuza, requester-ul poate anula" on public.connections
  for update using (
    public.owns_company(target_company_id)
    or public.owns_company(requester_company_id)
    or public.is_admin_or_mod()
  );

-- --------------------------------------------------------------------------
-- MESSAGES (Faza 2 — politica pregatita din timp)
-- doar participantii la conexiunea ACCEPTATA pot citi/scrie mesaje
-- --------------------------------------------------------------------------
create policy "participantii vad mesajele conexiunii" on public.messages
  for select using (
    exists (
      select 1 from public.connections conn
      where conn.id = connection_id
        and conn.status = 'accepted'
        and (public.owns_company(conn.requester_company_id) or public.owns_company(conn.target_company_id))
    )
  );

create policy "participantii trimit mesaje" on public.messages
  for insert with check (
    public.owns_company(sender_company_id)
    and exists (
      select 1 from public.connections conn
      where conn.id = connection_id
        and conn.status = 'accepted'
        and (conn.requester_company_id = sender_company_id or conn.target_company_id = sender_company_id)
    )
  );

-- --------------------------------------------------------------------------
-- ADMIN AUDIT LOG — doar adminii/moderatorii
-- --------------------------------------------------------------------------
create policy "doar adminii vad jurnalul" on public.admin_audit_log
  for select using (public.is_admin_or_mod());
create policy "doar adminii scriu in jurnal" on public.admin_audit_log
  for insert with check (public.is_admin_or_mod());
