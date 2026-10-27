import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { LinkButton } from "@/components/ui/Button";
import { NewsCard, type NewsCardData } from "@/components/NewsCard";
import { EventCard, type EventCardData } from "@/components/EventCard";
import { CompanyCard } from "@/components/CompanyCard";
import { OpportunityCard, type OpportunityCardData } from "@/components/OpportunityCard";
import { MobileSlideCarousel } from "@/components/MobileSlideCarousel";
import { alegeFirmeRotativ } from "@/lib/rotate";
import { aziRomania, formatIso, primaZiLucratoare } from "@/lib/calendar-fiscal";

// Cate firme aratam in preview-ul de pe homepage — tinut mic intentionat
// (2-3), ca homepage-ul sa ramana un ecran de intrare compact, nu un al
// doilea catalog. Lista completa e la un click distanta (butonul de mai jos).
const NR_FIRME_PREVIEW = 3;
const NR_OPORTUNITATI_PREVIEW = 3;

/**
 * Urmatorul termen „de 25” (D112, D300 lunar), mutat pe prima zi lucratoare.
 * Il calculam aici, fara baza de date: obligatiile fiscale sunt vizibile doar
 * utilizatorilor autentificati, iar homepage-ul trebuie sa arate ceva real si
 * vizitatorilor.
 */
function urmatorulTermenDe25(azi: string): string {
  const [an, luna] = azi.split("-").map(Number);
  const luna25 = primaZiLucratoare(formatIso(an, luna, 25));
  if (luna25 >= azi) return luna25;
  return luna === 12 ? primaZiLucratoare(formatIso(an + 1, 1, 25)) : primaZiLucratoare(formatIso(an, luna + 1, 25));
}

export default async function HomePage() {
  const supabase = await createClient();
  const { t, locale } = await getT();
  const dateLocale = locale === "en" ? "en-US" : "ro-RO";
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const eventLabels = {
    conferinta: t.events.typeConference,
    workshop: t.events.typeWorkshop,
    networking: t.events.typeNetworking,
    altul: t.events.typeOther,
    online: t.events.online,
    full: t.events.full,
    seatsSuffix: t.events.seatsLeft,
    cancelled: t.events.cancelled,
  };
  const opportunityLabels = {
    proiect: t.opportunities.typeProject,
    achizitie: t.opportunities.typePurchase,
    colaborare: t.opportunities.typeCollaboration,
    cerere_servicii: t.opportunities.typeServiceRequest,
    closed: t.opportunities.closed,
    responseSingular: t.opportunities.responseSingular,
    responses: t.opportunities.responses,
    companyFallback: t.opportunities.companyFallback,
    until: t.opportunities.until,
  };

  const [
    { count: firmeCount },
    { count: domeniiCount },
    { data: judeteData },
    { data: judeteFirmeData },
    { data: stiriData },
    { data: evenimenteData },
    { data: firmeData, error: firmeError },
    { data: oportunitatiData, error: oportunitatiError },
  ] = await Promise.all([
    supabase.from("companies").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("categories").select("id", { count: "exact", head: true }),
    supabase.from("judete").select("cod, nume"),
    // Doar coloana judet_cod a firmelor aprobate: numaram judetele in care
    // exista cel putin o firma (cifra cinstita, nu totalul de 42 de judete).
    supabase.from("companies").select("judet_cod").eq("status", "approved"),
    supabase
      .from("news_articles")
      .select("slug, titlu, rezumat, imagine_url, published_at")
      .eq("status", "publicat")
      .order("published_at", { ascending: false })
      .limit(3),
    supabase
      .from("events")
      .select("slug, titlu, imagine_url, tip, locatie, online, data_inceput, status")
      .eq("status", "publicat")
      .gte("data_inceput", new Date().toISOString())
      .order("data_inceput", { ascending: true })
      .limit(3),
    // Pentru preview-ul rotativ de pe homepage: luam un lot recent de firme
    // aprobate si alegem aleatoriu cateva dintre ele in cod (varietate la
    // fiecare incarcare, fara sa scanam tot tabelul).
    //
    // IMPORTANT: NU folosim aici embed-ul PostgREST "judete(nume)" direct pe
    // companies. Tabelul companies are DOUA cai catre judete — cheia directa
    // judet_cod SI tabelul de legatura company_judete (judete suplimentare) —
    // iar Supabase/PostgREST nu poate alege automat intre ele, arunca eroare
    // de relatie ambigua. Rezolvam numele judetului manual, in JS, mai jos,
    // exact cum face deja pagina de catalog (vezi src/app/catalog/page.tsx).
    supabase
      .from("companies")
      .select("id, slug, denumire, logo_url, localitate, descriere, judet_cod, dimensiune_echipa")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("opportunities")
      .select(
        "id, titlu, tip, imagine_url, buget_min, buget_max, termen_limita, status, created_at, judete(nume), companies(denumire, slug, logo_url)"
      )
      .eq("status", "deschisa")
      .order("created_at", { ascending: false })
      .limit(NR_OPORTUNITATI_PREVIEW),
  ]);

  // Logam orice eroare server-side (vizibila in log-urile din Railway) — ca sa
  // nu mai avem niciodata o sectiune care "dispare" fara nicio urma in log-uri.
  if (firmeError) console.error("Homepage: eroare la incarcarea firmelor:", firmeError);
  if (oportunitatiError) console.error("Homepage: eroare la incarcarea oportunitatilor:", oportunitatiError);

  const judeteMap = new Map(((judeteData as { cod: string; nume: string }[]) ?? []).map((j) => [j.cod, j.nume]));
  const judeteCuFirme = new Set(
    ((judeteFirmeData as { judet_cod: string | null }[]) ?? []).map((r) => r.judet_cod).filter(Boolean)
  ).size;

  const stiri = (stiriData as NewsCardData[]) ?? [];
  const evenimente = (evenimenteData as EventCardData[]) ?? [];

  // amestecam si taiem la cateva — rotatie la fiecare randare
  type FirmaRand = {
    id: string;
    slug: string | null;
    denumire: string;
    logo_url: string | null;
    localitate: string | null;
    descriere: string | null;
    judet_cod: string | null;
    dimensiune_echipa: string | null;
  };
  const firmeToate = (firmeData as unknown as FirmaRand[]) ?? [];
  const firmePreview = alegeFirmeRotativ(firmeToate, NR_FIRME_PREVIEW).map((c) => ({
    id: c.id,
    slug: c.slug,
    denumire: c.denumire,
    logo_url: c.logo_url,
    localitate: c.localitate,
    descriere: c.descriere,
    dimensiune_echipa: c.dimensiune_echipa,
    judet_nume: c.judet_cod ? judeteMap.get(c.judet_cod) ?? null : null,
    domeniu_principal: null,
  }));
  // Firma din exemplul „01”: cea mai recenta firma aprobata (date reale).
  const firmaExemplu = firmeToate[0] ?? null;

  type OportunitateRand = Omit<
    OpportunityCardData,
    "company_denumire" | "company_slug" | "company_logo_url" | "judet_nume" | "raspunsuri"
  > & {
    judete: { nume: string } | null;
    companies: { denumire: string; slug: string | null; logo_url: string | null } | null;
  };
  const oportunitatiToate = (oportunitatiData as unknown as OportunitateRand[]) ?? [];
  const oportunitatiPreview: OpportunityCardData[] = oportunitatiToate.map((r) => ({
    id: r.id,
    titlu: r.titlu,
    tip: r.tip,
    imagine_url: r.imagine_url,
    judet_nume: r.judete?.nume ?? null,
    buget_min: r.buget_min,
    buget_max: r.buget_max,
    termen_limita: r.termen_limita,
    status: r.status,
    created_at: r.created_at,
    company_denumire: r.companies?.denumire ?? null,
    company_slug: r.companies?.slug ?? null,
    company_logo_url: r.companies?.logo_url ?? null,
  }));

  // Termenul fiscal din exemplul „03”, impartit in zi + luna scurta.
  const termen = urmatorulTermenDe25(aziRomania());
  const termenData = new Date(`${termen}T12:00:00Z`);
  const termenZi = termenData.getUTCDate();
  const termenLuna = termenData
    .toLocaleDateString(dateLocale, { month: "short", timeZone: "UTC" })
    .replace(".", "");

  const cifre = [
    { valoare: firmeCount ?? 0, eticheta: t.home.statsCompanies },
    { valoare: domeniiCount ?? 0, eticheta: t.home.statsDomains },
    { valoare: judeteCuFirme, eticheta: t.home.statsCounties },
  ];

  return (
    <>
      {/* ================= HERO =================
          Telefon: fotografia sus, pe toata latimea, apoi textul.
          Desktop: textul in stanga, fotografia in dreapta, cu colturi rotunjite. */}
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-6xl md:grid-cols-[1.05fr_0.95fr] md:items-center md:gap-14 md:px-5 md:py-14 lg:py-20">
          <div className="relative aspect-[390/430] w-full overflow-hidden md:order-2 md:aspect-[4/5] md:rounded-[28px]">
            <Image
              src="/images/oameni/oameni-rugaciune-birou.jpg"
              alt={t.home.heroPhotoAlt}
              fill
              priority
              sizes="(min-width: 768px) 45vw, 100vw"
              className="object-cover object-[60%_30%]"
            />
          </div>

          <div className="px-5 pb-8 pt-7 md:order-1 md:px-0 md:py-0">
            <p className="stamp-label text-seal">{t.home.title}</p>
            <h1 className="mt-3 max-w-xl text-[2.5rem] leading-[1.1] text-ink sm:text-5xl lg:text-[3.75rem]">
              {t.home.heroTitleBefore} <em className="italic text-seal">{t.home.heroTitleAccent}</em>.
            </h1>
            <p className="mt-4 max-w-lg text-[1.0625rem] leading-relaxed text-ink-soft">{t.home.heroSubtitle}</p>

            <div className="mt-6 grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap">
              {user ? (
                <LinkButton href="/cercuri" variant="primary" size="lg" className="min-h-[52px]">
                  {t.home.concrete2Link}
                </LinkButton>
              ) : (
                <LinkButton href="/inregistrare" variant="primary" size="lg" className="min-h-[52px]">
                  {t.home.heroJoin}
                </LinkButton>
              )}
              <LinkButton href="/catalog" variant="secondary" size="lg" className="min-h-[52px]">
                {t.home.heroBrowse}
              </LinkButton>
            </div>

            {/* Cifre reale din baza de date, fara animatie de numarare */}
            <dl className="mt-8 grid grid-cols-3 border-y border-line py-5 tabular-nums">
              {cifre.map((c, i) => (
                <div key={c.eticheta} className={i > 0 ? "border-l border-line pl-4" : ""}>
                  <dt className="sr-only">{c.eticheta}</dt>
                  <dd className="font-display text-[2.125rem] leading-none text-ink">
                    {c.valoare.toLocaleString(dateLocale)}
                  </dd>
                  <dd aria-hidden="true" className="mt-1.5 text-[0.8125rem] leading-snug text-ink-soft">{c.eticheta}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ================= CE FACI AICI, CONCRET =================
          Trei randuri, fiecare cu o bucata reala din produs, nu cu o iconita. */}
      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-10 md:grid-cols-[0.8fr_1.2fr] md:gap-14 md:py-16">
        <div>
          <h2 className="text-[1.875rem] leading-tight text-ink md:sticky md:top-24 md:text-4xl">{t.home.concreteTitle}</h2>
        </div>

        <ol className="flex flex-col gap-9">
          <li className="flex flex-col gap-3">
            <p className="flex items-baseline gap-3">
              <span className="font-display text-xl italic text-seal">01</span>
              <span className="text-[1.1875rem] font-bold text-ink">{t.home.concrete1Title}</span>
            </p>
            <p className="text-[0.9375rem] leading-relaxed text-ink-soft">{t.home.concrete1Body}</p>
            {firmaExemplu && (
              <Link
                href={`/firma/${firmaExemplu.slug ?? firmaExemplu.id}`}
                className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5 transition-colors hover:border-seal"
              >
                <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-olive-pale text-[0.9375rem] font-extrabold text-seal">
                  {firmaExemplu.logo_url ? (
                    <Image src={firmaExemplu.logo_url} alt="" fill className="object-cover" unoptimized />
                  ) : (
                    firmaExemplu.denumire.slice(0, 2).toUpperCase()
                  )}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[0.9375rem] font-bold text-ink">{firmaExemplu.denumire}</span>
                  <span className="truncate text-[0.8125rem] text-ink-soft">
                    {[firmaExemplu.localitate, firmaExemplu.judet_cod ? judeteMap.get(firmaExemplu.judet_cod) : null]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </span>
                <span className="inline-flex h-[26px] shrink-0 items-center gap-1 rounded-full bg-olive-pale px-2.5 text-xs font-bold text-seal">
                  <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.4} />
                  ANAF
                </span>
              </Link>
            )}
            <Link href="/catalog" className="inline-flex min-h-11 items-center gap-1.5 self-start text-[0.9375rem] font-bold text-seal hover:underline">
              {t.home.concrete1Link}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </li>

          <li className="flex flex-col gap-3">
            <p className="flex items-baseline gap-3">
              <span className="font-display text-xl italic text-seal">02</span>
              <span className="text-[1.1875rem] font-bold text-ink">{t.home.concrete2Title}</span>
            </p>
            <p className="text-[0.9375rem] leading-relaxed text-ink-soft">{t.home.concrete2Body}</p>
            <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-olive-pale text-seal">
                <Users className="h-5 w-5" strokeWidth={2} />
              </span>
              <span className="text-[0.875rem] leading-snug text-ink-soft">{t.home.concrete2Note}</span>
            </div>
            <Link href="/cercuri" className="inline-flex min-h-11 items-center gap-1.5 self-start text-[0.9375rem] font-bold text-seal hover:underline">
              {t.home.concrete2Link}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </li>

          <li className="flex flex-col gap-3">
            <p className="flex items-baseline gap-3">
              <span className="font-display text-xl italic text-seal">03</span>
              <span className="text-[1.1875rem] font-bold text-ink">{t.home.concrete3Title}</span>
            </p>
            <p className="text-[0.9375rem] leading-relaxed text-ink-soft">{t.home.concrete3Body}</p>
            <div className="overflow-hidden rounded-2xl border border-line bg-surface">
              {[
                { cod: "D112", text: t.home.fiscalD112 },
                { cod: "D300", text: t.home.fiscalD300 },
              ].map((r, i) => (
                <div key={r.cod} className={`flex items-center gap-3 px-3.5 py-3 ${i === 0 ? "border-b border-line" : ""}`}>
                  <span className="w-11 shrink-0 text-center tabular-nums">
                    <span className="block font-display text-[1.375rem] leading-6 text-ink">{termenZi}</span>
                    <span className="block text-[0.6875rem] font-bold uppercase text-ink-soft">{termenLuna}</span>
                  </span>
                  <span className="flex flex-col">
                    <span className="text-[0.9375rem] font-bold text-ink">{r.cod}</span>
                    <span className="text-[0.8125rem] text-ink-soft">{r.text}</span>
                  </span>
                </div>
              ))}
            </div>
            <Link
              href={user ? "/dashboard/calendar-fiscal" : "/login"}
              className="inline-flex min-h-11 items-center gap-1.5 self-start text-[0.9375rem] font-bold text-seal hover:underline"
            >
              {t.home.concrete3Link}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </li>
        </ol>
      </section>

      {/* ================= PREVIEW FIRME ================= */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-6xl px-5 py-10 md:py-14">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-[1.875rem] leading-tight text-ink md:text-4xl">{t.home.companiesTitle}</h2>
            <Link href="/catalog" className="hidden shrink-0 text-sm font-bold text-seal hover:underline sm:block">
              {t.home.companiesSeeAll}
            </Link>
          </div>

          {firmePreview.length === 0 ? (
            <p className="mt-5 text-sm text-ink-soft">{t.home.companiesEmpty}</p>
          ) : (
            <>
              <div className="mt-6 hidden gap-4 sm:grid sm:grid-cols-3">
                {firmePreview.map((c) => (
                  <CompanyCard key={c.id} company={c} />
                ))}
              </div>
              <div className="mt-6 sm:hidden">
                <MobileSlideCarousel items={firmePreview.map((c) => <CompanyCard key={c.id} company={c} />)} />
              </div>
            </>
          )}

          <div className="mt-6 sm:hidden">
            <LinkButton href="/catalog" variant="secondary" size="lg" className="w-full min-h-[52px]">
              {t.home.companiesExploreButton}
            </LinkButton>
          </div>
        </div>
      </section>

      {/* ================= FOTOGRAFIE EDITORIALA ================= */}
      <figure className="mx-auto max-w-6xl md:px-5">
        <div className="relative aspect-[390/292] w-full overflow-hidden md:aspect-[21/9] md:rounded-[28px]">
          <Image
            src="/images/oameni/oameni-notite-birou.jpg"
            alt={t.home.photoAlt}
            fill
            sizes="(min-width: 1152px) 1112px, 100vw"
            className="object-cover md:object-[50%_40%]"
          />
        </div>
        <figcaption className="px-5 pt-3.5 font-display text-[1.1875rem] italic leading-relaxed text-seal md:px-0 md:text-2xl">
          {t.home.photoCaption}
        </figcaption>
      </figure>

      {/* ================= OPORTUNITATI ================= */}
      <section className="mt-10 border-t border-line md:mt-14">
        <div className="mx-auto max-w-6xl px-5 py-10 md:py-14">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-[1.875rem] leading-tight text-ink md:text-4xl">{t.home.opportunitiesTitle}</h2>
            <Link href="/oportunitati" className="shrink-0 text-sm font-bold text-seal hover:underline">
              {t.home.opportunitiesSeeAll}
            </Link>
          </div>

          {oportunitatiPreview.length === 0 ? (
            <p className="mt-5 text-sm text-ink-soft">{t.home.opportunitiesEmpty}</p>
          ) : (
            <>
              <div className="mt-6 hidden gap-4 sm:grid sm:grid-cols-3">
                {oportunitatiPreview.map((o) => (
                  <OpportunityCard key={o.id} opportunity={o} labels={opportunityLabels} dateLocale={dateLocale} />
                ))}
              </div>
              <div className="mt-6 sm:hidden">
                <MobileSlideCarousel
                  items={oportunitatiPreview.map((o) => (
                    <OpportunityCard key={o.id} opportunity={o} labels={opportunityLabels} dateLocale={dateLocale} />
                  ))}
                />
              </div>
            </>
          )}
        </div>
      </section>

      {/* ================= VERSET + CERCURI =================
          Banda masline (bg-navy: masline pe tema deschisa, masline adanc pe cea
          intunecata). Pe desktop, fotografia in stanga si textul in dreapta. */}
      <section className="bg-navy text-white">
        <div className="mx-auto grid max-w-6xl md:grid-cols-2 md:items-center md:gap-12 md:px-5 md:py-14">
          <div className="relative aspect-[390/250] w-full overflow-hidden md:aspect-square md:rounded-[28px]">
            <Image
              src="/images/oameni/oameni-biblie-masa.jpg"
              alt={t.home.versePhotoAlt}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col gap-3.5 px-5 pb-9 pt-8 md:px-0 md:py-0">
            <p className="font-display text-[2.125rem] font-medium leading-[1.12] md:text-5xl">{t.home.verse}</p>
            <p className="text-sm font-semibold text-white/75">{t.home.verseRef}</p>
            <p className="max-w-md text-base leading-relaxed text-white/85">{t.home.verseBody}</p>
            <Link
              href="/cercuri"
              className="mt-2 inline-flex min-h-12 items-center justify-center gap-1.5 self-start rounded-[14px] border-[1.5px] border-white px-5 text-[0.9375rem] font-bold text-white transition-colors hover:bg-white hover:text-[#1F3A2E]"
            >
              {t.home.concrete2Link}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ================= EVENIMENTE ================= */}
      <section>
        <div className="mx-auto max-w-6xl px-5 py-10 md:py-14">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-[1.875rem] leading-tight text-ink md:text-4xl">{t.home.eventsTitle}</h2>
            <Link href="/evenimente" className="shrink-0 text-sm font-bold text-seal hover:underline">
              {t.home.eventsSeeAll}
            </Link>
          </div>

          {evenimente.length === 0 ? (
            <p className="mt-5 text-sm text-ink-soft">{t.home.eventsEmpty}</p>
          ) : (
            <>
              <div className="mt-6 hidden gap-4 sm:grid sm:grid-cols-3">
                {evenimente.map((e) => (
                  <EventCard key={e.slug} event={e} labels={eventLabels} dateLocale={dateLocale} />
                ))}
              </div>
              <div className="mt-6 sm:hidden">
                <MobileSlideCarousel
                  items={evenimente.map((e) => (
                    <EventCard key={e.slug} event={e} labels={eventLabels} dateLocale={dateLocale} />
                  ))}
                />
              </div>
            </>
          )}
        </div>
      </section>

      {/* ================= STIRI ================= */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-6xl px-5 py-10 md:py-14">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-[1.875rem] leading-tight text-ink md:text-4xl">{t.home.newsTitle}</h2>
            <Link href="/stiri" className="shrink-0 text-sm font-bold text-seal hover:underline">
              {t.home.newsSeeAll}
            </Link>
          </div>

          {stiri.length === 0 ? (
            <p className="mt-5 text-sm text-ink-soft">{t.home.newsEmpty}</p>
          ) : (
            <>
              <div className="mt-6 hidden gap-4 sm:grid sm:grid-cols-3">
                {stiri.map((s) => (
                  <NewsCard key={s.slug} article={s} readMoreLabel={t.news.readMore} />
                ))}
              </div>
              <div className="mt-6 sm:hidden">
                <MobileSlideCarousel
                  items={stiri.map((s) => (
                    <NewsCard key={s.slug} article={s} readMoreLabel={t.news.readMore} />
                  ))}
                />
              </div>
            </>
          )}
        </div>
      </section>

      {/* ================= VALORI ================= */}
      <section className="border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-10 md:grid-cols-[0.8fr_1.2fr] md:gap-14 md:py-16">
          <h2 className="text-[1.875rem] leading-tight text-ink md:text-4xl">{t.home.valuesTitle}</h2>
          <dl className="border-b border-line">
            {t.home.values.map((v) => (
              <div key={v.name} className="grid grid-cols-[8rem_1fr] items-baseline gap-3 border-t border-line py-3 md:grid-cols-[11rem_1fr]">
                <dt className="font-display text-[1.1875rem] italic text-ink">{v.name}</dt>
                <dd className="text-sm leading-snug text-ink-soft">{v.desc}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ================= CTA FINAL =================
          Singurul bloc auriu din pagina: invitatia pentru omul nou. */}
      {!user && (
        <section className="mx-auto max-w-6xl px-5 pb-12 md:pb-20">
          <div className="flex flex-col gap-3 rounded-[22px] bg-gold px-5 py-7 text-[#121614] md:flex-row md:items-center md:justify-between md:gap-10 md:px-10 md:py-10">
            <div className="flex flex-col gap-3">
              <h2 className="text-[1.875rem] leading-tight md:text-4xl">{t.home.ctaFinalTitle}</h2>
              <p className="max-w-lg text-base leading-relaxed">{t.home.ctaFinalBody}</p>
            </div>
            <Link
              href="/inregistrare"
              className="mt-1.5 inline-flex min-h-[52px] shrink-0 items-center justify-center rounded-[14px] bg-[#121614] px-7 text-base font-bold text-white transition-opacity hover:opacity-90"
            >
              {t.home.ctaFinalButton}
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
