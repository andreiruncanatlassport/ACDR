-- ============================================================================
-- ACDR — verificare email PROPRIE (optionala, neblocanta)
-- Ruleaza acest fisier AL ZECELEA, dupa 0001-0009.
--
-- De ce nu folosim indicatorul Supabase (auth.users.email_confirmed_at):
-- cu setarea "Confirm sign up" dezactivata (necesara ca inregistrarea sa
-- curga fara intreruperi), Supabase marcheaza automat emailul ca fiind
-- confirmat la creare — deci acel indicator nu ne mai spune nimic util.
-- Tinem evidenta noi, separat: implicit false, devine true doar cand
-- utilizatorul introduce codul primit pe email, cand vrea el.
-- ============================================================================

alter table public.profiles add column if not exists email_verificat boolean not null default false;
alter table public.profiles add column if not exists email_verificat_la timestamptz;

-- Protectie: utilizatorul NU isi poate seta singur email_verificat = true
-- (altfel ar putea ocoli verificarea printr-un update direct din browser).
-- Doar API-ul de verificare (care ruleaza cu service_role, dupa ce a validat
-- codul primit pe email) sau adminii pot schimba acest camp.
create function public.protect_email_verificat()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.is_admin_or_mod() or auth.role() = 'service_role') then
    new.email_verificat := old.email_verificat;
    new.email_verificat_la := old.email_verificat_la;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_email_verificat
  before update on public.profiles
  for each row execute procedure public.protect_email_verificat();
