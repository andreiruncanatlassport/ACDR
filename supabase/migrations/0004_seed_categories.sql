-- ============================================================================
-- ACDR — taxonomie de categorii + mapare CAEN (varianta DRAFT)
-- Ruleaza acest fisier AL PATRULEA.
--
-- IMPORTANT: codurile CAEN de mai jos sunt mai ales la nivel de DIVIZIE
-- (2 cifre), alese cu incredere ridicata, ca punct de plecare functional.
-- Nu sunt o lista exhaustiva/juridica definitiva. Din Admin > Categorii poti
-- oricand adauga/edita coduri CAEN mai specifice (4 cifre) pentru fiecare
-- categorie, pe masura ce vedeti ce firme se inregistreaza. In perioada de
-- tranzitie CAEN Rev.2 -> Rev.3 (pana la 25 sept. 2026), firmele pot avea
-- coduri din oricare din cele doua versiuni — de-asta exista coloana
-- caen_version.
-- ============================================================================

-- --------------------------------------------------------------------------
-- Categorii principale
-- --------------------------------------------------------------------------
insert into public.categories (slug, name_ro, name_en, parent_id, ordine) values
  ('constructii',           'Construcții și amenajări',        'Construction & renovation',      null, 10),
  ('it-software',           'IT & Software',                    'IT & Software',                  null, 20),
  ('marketing-publicitate', 'Marketing & Publicitate',          'Marketing & Advertising',        null, 30),
  ('consultanta-financiar', 'Consultanță & Servicii financiare','Consulting & Financial services',null, 40),
  ('transport-logistica',   'Transport & Logistică',            'Transport & Logistics',          null, 50),
  ('productie-industrie',   'Producție & Industrie',            'Manufacturing & Industry',       null, 60),
  ('horeca-evenimente',     'HoReCa & Evenimente',              'Hospitality & Events',           null, 70),
  ('comert',                'Comerț',                           'Retail & Trade',                 null, 80),
  ('sanatate-wellness',     'Sănătate & Wellness',              'Health & Wellness',              null, 90),
  ('educatie-training',     'Educație & Training',              'Education & Training',           null, 100),
  ('imobiliare',            'Imobiliare',                       'Real Estate',                    null, 110),
  ('agricultura',           'Agricultură & Industrie alimentară','Agriculture & Food industry',   null, 120),
  ('energie-utilitati',     'Energie & Utilități',              'Energy & Utilities',             null, 130),
  ('auto-mobilitate',       'Auto & Mobilitate',                'Automotive & Mobility',          null, 140),
  ('servicii-firme',        'Servicii pentru firme',            'Business Services',              null, 150),
  ('arte-design',           'Arte, Design & Creație',           'Arts, Design & Creative',        null, 160),
  ('telecomunicatii',       'Telecomunicații',                  'Telecommunications',             null, 170),
  ('cultura-sport',         'Cultură, Sport & Recreere',        'Culture, Sport & Recreation',     null, 180),
  ('productie-media',       'Producție media & Content',        'Media production & Content',     null, 190),
  ('alte-servicii',         'Alte servicii',                    'Other services',                  null, 999)
on conflict (slug) do nothing;

-- --------------------------------------------------------------------------
-- Subcategorii — Construcții
-- --------------------------------------------------------------------------
insert into public.categories (slug, name_ro, name_en, parent_id, ordine)
select v.slug, v.name_ro, v.name_en, c.id, v.ordine
from (values
  ('constructii-civile',       'Construcții civile și industriale', 'Civil & industrial construction', 1),
  ('instalatii-electrice',     'Instalații electrice',              'Electrical installations',        2),
  ('instalatii-sanitare',      'Instalații sanitare și termice',    'Plumbing & HVAC',                 3),
  ('finisaje-amenajari',       'Amenajări interioare și finisaje',  'Interior fit-out & finishing',    4),
  ('acoperisuri-tamplarie',    'Acoperișuri și tâmplărie',          'Roofing & carpentry',             5),
  ('arhitectura-proiectare',   'Arhitectură și proiectare',         'Architecture & design',           6)
) as v(slug, name_ro, name_en, ordine)
cross join (select id from public.categories where slug = 'constructii') as c
on conflict (slug) do nothing;

-- --------------------------------------------------------------------------
-- Subcategorii — IT & Software
-- --------------------------------------------------------------------------
insert into public.categories (slug, name_ro, name_en, parent_id, ordine)
select v.slug, v.name_ro, v.name_en, c.id, v.ordine
from (values
  ('dezvoltare-software',  'Dezvoltare software & aplicații', 'Software & app development', 1),
  ('web-design',           'Web design & site-uri',           'Web design & websites',       2),
  ('consultanta-it',       'Consultanță IT & cloud',          'IT consulting & cloud',       3),
  ('securitate-cibernetica','Securitate cibernetică',         'Cybersecurity',               4),
  ('mentenanta-it',        'Mentenanță IT & infrastructură',  'IT maintenance & infrastructure', 5)
) as v(slug, name_ro, name_en, ordine)
cross join (select id from public.categories where slug = 'it-software') as c
on conflict (slug) do nothing;

-- --------------------------------------------------------------------------
-- Subcategorii — Marketing & Publicitate
-- --------------------------------------------------------------------------
insert into public.categories (slug, name_ro, name_en, parent_id, ordine)
select v.slug, v.name_ro, v.name_en, c.id, v.ordine
from (values
  ('marketing-digital',    'Marketing digital & SEO',         'Digital marketing & SEO',    1),
  ('publicitate-pr',       'Publicitate și PR',               'Advertising & PR',           2),
  ('social-media',         'Social media management',         'Social media management',    3),
  ('productie-foto-video', 'Producție foto & video',          'Photo & video production',   4),
  ('branding-grafica',     'Branding & design grafic',        'Branding & graphic design',  5)
) as v(slug, name_ro, name_en, ordine)
cross join (select id from public.categories where slug = 'marketing-publicitate') as c
on conflict (slug) do nothing;

-- --------------------------------------------------------------------------
-- Subcategorii — Consultanță & Financiar
-- --------------------------------------------------------------------------
insert into public.categories (slug, name_ro, name_en, parent_id, ordine)
select v.slug, v.name_ro, v.name_en, c.id, v.ordine
from (values
  ('consultanta-management','Consultanță în management',      'Management consulting',      1),
  ('contabilitate-fiscal',  'Contabilitate și fiscalitate',    'Accounting & tax',           2),
  ('consultanta-juridica',  'Consultanță juridică',            'Legal consulting',           3),
  ('resurse-umane',         'Resurse umane și recrutare',      'HR & recruitment',           4),
  ('fonduri-europene',      'Consultanță fonduri europene',    'EU funding consulting',      5),
  ('asigurari',             'Asigurări și intermedieri financiare', 'Insurance & financial brokerage', 6)
) as v(slug, name_ro, name_en, ordine)
cross join (select id from public.categories where slug = 'consultanta-financiar') as c
on conflict (slug) do nothing;

-- --------------------------------------------------------------------------
-- Subcategorii — Transport & Logistică
-- --------------------------------------------------------------------------
insert into public.categories (slug, name_ro, name_en, parent_id, ordine)
select v.slug, v.name_ro, v.name_en, c.id, v.ordine
from (values
  ('transport-marfa',      'Transport marfă rutier',          'Road freight transport',     1),
  ('curierat-livrari',     'Curierat și livrări',             'Courier & delivery',         2),
  ('depozitare',           'Depozitare',                      'Warehousing',                3),
  ('transport-persoane',   'Transport persoane',              'Passenger transport',        4),
  ('expeditii-internationale', 'Expediții internaționale',    'International freight forwarding', 5)
) as v(slug, name_ro, name_en, ordine)
cross join (select id from public.categories where slug = 'transport-logistica') as c
on conflict (slug) do nothing;

-- --------------------------------------------------------------------------
-- Subcategorii — Producție & Industrie
-- --------------------------------------------------------------------------
insert into public.categories (slug, name_ro, name_en, parent_id, ordine)
select v.slug, v.name_ro, v.name_en, c.id, v.ordine
from (values
  ('productie-alimentara', 'Producție alimentară',            'Food production',            1),
  ('productie-textila',    'Producție textilă și confecții',  'Textile & garment production',2),
  ('productie-mobila',     'Producție mobilă',                'Furniture manufacturing',    3),
  ('metalurgie',           'Metalurgie și prelucrarea metalelor', 'Metalworking',            4),
  ('materiale-constructii','Producție materiale de construcții', 'Construction materials production', 5)
) as v(slug, name_ro, name_en, ordine)
cross join (select id from public.categories where slug = 'productie-industrie') as c
on conflict (slug) do nothing;

-- --------------------------------------------------------------------------
-- Subcategorii — HoReCa & Evenimente
-- --------------------------------------------------------------------------
insert into public.categories (slug, name_ro, name_en, parent_id, ordine)
select v.slug, v.name_ro, v.name_en, c.id, v.ordine
from (values
  ('restaurante-catering', 'Restaurante și catering',         'Restaurants & catering',     1),
  ('hoteluri-cazare',      'Hoteluri și cazare',              'Hotels & accommodation',     2),
  ('organizare-evenimente','Organizare evenimente',           'Event planning',             3),
  ('cafenele-baruri',      'Cafenele și baruri',              'Cafes & bars',               4)
) as v(slug, name_ro, name_en, ordine)
cross join (select id from public.categories where slug = 'horeca-evenimente') as c
on conflict (slug) do nothing;

-- --------------------------------------------------------------------------
-- Subcategorii — Comerț
-- --------------------------------------------------------------------------
insert into public.categories (slug, name_ro, name_en, parent_id, ordine)
select v.slug, v.name_ro, v.name_en, c.id, v.ordine
from (values
  ('comert-ridicata',      'Comerț cu ridicata',              'Wholesale trade',            1),
  ('comert-amanuntul',     'Comerț cu amănuntul',             'Retail trade',                2),
  ('ecommerce',            'Comerț online / e-commerce',      'E-commerce',                  3),
  ('import-export',        'Import-export',                   'Import-export',               4)
) as v(slug, name_ro, name_en, ordine)
cross join (select id from public.categories where slug = 'comert') as c
on conflict (slug) do nothing;

-- --------------------------------------------------------------------------
-- Subcategorii — Sănătate & Wellness
-- --------------------------------------------------------------------------
insert into public.categories (slug, name_ro, name_en, parent_id, ordine)
select v.slug, v.name_ro, v.name_en, c.id, v.ordine
from (values
  ('clinici-cabinete',     'Clinici și cabinete medicale',    'Clinics & medical practices', 1),
  ('farmacii',             'Farmacii',                        'Pharmacies',                  2),
  ('fitness-wellness',     'Fitness și wellness',             'Fitness & wellness',          3),
  ('ingrijire-personala',  'Îngrijire personală (beauty & spa)','Personal care (beauty & spa)',4)
) as v(slug, name_ro, name_en, ordine)
cross join (select id from public.categories where slug = 'sanatate-wellness') as c
on conflict (slug) do nothing;

-- --------------------------------------------------------------------------
-- Subcategorii — Educație & Training
-- --------------------------------------------------------------------------
insert into public.categories (slug, name_ro, name_en, parent_id, ordine)
select v.slug, v.name_ro, v.name_en, c.id, v.ordine
from (values
  ('training-corporate',   'Cursuri și traininguri corporate','Corporate training',          1),
  ('meditatii',            'Meditații și cursuri individuale','Tutoring & individual courses',2),
  ('gradinite-afterschool','Grădinițe și afterschool',        'Kindergartens & afterschool', 3),
  ('elearning',            'E-learning',                      'E-learning',                   4)
) as v(slug, name_ro, name_en, ordine)
cross join (select id from public.categories where slug = 'educatie-training') as c
on conflict (slug) do nothing;

-- --------------------------------------------------------------------------
-- Subcategorii — Imobiliare
-- --------------------------------------------------------------------------
insert into public.categories (slug, name_ro, name_en, parent_id, ordine)
select v.slug, v.name_ro, v.name_en, c.id, v.ordine
from (values
  ('agentii-imobiliare',   'Agenții imobiliare',              'Real estate agencies',        1),
  ('administrare-proprietati','Administrare proprietăți',     'Property management',         2),
  ('dezvoltare-imobiliara','Dezvoltare imobiliară',           'Real estate development',     3)
) as v(slug, name_ro, name_en, ordine)
cross join (select id from public.categories where slug = 'imobiliare') as c
on conflict (slug) do nothing;

-- --------------------------------------------------------------------------
-- Subcategorii — Agricultură
-- --------------------------------------------------------------------------
insert into public.categories (slug, name_ro, name_en, parent_id, ordine)
select v.slug, v.name_ro, v.name_en, c.id, v.ordine
from (values
  ('productie-agricola',   'Producție agricolă',              'Agricultural production',     1),
  ('cresterea-animalelor', 'Creșterea animalelor',            'Animal husbandry',            2),
  ('procesare-alimentara', 'Procesare produse alimentare',    'Food processing',             3),
  ('distributie-agroalimentara','Distribuție produse agroalimentare','Agri-food distribution',4)
) as v(slug, name_ro, name_en, ordine)
cross join (select id from public.categories where slug = 'agricultura') as c
on conflict (slug) do nothing;

-- --------------------------------------------------------------------------
-- Subcategorii — Energie & Utilități
-- --------------------------------------------------------------------------
insert into public.categories (slug, name_ro, name_en, parent_id, ordine)
select v.slug, v.name_ro, v.name_en, c.id, v.ordine
from (values
  ('panouri-fotovoltaice', 'Panouri fotovoltaice',            'Solar panels',                 1),
  ('eficienta-energetica', 'Eficiență energetică',            'Energy efficiency',            2),
  ('instalatii-electrice-industriale','Instalații electrice industriale','Industrial electrical installations',3),
  ('servicii-mediu',       'Servicii de mediu & deșeuri',     'Environmental & waste services',4)
) as v(slug, name_ro, name_en, ordine)
cross join (select id from public.categories where slug = 'energie-utilitati') as c
on conflict (slug) do nothing;

-- --------------------------------------------------------------------------
-- Subcategorii — Auto & Mobilitate
-- --------------------------------------------------------------------------
insert into public.categories (slug, name_ro, name_en, parent_id, ordine)
select v.slug, v.name_ro, v.name_en, c.id, v.ordine
from (values
  ('service-auto',         'Service auto',                    'Auto repair service',         1),
  ('piese-accesorii-auto', 'Piese și accesorii auto',         'Auto parts & accessories',    2),
  ('inchirieri-auto',      'Închirieri auto',                 'Car rental',                   3),
  ('spalatorii-auto',      'Spălătorii auto',                 'Car wash',                     4)
) as v(slug, name_ro, name_en, ordine)
cross join (select id from public.categories where slug = 'auto-mobilitate') as c
on conflict (slug) do nothing;

-- --------------------------------------------------------------------------
-- Subcategorii — Servicii pentru firme
-- --------------------------------------------------------------------------
insert into public.categories (slug, name_ro, name_en, parent_id, ordine)
select v.slug, v.name_ro, v.name_en, c.id, v.ordine
from (values
  ('curatenie-facility',   'Curățenie și facility management','Cleaning & facility management',1),
  ('paza-securitate',      'Pază și securitate',              'Security services',            2),
  ('secretariat-birou',    'Servicii de secretariat & birou', 'Secretarial & office services', 3),
  ('traduceri',            'Traduceri',                       'Translation services',          4)
) as v(slug, name_ro, name_en, ordine)
cross join (select id from public.categories where slug = 'servicii-firme') as c
on conflict (slug) do nothing;

-- --------------------------------------------------------------------------
-- Subcategorii — Arte, Design & Creație
-- --------------------------------------------------------------------------
insert into public.categories (slug, name_ro, name_en, parent_id, ordine)
select v.slug, v.name_ro, v.name_en, c.id, v.ordine
from (values
  ('design-produs',        'Design de produs',                'Product design',               1),
  ('design-interior',      'Design interior',                 'Interior design',               2),
  ('arta-artizanat',       'Artă și artizanat',               'Art & crafts',                  3),
  ('moda-design-vestimentar','Modă și design vestimentar',    'Fashion design',                4)
) as v(slug, name_ro, name_en, ordine)
cross join (select id from public.categories where slug = 'arte-design') as c
on conflict (slug) do nothing;

-- --------------------------------------------------------------------------
-- Subcategorii — Cultură, Sport & Recreere
-- --------------------------------------------------------------------------
insert into public.categories (slug, name_ro, name_en, parent_id, ordine)
select v.slug, v.name_ro, v.name_en, c.id, v.ordine
from (values
  ('evenimente-sportive',  'Evenimente sportive',             'Sports events',                 1),
  ('cluburi-sali-sport',   'Cluburi și săli de sport',        'Sports clubs & gyms',           2),
  ('activitati-culturale', 'Activități culturale',            'Cultural activities',           3)
) as v(slug, name_ro, name_en, ordine)
cross join (select id from public.categories where slug = 'cultura-sport') as c
on conflict (slug) do nothing;

-- --------------------------------------------------------------------------
-- CAEN — mapare pe categoriile principale (nivel divizie, draft functional)
-- --------------------------------------------------------------------------
insert into public.category_caen_codes (category_id, caen_code, caen_version, descriere)
select c.id, v.code, 'rev2', v.descriere
from (values
  ('constructii', '41', 'Construcții de clădiri'),
  ('constructii', '42', 'Lucrări de geniu civil'),
  ('constructii', '43', 'Lucrări speciale de construcții'),
  ('constructii', '71', 'Activități de arhitectură și inginerie'),
  ('it-software', '62', 'Activități de servicii în tehnologia informației'),
  ('it-software', '63', 'Activități de servicii informaționale'),
  ('marketing-publicitate', '73', 'Publicitate și cercetare de piață'),
  ('marketing-publicitate', '74', 'Alte activități profesionale, științifice și tehnice'),
  ('marketing-publicitate', '59', 'Activități de producție cinematografică și video'),
  ('consultanta-financiar', '70', 'Activități de consultanță în management'),
  ('consultanta-financiar', '69', 'Activități juridice și de contabilitate'),
  ('consultanta-financiar', '78', 'Activități de recrutare și plasare a forței de muncă'),
  ('consultanta-financiar', '65', 'Activități de asigurări, reasigurări și fonduri de pensii'),
  ('consultanta-financiar', '66', 'Activități auxiliare pentru intermedieri financiare și asigurări'),
  ('transport-logistica', '49', 'Transporturi terestre'),
  ('transport-logistica', '52', 'Depozitare și activități auxiliare pentru transport'),
  ('transport-logistica', '53', 'Activități de poștă și de curier'),
  ('productie-industrie', '10', 'Industrie alimentară'),
  ('productie-industrie', '13', 'Fabricarea produselor textile'),
  ('productie-industrie', '14', 'Fabricarea articolelor de îmbrăcăminte'),
  ('productie-industrie', '31', 'Fabricarea de mobilă'),
  ('productie-industrie', '24', 'Industria metalurgică'),
  ('productie-industrie', '25', 'Industria construcțiilor metalice'),
  ('productie-industrie', '23', 'Fabricarea altor produse din minerale nemetalice'),
  ('horeca-evenimente', '55', 'Hoteluri și alte facilități de cazare'),
  ('horeca-evenimente', '56', 'Restaurante și alte activități de servicii de alimentație'),
  ('horeca-evenimente', '82', 'Activități de secretariat, servicii suport și organizare evenimente'),
  ('comert', '46', 'Comerț cu ridicata'),
  ('comert', '47', 'Comerț cu amănuntul'),
  ('sanatate-wellness', '86', 'Activități referitoare la sănătatea umană'),
  ('sanatate-wellness', '96', 'Alte activități de servicii (îngrijire personală)'),
  ('sanatate-wellness', '93', 'Activități sportive, recreative și distractive'),
  ('educatie-training', '85', 'Învățământ'),
  ('imobiliare', '68', 'Tranzacții imobiliare'),
  ('agricultura', '01', 'Agricultură, vânătoare și servicii anexe'),
  ('agricultura', '03', 'Pescuit și acvacultură'),
  ('agricultura', '10', 'Industrie alimentară'),
  ('energie-utilitati', '35', 'Producția și furnizarea de energie electrică și termică'),
  ('energie-utilitati', '38', 'Colectarea, tratarea și eliminarea deșeurilor'),
  ('auto-mobilitate', '45', 'Comerț, întreținere și reparare autovehicule și motociclete'),
  ('auto-mobilitate', '77', 'Activități de închiriere și leasing'),
  ('servicii-firme', '81', 'Activități de peisagistică și servicii pentru clădiri'),
  ('servicii-firme', '80', 'Activități de investigații și protecție (pază)'),
  ('servicii-firme', '82', 'Activități de secretariat și servicii suport'),
  ('arte-design', '74', 'Activități profesionale, științifice și tehnice (design specializat)'),
  ('arte-design', '90', 'Activități de creație și interpretare artistică'),
  ('telecomunicatii', '61', 'Telecomunicații'),
  ('cultura-sport', '93', 'Activități sportive, recreative și distractive'),
  ('cultura-sport', '90', 'Activități de creație și interpretare artistică'),
  ('cultura-sport', '91', 'Activități ale bibliotecilor, arhivelor, muzeelor'),
  ('productie-media', '59', 'Activități de producție cinematografică, video, TV'),
  ('productie-media', '60', 'Activități de difuzare a programelor de radio și televiziune'),
  ('productie-media', '58', 'Activități de editare'),
  ('alte-servicii', '96', 'Alte activități de servicii n.c.a.')
) as v(slug, code, descriere)
join public.categories c on c.slug = v.slug
on conflict (category_id, caen_code, caen_version) do nothing;
