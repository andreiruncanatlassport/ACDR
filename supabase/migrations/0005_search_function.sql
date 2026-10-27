-- ============================================================================
-- ACDR — functie de cautare pe raza de deservire
-- Ruleaza acest fisier AL CINCILEA (ultimul).
--
-- Gaseste firmele APROBATE a caror raza de deservire (raza_deservire_km, in
-- jurul sediului) acopera un punct dat (ex: adresa introdusa de cel care
-- cauta). Returneaza si distanta in km, utila pentru sortare "cel mai
-- aproape primul".
-- ============================================================================
create or replace function public.search_companies_serving_point(
  target_lat double precision,
  target_lng double precision
)
returns table (company_id uuid, distanta_km double precision)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    c.id as company_id,
    ST_Distance(
      c.geo,
      ST_SetSRID(ST_MakePoint(target_lng, target_lat), 4326)::geography
    ) / 1000.0 as distanta_km
  from public.companies c
  where c.status = 'approved'
    and c.geo is not null
    and c.raza_deservire_km is not null
    and ST_DWithin(
      c.geo,
      ST_SetSRID(ST_MakePoint(target_lng, target_lat), 4326)::geography,
      c.raza_deservire_km * 1000
    )
  order by distanta_km asc;
$$;

grant execute on function public.search_companies_serving_point(double precision, double precision) to anon, authenticated;
