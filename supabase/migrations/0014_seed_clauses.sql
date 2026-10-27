-- ============================================================================
-- ACDR — bibliotecă de clauze pentru înțelegeri
-- Ruleaza acest fisier AL PAISPREZECELEA, dupa 0013.
--
-- ATENTIE: acestea sunt formulari de LUCRU, gandite sa ajute doua firme sa se
-- puna de acord clar pe termeni. NU sunt clauze contractuale validate juridic
-- si nu inlocuiesc un contract redactat de un avocat. Documentul rezultat e un
-- "rezumat al intelegerii", nu un contract cu valoare juridica.
--
-- Le poti edita/adauga din Admin dupa ce le revizuiesti cu un jurist.
-- ============================================================================

-- --------------------------------------------------------------------------
-- Clauze GENERICE (category_id = null) — apar la orice înțelegere
-- --------------------------------------------------------------------------
insert into public.clause_templates (category_id, titlu, continut, ordine) values
  (null, 'Obiectul colaborării',
   'Părțile au convenit asupra executării lucrării descrise mai sus, în condițiile și la termenele stabilite în prezentul document.', 10),

  (null, 'Termen de execuție',
   'Lucrarea va fi executată în intervalul stabilit la secțiunea Termene. Orice depășire va fi anunțată în scris, cu cel puțin 3 zile lucrătoare înainte de termenul afectat.', 20),

  (null, 'Modalitate de plată',
   'Plata se face conform modalității stabilite mai sus, pe baza facturii emise de prestator. Termenul de plată este de 15 zile calendaristice de la emiterea facturii, dacă părțile nu au convenit altfel.', 30),

  (null, 'Întârzieri la plată',
   'În cazul întârzierii plății peste termenul convenit, prestatorul poate solicita penalități de 0,1% din suma restantă pentru fiecare zi de întârziere, fără a depăși valoarea sumei restante.', 40),

  (null, 'Modificări ale lucrării',
   'Orice modificare a obiectului, prețului sau termenelor se face doar prin acordul ambelor părți, exprimat printr-o nouă versiune a acestei înțelegeri în platforma ACDR.', 50),

  (null, 'Confidențialitate',
   'Părțile se obligă să păstreze confidențialitatea informațiilor comerciale, tehnice și financiare la care au acces în cadrul acestei colaborări, atât pe durata acesteia, cât și 2 ani după încheierea ei.', 60),

  (null, 'Forță majoră',
   'Niciuna dintre părți nu răspunde pentru neexecutarea obligațiilor dacă aceasta se datorează unui eveniment de forță majoră, dovedit conform legii. Partea afectată va anunța cealaltă parte în termen de 5 zile de la apariția evenimentului.', 70),

  (null, 'Încetarea colaborării',
   'Colaborarea poate înceta prin acordul părților, prin finalizarea lucrării, sau prin notificare scrisă cu 15 zile înainte, cu decontarea lucrărilor executate până la acea dată.', 80),

  (null, 'Soluționarea neînțelegerilor',
   'Părțile vor încerca soluționarea pe cale amiabilă a oricărei neînțelegeri. În caz contrar, litigiul va fi soluționat de instanțele competente de la sediul pârâtului.', 90),

  (null, 'Comunicare',
   'Comunicarea între părți se face prin platforma ACDR, email sau telefon, la datele de contact din profilurile firmelor. Deciziile importante se consemnează în scris.', 100);

-- --------------------------------------------------------------------------
-- Clauze pe CATEGORII
-- --------------------------------------------------------------------------

-- Construcții
insert into public.clause_templates (category_id, titlu, continut, ordine)
select c.id, v.titlu, v.continut, v.ordine
from (values
  ('Garanția lucrărilor',
   'Prestatorul acordă o garanție de 24 de luni pentru lucrările executate, de la data recepției. În perioada de garanție, defectele imputabile execuției se remediază gratuit, în termen de maximum 15 zile de la sesizare.', 200),
  ('Materiale și dotări',
   'Materialele sunt asigurate de prestator, dacă părțile nu au convenit altfel. Calitatea materialelor trebuie să corespundă normelor tehnice în vigoare, iar beneficiarul poate solicita certificate de conformitate.', 210),
  ('Recepția lucrărilor',
   'Recepția se face în prezența ambelor părți, pe bază de proces-verbal. Eventualele neconformități se consemnează și se remediază în termenul stabilit de comun acord.', 220),
  ('Securitatea în muncă',
   'Prestatorul răspunde de respectarea normelor de securitate și sănătate în muncă pentru personalul propriu și de asigurarea echipamentelor de protecție necesare.', 230),
  ('Curățenia șantierului',
   'La finalizarea lucrărilor, prestatorul predă spațiul curat, cu evacuarea deșeurilor rezultate din activitatea proprie.', 240)
) as v(titlu, continut, ordine)
cross join (select id from public.categories where slug = 'constructii') as c;

-- IT & Software
insert into public.clause_templates (category_id, titlu, continut, ordine)
select c.id, v.titlu, v.continut, v.ordine
from (values
  ('Drepturi asupra codului',
   'La achitarea integrală a prețului, drepturile patrimoniale de autor asupra codului dezvoltat special pentru beneficiar se transferă acestuia. Componentele open-source sau bibliotecile terțe rămân sub licențele proprii.', 200),
  ('Perioadă de garanție și remedieri',
   'Prestatorul remediază gratuit defectele de funcționalitate raportate în termen de 90 de zile de la livrare, dacă acestea se datorează implementării și nu unor modificări făcute ulterior de beneficiar.', 210),
  ('Mentenanță',
   'Mentenanța, actualizările și suportul după perioada de garanție fac obiectul unei înțelegeri separate.', 220),
  ('Date și acces',
   'Beneficiarul asigură accesul la sistemele și datele necesare. Prestatorul folosește aceste date exclusiv pentru executarea lucrării și le șterge la finalizare, la cererea beneficiarului.', 230),
  ('Livrare și recepție',
   'Livrarea se consideră făcută la punerea în funcțiune în mediul convenit. Beneficiarul are 10 zile lucrătoare pentru testare și semnalarea neconformităților.', 240)
) as v(titlu, continut, ordine)
cross join (select id from public.categories where slug = 'it-software') as c;

-- Transport & Logistică
insert into public.clause_templates (category_id, titlu, continut, ordine)
select c.id, v.titlu, v.continut, v.ordine
from (values
  ('Răspunderea pentru marfă',
   'Transportatorul răspunde pentru integritatea mărfii din momentul preluării până la predarea la destinație, conform documentelor de transport.', 200),
  ('Asigurare',
   'Transportatorul deține asigurare de răspundere civilă a transportatorului (CMR pentru transport internațional), valabilă pe toată durata colaborării.', 210),
  ('Termene de încărcare/descărcare',
   'Timpul de staționare gratuit la încărcare și descărcare este de 2 ore. Depășirea se facturează separat, la tariful convenit.', 220),
  ('Documente de transport',
   'Expeditorul asigură documentele necesare transportului. Transportatorul verifică concordanța la preluare și semnalează imediat orice neconcordanță.', 230)
) as v(titlu, continut, ordine)
cross join (select id from public.categories where slug = 'transport-logistica') as c;

-- Marketing & Publicitate
insert into public.clause_templates (category_id, titlu, continut, ordine)
select c.id, v.titlu, v.continut, v.ordine
from (values
  ('Drepturi asupra materialelor',
   'La achitarea integrală, beneficiarul dobândește drepturile de utilizare asupra materialelor create. Fotografiile de stock, fonturile și muzica sub licență rămân supuse licențelor respective.', 200),
  ('Revizii incluse',
   'Prețul include 2 runde de revizii pentru fiecare livrabil. Reviziile suplimentare se tarifează separat, la tariful orar convenit.', 210),
  ('Aprobarea materialelor',
   'Beneficiarul aprobă materialele în scris înainte de publicare. Termenul de răspuns este de 5 zile lucrătoare; depășirea lui poate decala termenele.', 220),
  ('Portofoliu',
   'Prestatorul poate folosi materialele realizate în portofoliul propriu, cu excepția cazului în care beneficiarul solicită expres confidențialitate.', 230),
  ('Bugete media',
   'Bugetele de promovare (reclame plătite) sunt separate de onorariul prestatorului și se achită direct de beneficiar sau se decontează pe bază de documente justificative.', 240)
) as v(titlu, continut, ordine)
cross join (select id from public.categories where slug = 'marketing-publicitate') as c;

-- Consultanță & Servicii financiare
insert into public.clause_templates (category_id, titlu, continut, ordine)
select c.id, v.titlu, v.continut, v.ordine
from (values
  ('Natura serviciilor',
   'Prestatorul oferă consultanță de specialitate pe baza informațiilor puse la dispoziție de beneficiar. Deciziile de afaceri rămân în responsabilitatea exclusivă a beneficiarului.', 200),
  ('Documente și informații',
   'Beneficiarul pune la dispoziție documentele și informațiile necesare, complete și corecte. Prestatorul nu răspunde pentru concluzii bazate pe informații incomplete sau eronate.', 210),
  ('Confidențialitate profesională',
   'Prestatorul păstrează confidențialitatea tuturor informațiilor financiare, contabile și de afaceri, inclusiv după încetarea colaborării.', 220),
  ('Rapoarte și livrabile',
   'Livrabilele convenite se predau în format electronic. Prestatorul păstrează o copie pentru perioada prevăzută de lege.', 230)
) as v(titlu, continut, ordine)
cross join (select id from public.categories where slug = 'consultanta-financiar') as c;

-- Producție & Industrie
insert into public.clause_templates (category_id, titlu, continut, ordine)
select c.id, v.titlu, v.continut, v.ordine
from (values
  ('Specificații tehnice',
   'Produsele se execută conform specificațiilor tehnice agreate în scris. Orice abatere se comunică și se aprobă înainte de execuție.', 200),
  ('Control de calitate',
   'Beneficiarul poate verifica produsele înainte de livrare. Produsele neconforme se înlocuiesc sau se remediază pe cheltuiala prestatorului.', 210),
  ('Cantități și toleranțe',
   'Se acceptă o toleranță de +/- 5% la cantitatea comandată, dacă părțile nu au convenit altfel. Facturarea se face la cantitatea efectiv livrată.', 220),
  ('Ambalare și livrare',
   'Prestatorul asigură ambalarea corespunzătoare pentru transport. Riscul trece la beneficiar la momentul predării, conform condiției de livrare convenite.', 230)
) as v(titlu, continut, ordine)
cross join (select id from public.categories where slug = 'productie-industrie') as c;

-- Servicii pentru firme
insert into public.clause_templates (category_id, titlu, continut, ordine)
select c.id, v.titlu, v.continut, v.ordine
from (values
  ('Program de prestare',
   'Serviciile se prestează în intervalul orar convenit. Modificările de program se anunță cu cel puțin 24 de ore înainte.', 200),
  ('Personal și înlocuiri',
   'Prestatorul asigură personal calificat și poate face înlocuiri, cu menținerea aceluiași nivel de calitate.', 210),
  ('Materiale și echipamente',
   'Materialele consumabile și echipamentele necesare sunt asigurate de prestator, dacă părțile nu au convenit altfel.', 220)
) as v(titlu, continut, ordine)
cross join (select id from public.categories where slug = 'servicii-firme') as c;
