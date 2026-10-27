-- ============================================================================
-- ACDR — timp de raspuns + rating denormalizat (pentru catalog rapid)
-- Ruleaza acest fisier AL OPTULEA, dupa 0001-0007.
-- ============================================================================

alter table public.companies add column if not exists timp_raspuns text
  check (timp_raspuns in ('sub_1h', 'sub_24h', '2_3_zile', 'peste_3_zile'));

alter table public.companies add column if not exists rating_mediu numeric(3,2) not null default 0;
alter table public.companies add column if not exists rating_numar integer not null default 0;

-- "timp_raspuns" e editabil de proprietar (adaugat la campurile permise deja
-- prin RLS-ul general de UPDATE al companies — nu necesita politica noua)

-- --------------------------------------------------------------------------
-- Recalculeaza rating-ul mediu al firmei ori de cate ori o recenzie e
-- aprobata/respinsa/stearsa. SECURITY DEFINER ca sa functioneze indiferent
-- cine a declansat schimbarea (admin la aprobare, sistem la stergere etc).
-- --------------------------------------------------------------------------
create function public.refresh_company_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
begin
  target_id := coalesce(new.reviewed_company_id, old.reviewed_company_id);

  update public.companies c
  set
    rating_mediu = coalesce(
      (select round(avg(r.rating)::numeric, 2) from public.reviews r
       where r.reviewed_company_id = target_id and r.status = 'approved'),
      0
    ),
    rating_numar = (
      select count(*) from public.reviews r
      where r.reviewed_company_id = target_id and r.status = 'approved'
    )
  where c.id = target_id;

  return coalesce(new, old);
end;
$$;

create trigger reviews_refresh_rating
  after update or delete on public.reviews
  for each row execute procedure public.refresh_company_rating();
