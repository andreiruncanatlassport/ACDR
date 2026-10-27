-- ============================================================================
-- ACDR — redenumirea platformei din "Breasla" in "ACDR"
-- Ruleaza acest fisier dupa 0038. Actualizeaza clauzele generice deja salvate
-- in baza de date care mentionau vechiul nume al platformei.
-- ============================================================================

update public.clause_templates
set continut = replace(continut, 'platforma Breasla', 'platforma ACDR')
where continut like '%platforma Breasla%';
