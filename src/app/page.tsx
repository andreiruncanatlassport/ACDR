import Link from "next/link";
import { ArrowRight, Search, ShieldCheck, Users, LockKeyhole, Newspaper, CalendarDays, FileCheck2, Handshake, Building2, Briefcase } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { LinkButton } from "@/components/ui/Button";
import { BrandMark } from "@/components/ui/BrandMark";
import { RecentCompaniesTicker } from "@/components/RecentCompaniesTicker";
import { HomeStats } from "@/components/HomeStats";
import { NewsCard, type NewsCardData } from "@/components/NewsCard";
import { EventCard, type EventCardData } from "@/components/EventCard";
import { CompanyCard } from "@/components/CompanyCard";
import { OpportunityCard, type OpportunityCardData } from "@/components/OpportunityCard";
import { MobileSlideCarousel } from "@/components/MobileSlideCarousel";
import { alegeFirmeRotativ } from "@/lib/rotate";

const STEP_TINTS = ["bg-seal", "bg-teal", "bg-navy"];

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
    { data: stiriData },
    { data: evenimenteData },
    { data: firmeData, error: firmeError },
    { data: oportunitatiData, error: oportunitatiError },
  ] = await Promise.all([
    supabase.from("companies").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("categories").select("id", { count: "exact", head: true }),
    supabase.from("judete").select("cod, nume"),
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
  const judeteCount = judeteMap.size;

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

  const pasi = [
    { n: "01", icon: FileCheck2, title: t.home.step1Title, body: t.home.step1Body },
    { n: "02", icon: Users, title: t.home.step2Title, body: t.home.step2Body },
    { n: "03", icon: Handshake, title: t.home.step3Title, body: t.home.step3Body },
  ];

  const increderi = [
    { icon: ShieldCheck, text: t.home.trust1 },
    { icon: LockKeyhole, text: t.home.trust2 },
    { icon: Users, text: t.home.trust3 },
  ];

  return (
    <>
      {/* ================= HERO ================= */}
      <section className="hero-wash relative overflow-hidden border-b border-line">
        <div aria-hidden className="absolute inset-0 grid-registry opacity-60" />
        <div
          aria-hidden
          className="absolute -right-16 -top-20 hidden h-80 w-80 rounded-full bg-seal/10 blur-3xl sm:block"
          style={{ animation: "float-a 10s ease-in-out infinite" }}
        />
        <div
          aria-hidden
          className="absolute -left-10 bottom-0 hidden h-56 w-56 rounded-full bg-teal/10 blur-3xl sm:block"
          style={{ animation: "float-b 12s ease-in-out infinite" }}
        />
        <style>{`
          @keyframes float-a { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-18px) rotate(6deg); } }
          @keyframes float-b { 0%,100% { transform: translateY(0); } 50% { transform: translateY(14px); } }
        `}</style>

        <div className="relative mx-auto grid max-w-6xl gap-8 px-5 py-8 md:grid-cols-[1.1fr_0.9fr] md:items-center md:gap-14 md:py-16">
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-seal to-ember px-3.5 py-1.5 text-white shadow-[var(--shadow-md)]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
              </span>
              <span className="stamp-label">{t.home.eyebrow}</span>
            </div>

            <h1 className="mt-4 max-w-xl text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              <span className="text-gradient-seal">{t.home.titleAccent}</span>
              <br />
              {t.home.titleRest}
            </h1>

            <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink-soft sm:text-base">
              {t.home.subtitle}
            </p>

            <div className="mt-5 flex flex-wrap gap-2.5">
              {!user && (
                <LinkButton href="/inregistrare" variant="seal" size="lg" className="shadow-lg shadow-seal/25 hover:shadow-xl hover:shadow-seal/30">
                  {t.home.ctaPrimary}
                  <ArrowRight className="h-4 w-4" />
                </LinkButton>
              )}
              <LinkButton href="/catalog" variant="secondary" size="lg">
                <Search className="h-4 w-4" />
                {t.home.ctaSecondary}
              </LinkButton>
            </div>

            <HomeStats firme={firmeCount ?? 0} domenii={domeniiCount ?? 0} judete={judeteCount ?? 0} />
          </div>

          <div className="relative hidden justify-center md:flex md:justify-end">
            <div className="relative flex h-56 w-56 items-center justify-center rounded-[48px] border border-line bg-surface shadow-[var(--shadow-lg)] sm:h-72 sm:w-72">
              <BrandMark className="h-16 w-16 sm:h-20 sm:w-20" />
              <span className="absolute -bottom-3.5 rounded-full gradient-seal px-4 py-1.5 text-xs font-semibold text-primary-content shadow-[var(--shadow-lg)]">
                {t.home.stampLabel}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= PREVIEW FIRME ================= */}
      <section className="relative mx-auto max-w-6xl px-5 py-8 md:py-12">
        <div className="max-w-xl">
          <p className="stamp-label text-seal">{t.home.companiesEyebrow}</p>
          <h2 className="mt-1.5 flex items-center gap-2.5 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            <Building2 className="h-5 w-5 text-seal" strokeWidth={1.8} />
            {t.home.companiesTitle}
          </h2>
        </div>

        {firmePreview.length === 0 ? (
          <p className="mt-5 text-sm text-ink-soft">{t.home.companiesEmpty}</p>
        ) : (
          <>
            <div className="mt-5 hidden gap-4 sm:grid sm:grid-cols-3">
              {firmePreview.map((c) => (
                <CompanyCard key={c.id} company={c} />
              ))}
            </div>
            <div className="mt-5 sm:hidden">
              <MobileSlideCarousel items={firmePreview.map((c) => <CompanyCard key={c.id} company={c} />)} />
            </div>
          </>
        )}

        <div className="mt-6 flex justify-center">
          <LinkButton href="/catalog" variant="secondary" size="lg">
            {t.home.companiesExploreButton}
            <ArrowRight className="h-4 w-4" />
          </LinkButton>
        </div>
      </section>

      {/* ================= RECENT VERIFICATE ================= */}
      <RecentCompaniesTicker />

      {/* ================= OPORTUNITATI ================= */}
      <section className="relative border-t border-line bg-surface/40">
        <div className="mx-auto max-w-6xl px-5 py-8 md:py-12">
          <div className="flex items-end justify-between gap-4">
            <div className="max-w-xl">
              <p className="stamp-label text-seal">{t.home.opportunitiesEyebrow}</p>
              <h2 className="mt-1.5 flex items-center gap-2.5 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                <Briefcase className="h-5 w-5 text-seal" strokeWidth={1.8} />
                {t.home.opportunitiesTitle}
              </h2>
            </div>
            <Link href="/oportunitati" className="shrink-0 text-sm font-semibold text-seal hover:underline">
              {t.home.opportunitiesSeeAll}
            </Link>
          </div>

          {oportunitatiPreview.length === 0 ? (
            <p className="mt-5 text-sm text-ink-soft">{t.home.opportunitiesEmpty}</p>
          ) : (
            <>
              <div className="mt-5 hidden gap-4 sm:grid sm:grid-cols-3">
                {oportunitatiPreview.map((o) => (
                  <OpportunityCard key={o.id} opportunity={o} labels={opportunityLabels} dateLocale={dateLocale} />
                ))}
              </div>
              <div className="mt-5 sm:hidden">
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

      {/* ================= STIRI ================= */}
      <section className="relative border-t border-line bg-surface/60">
        <div className="mx-auto max-w-6xl px-5 py-8 md:py-12">
          <div className="flex items-end justify-between gap-4">
            <div className="max-w-xl">
              <p className="stamp-label text-seal">{t.home.newsEyebrow}</p>
              <h2 className="mt-1.5 flex items-center gap-2.5 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                <Newspaper className="h-5 w-5 text-seal" strokeWidth={1.8} />
                {t.home.newsTitle}
              </h2>
            </div>
            <Link href="/stiri" className="shrink-0 text-sm font-semibold text-seal hover:underline">
              {t.home.newsSeeAll}
            </Link>
          </div>

          {stiri.length === 0 ? (
            <p className="mt-5 text-sm text-ink-soft">{t.home.newsEmpty}</p>
          ) : (
            <>
              <div className="mt-5 hidden gap-4 sm:grid sm:grid-cols-3">
                {stiri.map((s) => (
                  <NewsCard key={s.slug} article={s} readMoreLabel={t.news.readMore} />
                ))}
              </div>
              <div className="mt-5 sm:hidden">
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

      {/* ================= EVENIMENTE ================= */}
      <section className="relative border-t border-line">
        <div className="mx-auto max-w-6xl px-5 py-8 md:py-12">
          <div className="flex items-end justify-between gap-4">
            <div className="max-w-xl">
              <p className="stamp-label text-seal">{t.home.eventsEyebrow}</p>
              <h2 className="mt-1.5 flex items-center gap-2.5 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                <CalendarDays className="h-5 w-5 text-seal" strokeWidth={1.8} />
                {t.home.eventsTitle}
              </h2>
            </div>
            <Link href="/evenimente" className="shrink-0 text-sm font-semibold text-seal hover:underline">
              {t.home.eventsSeeAll}
            </Link>
          </div>

          {evenimente.length === 0 ? (
            <p className="mt-5 text-sm text-ink-soft">{t.home.eventsEmpty}</p>
          ) : (
            <>
              <div className="mt-5 hidden gap-4 sm:grid sm:grid-cols-3">
                {evenimente.map((e) => (
                  <EventCard key={e.slug} event={e} labels={eventLabels} dateLocale={dateLocale} />
                ))}
              </div>
              <div className="mt-5 sm:hidden">
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

      {/* ================= CUM FUNCTIONEAZA ================= */}
      <section id="cum-functioneaza" className="relative mx-auto max-w-6xl px-5 py-12 md:py-16">
        <div className="max-w-xl">
          <p className="stamp-label text-seal">{t.nav.howItWorks}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {t.home.howTitle}
          </h2>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {pasi.map((step, i) => (
            <div
              key={step.n}
              className="lift-on-hover block-base relative overflow-hidden p-5 md:p-6"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div
                aria-hidden
                className={`absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-10 ${STEP_TINTS[i]}`}
              />
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl shadow-[var(--shadow-md)] ${
                    i === 0 ? "gradient-seal text-primary-content" : i === 1 ? "bg-teal text-white" : "bg-gold text-[#121614]"
                  }`}
                >
                  <step.icon className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <span className="font-mono-num text-2xl font-bold text-ink/8">{step.n}</span>
              </div>
              <h3 className="relative mt-4 text-base font-semibold text-ink">{step.title}</h3>
              <p className="relative mt-1.5 text-sm leading-relaxed text-ink-soft">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= INCREDERE ================= */}
      <section className="relative overflow-hidden border-y border-line bg-navy">
        <BrandMark variant="white" className="pointer-events-none absolute -right-16 -bottom-16 h-80 w-80 opacity-[0.06]" />

        <div className="relative mx-auto max-w-6xl px-5 py-14 md:py-20">
          <div className="max-w-xl">
            <p className="stamp-label text-white/75">{t.home.trustEyebrow}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {t.home.trustTitle}
            </h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {increderi.map((item, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-white/4 p-5 backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:border-gold/50 hover:bg-white/6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold shadow-[var(--shadow-md)]">
                  <item.icon className="h-5 w-5 text-[#121614]" strokeWidth={1.8} />
                </div>
                <p className="mt-4 text-sm leading-relaxed text-white/70">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA FINAL ================= */}
      {!user && (
        <section className="hero-wash relative overflow-hidden">
          <div className="relative mx-auto max-w-3xl px-5 py-14 text-center md:py-20">
            <BrandMark className="mx-auto h-12 w-12 drop-shadow-[0_10px_20px_rgba(31,58,46,0.15)]" />
            <h2 className="mt-5 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {t.home.ctaFinalTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-ink-soft sm:text-base">
              {t.home.ctaFinalBody}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <LinkButton href="/inregistrare" variant="seal" size="lg" className="shadow-lg shadow-seal/25 hover:shadow-xl hover:shadow-seal/30">
                {t.home.ctaPrimary}
                <ArrowRight className="h-4 w-4" />
              </LinkButton>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
