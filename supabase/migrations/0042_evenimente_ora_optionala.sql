-- ============================================================================
-- ACDR — 0042: ora evenimentelor devine optionala
--
-- Un eveniment poate avea doar data („pe 14 noiembrie”), fara ora. Coloana
-- data_inceput ramane timestamptz (obligatorie); cand nu exista ora, aplicatia
-- salveaza miezul noptii, ora Romaniei, si marcheaza are_ora_inceput = false,
-- ca sa afiseze doar data. La fel pentru data_sfarsit.
--
-- Evenimentele existente au fost salvate cu ora, deci implicit = true.
-- ============================================================================

alter table public.events
  add column if not exists are_ora_inceput boolean not null default true,
  add column if not exists are_ora_sfarsit boolean not null default true;

comment on column public.events.are_ora_inceput is
  'false = evenimentul are doar data de inceput (ora nu se afiseaza)';
comment on column public.events.are_ora_sfarsit is
  'false = data de sfarsit fara ora (ora nu se afiseaza)';
