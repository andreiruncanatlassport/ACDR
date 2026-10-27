-- ============================================================================
-- ACDR — recenzii deblocate de colaborările finalizate
-- Ruleaza acest fisier AL CINCISPREZECELEA, dupa 0014.
--
-- IDEEA: pana acum, orice recenzie cerea o dovada incarcata manual (contract,
-- comanda) si aprobarea unui admin. Daca insa colaborarea s-a desfasurat IN
-- platforma si ambele firme au marcat-o "finalizata", platforma ESTE dovada —
-- nu mai are rost sa cerem un document si nici munca de moderare.
--
-- Rezultat: recenziile bazate pe o intelegere finalizata se publica automat;
-- restul raman pe fluxul clasic (dovada + aprobare manuala).
-- ============================================================================

alter table public.reviews add column if not exists deal_id uuid references public.deals (id) on delete set null;
alter table public.reviews add column if not exists verificata_automat boolean not null default false;

-- Dovada nu mai e obligatorie daca recenzia se sprijina pe o intelegere
-- finalizata (verificarea efectiva se face in trigger-ul de mai jos).

create or replace function public.exista_deal_finalizat(firma_a uuid, firma_b uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select d.id
  from public.deals d
  where d.status = 'finalizat'
    and (
      (d.company_a_id = firma_a and d.company_b_id = firma_b)
      or (d.company_a_id = firma_b and d.company_b_id = firma_a)
    )
  order by d.updated_at desc
  limit 1;
$$;

grant execute on function public.exista_deal_finalizat(uuid, uuid) to anon, authenticated;

-- La inserarea unei recenzii, verificam daca exista o intelegere finalizata
-- intre cele doua firme. Daca da: o aprobam automat si o marcam ca verificata
-- de platforma. SECURITY DEFINER, ca sa poata scrie in campurile protejate.
create or replace function public.auto_aproba_recenzie_cu_deal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  deal_gasit uuid;
begin
  deal_gasit := public.exista_deal_finalizat(new.reviewer_company_id, new.reviewed_company_id);

  if deal_gasit is not null then
    new.deal_id := deal_gasit;
    new.verificata_automat := true;
    new.status := 'approved';
    new.aprobat_la := now();
  end if;

  return new;
end;
$$;

-- Trebuie sa ruleze INAINTE de trigger-ul care protejeaza campurile de
-- moderare. Numele conteaza: Postgres executa trigger-ele BEFORE in ordine
-- alfabetica, iar "auto_aproba..." vine inaintea lui "reviews_protect...".
create trigger auto_aproba_recenzie
  before insert on public.reviews
  for each row execute procedure public.auto_aproba_recenzie_cu_deal();

-- Recalculam rating-ul si la INSERT (pana acum doar la update/delete), altfel
-- o recenzie aprobata automat nu s-ar reflecta in medie.
drop trigger if exists reviews_refresh_rating on public.reviews;
create trigger reviews_refresh_rating
  after insert or update or delete on public.reviews
  for each row execute procedure public.refresh_company_rating();
