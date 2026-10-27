import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { LinkButton } from "@/components/ui/Button";
import { NewsCard, type NewsCardData } from "@/components/NewsCard";
import { EventCard, type EventCardData } from "@/components/EventCard";
import { CompanyCard } from "@/components/CompanyCard";
import { OpportunityCard, type OpportunityCardData } from "@/components/OpportunityCard";
import { MobileSlideCarousel } from "@/components/MobileSlideCarousel";
import { alegeFirmeRotativ } from "@/lib/rotate";

// Cate firme aratam in preview-ul de pe homepage — tinut mic intentionat
// (2-3), ca homepage-ul sa ramana un ecran de intrare compact, nu un al
// doilea catalog. Lista completa e la un click distanta (butonul de mai jos).
const NR_FIRME_PREVIEW = 3;
const NR_OPORTUNITATI_PREVIEW = 3;

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
  // Firma din exemplul de la „Firme verificate”: cea mai recenta firma aprobata (date reale).
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

  const cifre = [
    { valoare: firmeCount ?? 0, eticheta: t.home.statsCompanies },
    { valoare: domeniiCount ?? 0, eticheta: t.home.statsDomains },
    { valoare: judeteCuFirme, eticheta: t.home.statsCounties },
  ];

  // Strat de culoare peste fotografii (masline adanc): pe telefon se intuneca
  // de jos in sus, unde sta textul; pe desktop, de la stanga la dreapta.
  // Culori fixe, nu tokeni de tema: textul de deasupra e alb in ambele teme.
  // Stratul acopera doar zona cu text, ca restul fotografiei sa ramana clar.
  const stratFoto =
    "bg-[linear-gradient(to_top,rgba(19,36,28,0.94)_0%,rgba(19,36,28,0.78)_38%,rgba(19,36,28,0.15)_66%,rgba(19,36,28,0)_100%)] md:bg-[linear-gradient(to_right,rgba(19,36,28,0.92)_0%,rgba(19,36,28,0.72)_34%,rgba(19,36,28,0.08)_62%,rgba(19,36,28,0)_100%)]";
  // Pe telefon fotografia sta sus, clara, si se topeste in culoarea benzii doar la baza.
  const fadeTelefon =
    "bg-[linear-gradient(to_bottom,rgba(19,36,28,0)_0%,rgba(19,36,28,0)_55%,rgba(19,36,28,0.7)_80%,#13241C_100%)]";
  // Varianta in oglinda (text in dreapta pe desktop), pentru banda cu versetul.
  const stratFotoDreapta =
    "bg-[linear-gradient(to_top,rgba(19,36,28,0.94)_0%,rgba(19,36,28,0.78)_38%,rgba(19,36,28,0.15)_66%,rgba(19,36,28,0)_100%)] md:bg-[linear-gradient(to_left,rgba(19,36,28,0.92)_0%,rgba(19,36,28,0.72)_34%,rgba(19,36,28,0.08)_62%,rgba(19,36,28,0)_100%)]";

  const linkSectiune =
    "inline-flex min-h-11 items-center gap-1.5 self-start text-[0.9375rem] font-bold text-seal hover:underline";

  return (
    <>
      {/* ================= HERO =================
          Fotografia e fundalul intregului ecran; textul sta pe stratul de culoare. */}
      <section className="relative isolate overflow-hidden bg-[#13241C] text-white">
        {/* Telefon: fotografia sus, clara, iar textul dedesubt. Desktop: fotografia pe tot fundalul. */}
        <div className="absolute inset-x-0 top-0 -z-20 h-[360px] md:inset-0 md:h-auto">
          <Image
            src="/images/oameni/oameni-grup-discutie.jpg"
            alt={t.home.heroPhotoAlt}
            fill
            priority
            sizes="100vw"
            quality={90}
            className="object-cover object-[64%_22%] md:object-[60%_35%]"
          />
          <div aria-hidden className={`absolute inset-0 md:hidden ${fadeTelefon}`} />
        </div>
        <div aria-hidden className={`absolute inset-0 -z-10 hidden md:block ${stratFoto}`} />

        <div className="mx-auto flex max-w-6xl flex-col justify-end px-5 pb-8 pt-[300px] md:min-h-[640px] md:justify-center md:py-20 lg:min-h-[700px]">
          <div className="max-w-xl">
            <p className="stamp-label text-[#E6C88F]">{t.home.title}</p>
            <h1 className="mt-3 text-[2.5rem] leading-[1.08] text-white sm:text-5xl lg:text-[3.75rem]">
              {t.home.heroTitleBefore} <em className="italic text-[#E6C88F]">{t.home.heroTitleAccent}</em>.
            </h1>
            <p className="mt-4 text-[1.0625rem] leading-relaxed text-white/85">{t.home.heroSubtitle}</p>

            <div className="mt-6 grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap">
              {user ? (
                <LinkButton href="/oportunitati" variant="gold" size="lg" className="min-h-[52px]">
                  {t.home.core2Link}
                </LinkButton>
              ) : (
                <LinkButton href="/inregistrare" variant="gold" size="lg" className="min-h-[52px]">
                  {t.home.heroJoin}
                </LinkButton>
              )}
              <Link
                href="/catalog"
                className="inline-flex min-h-[52px] items-center justify-center rounded-xl border-[1.5px] border-white px-6 text-base font-semibold text-white transition-colors hover:bg-white hover:text-[#13241C]"
              >
                {t.home.heroBrowse}
              </Link>
            </div>

            {/* Cifre reale din baza de date */}
            <dl className="mt-8 grid grid-cols-3 border-t border-white/20 pt-5 tabular-nums">
              {cifre.map((c, i) => (
                <div key={c.eticheta} className={i > 0 ? "border-l border-white/20 pl-4" : ""}>
                  <dt className="sr-only">{c.eticheta}</dt>
                  <dd className="font-display text-[2.125rem] leading-none text-white">
                    {c.valoare.toLocaleString(dateLocale)}
                  </dd>
                  <dd aria-hidden="true" className="mt-1.5 text-[0.8125rem] leading-snug text-white/75">
                    {c.eticheta}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ================= CE GASESTI IN ACDR =================
          Ce face platforma in primul rand: firme, proiecte, oameni.
          Cercurile si calendarul fiscal sunt doar mentionate, la final. */}
      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-12 md:grid-cols-[0.8fr_1.2fr] md:gap-14 md:py-16">
        <h2 className="text-[1.875rem] leading-tight text-ink md:sticky md:top-24 md:self-start md:text-4xl">
          {t.home.coreTitle}
        </h2>

        <div>
          <ol className="flex flex-col divide-y divide-line border-y border-line">
            <li className="flex flex-col gap-2.5 py-6">
              <p className="flex items-baseline gap-3">
                <span className="font-display text-xl italic text-seal">01</span>
                <span className="text-[1.1875rem] font-bold text-ink">{t.home.core1Title}</span>
              </p>
              <p className="text-[0.9375rem] leading-relaxed text-ink-soft">{t.home.core1Body}</p>
              {firmaExemplu && (
                <Link
                  href={`/firma/${firmaExemplu.slug ?? firmaExemplu.id}`}
                  className="mt-1 flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5 transition-colors hover:border-seal"
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
              <Link href="/catalog" className={linkSectiune}>
                {t.home.core1Link}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </li>

            <li className="flex flex-col gap-2.5 py-6">
              <p className="flex items-baseline gap-3">
                <span className="font-display text-xl italic text-seal">02</span>
                <span className="text-[1.1875rem] font-bold text-ink">{t.home.core2Title}</span>
              </p>
              <p className="text-[0.9375rem] leading-relaxed text-ink-soft">{t.home.core2Body}</p>
              <Link href="/oportunitati" className={linkSectiune}>
                {t.home.core2Link}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </li>

            <li className="flex flex-col gap-2.5 py-6">
              <p className="flex items-baseline gap-3">
                <span className="font-display text-xl italic text-seal">03</span>
                <span className="text-[1.1875rem] font-bold text-ink">{t.home.core3Title}</span>
              </p>
              <p className="text-[0.9375rem] leading-relaxed text-ink-soft">{t.home.core3Body}</p>
              <Link href="/membri" className={linkSectiune}>
                {t.home.core3Link}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </li>
          </ol>

          {/* Unelte in plus: doar mentionate, fara accent */}
          <div className="mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-2 text-sm text-ink-soft">
            <span>{t.home.extrasLabel}</span>
            <Link
              href="/cercuri"
              className="inline-flex min-h-11 items-center rounded-full border border-line bg-surface px-4 font-semibold text-ink transition-colors hover:border-seal"
            >
              {t.home.extrasCircles}
            </Link>
            <Link
              href={user ? "/dashboard/calendar-fiscal" : "/login"}
              className="inline-flex min-h-11 items-center rounded-full border border-line bg-surface px-4 font-semibold text-ink transition-colors hover:border-seal"
            >
              {t.home.extrasCalendar}
            </Link>
          </div>
        </div>
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

      {/* ================= OPORTUNITATI ================= */}
      <section className="border-t border-line">
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

      {/* ================= VERSET =================
          Fotografia pe toata latimea, sub un strat de culoare masline. */}
      <section className="relative isolate overflow-hidden bg-[#13241C] text-white">
        <div className="absolute inset-x-0 top-0 -z-20 h-[300px] md:inset-0 md:h-auto">
          <Image
            src="/images/oameni/oameni-biblie-deschisa.jpg"
            alt={t.home.versePhotoAlt}
            fill
            sizes="100vw"
            quality={90}
            className="object-cover object-[28%_62%] md:object-[30%_60%]"
          />
          <div aria-hidden className={`absolute inset-0 md:hidden ${fadeTelefon}`} />
        </div>
        <div aria-hidden className={`absolute inset-0 -z-10 hidden md:block ${stratFotoDreapta}`} />
        <div className="mx-auto flex max-w-6xl flex-col justify-end gap-3.5 px-5 pb-10 pt-[260px] md:min-h-[560px] md:items-end md:justify-center md:py-20 md:text-right">
          <p className="max-w-xl font-display text-[2.375rem] font-medium leading-[1.1] md:text-6xl">{t.home.verse}</p>
          <p className="text-sm font-semibold text-[#E6C88F]">{t.home.verseRef}</p>
          <p className="max-w-md text-base leading-relaxed text-white/85 md:ml-auto">{t.home.verseBody}</p>
          <Link
            href="/membri"
            className="mt-2 inline-flex min-h-12 items-center justify-center gap-1.5 self-start rounded-[14px] md:self-end border-[1.5px] border-white px-5 text-[0.9375rem] font-bold text-white transition-colors hover:bg-white hover:text-[#13241C]"
          >
            {t.home.core3Link}
            <ArrowRight className="h-4 w-4" />
          </Link>
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
          Invitatia pentru omul nou, pe fundal foto, cu butonul auriu. */}
      {!user && (
        <section className="mx-auto max-w-6xl px-5 pb-12 md:pb-20">
          <div className="relative isolate overflow-hidden rounded-[24px] bg-[#13241C] text-white">
            <div className="absolute inset-x-0 top-0 -z-20 h-[340px] md:inset-0 md:h-auto">
              <Image
                src="/images/oameni/oameni-lumina-biserica.jpg"
                alt={t.home.ctaFinalPhotoAlt}
                fill
                sizes="(min-width: 1152px) 1112px, 100vw"
                quality={90}
                className="object-cover object-[66%_55%] md:object-[64%_50%]"
              />
              <div aria-hidden className={`absolute inset-0 md:hidden ${fadeTelefon}`} />
            </div>
            <div aria-hidden className={`absolute inset-0 -z-10 hidden md:block ${stratFoto}`} />
            <div className="flex flex-col justify-end gap-3 p-6 pt-[300px] md:min-h-[480px] md:pt-12 md:max-w-xl md:justify-center md:p-12">
              <h2 className="text-[2rem] leading-tight text-white md:text-5xl">{t.home.ctaFinalTitle}</h2>
              <p className="text-base leading-relaxed text-white/85">{t.home.ctaFinalBody}</p>
              <Link
                href="/inregistrare"
                className="mt-2 inline-flex min-h-[52px] items-center justify-center self-start rounded-[14px] bg-gold px-7 text-base font-bold text-[#121614] transition-[filter] hover:brightness-105"
              >
                {t.home.ctaFinalButton}
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
