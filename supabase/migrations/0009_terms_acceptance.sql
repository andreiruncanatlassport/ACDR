-- ============================================================================
-- ACDR — acceptul Termenilor & Conditiilor la inregistrare
-- Ruleaza acest fisier AL NOUALEA, dupa 0001-0008.
-- ============================================================================

alter table public.profiles add column if not exists termeni_acceptati_la timestamptz;
alter table public.profiles add column if not exists termeni_versiune text;
