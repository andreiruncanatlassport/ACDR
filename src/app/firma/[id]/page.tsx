import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Globe, Phone, Mail, MapPin, Users, TrendingUp, Building2, Star, Eye, Images, Zap, Navigation, UserRound, HelpCircle, HandHeart, Layers, Lock } from "lucide-react";
import { FacebookIcon, InstagramIcon, LinkedinIcon } from "@/components/ui/SocialIcons";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { Card, Badge, SectionLabel } from "@/components/ui/Card";
import { VerifiedStamp } from "@/components/ui/VerifiedStamp";
import { ConnectButton } from "@/components/ConnectButton";
import { FavoriteButton } from "@/components/FavoriteButton";
import { StartConversationButton } from "@/components/StartConversationButton";
import { ReviewSection, type MotivBlocare } from "@/components/ReviewSection";
import { etichetaProiectMarime } from "@/lib/company-attrs";
import type { Company, Profile, CompanyContact, CompanyProject } from "@/types/database";

const TIMP_RASPUNS_LABEL: Record<string, string> = {
  sub_1h: "răspunde în <1h",
  sub_24h: "răspunde în <24h",
  "2_3_zile": "răspunde în 2-3 zile",
  peste_3_zile: "răspunde în peste 3 zile",
};

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: param } = await params;
  const supabase = await createClient();

  // Acceptam si slug ("instalatii-popescu"), si UUID (pentru link-urile vechi,
  // deja distribuite, care trebuie sa functioneze in continuare).
  const esteUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(param);

  const { data: companyData } = await supabase
    .from("companies")
    .select("*")
    .eq(esteUuid ? "id" : "slug", param)
    .maybeSingle();

  if (!companyData) notFound();
  const company = companyData as Company;
  const id = company.id;

  // vizualizare (best-effort, nu blocheaza randarea daca esueaza)
  createServiceRoleClient()
    .rpc("increment_company_view", { target_company_id: id } as never)
    .then(() => {});

  const [
    { data: judetData },
    { data: categoriiData },
    { data: categoriiCautateData },
    { data: nevoiData },
    { data: oferteData },
    { data: financiarData },
    { data: contacteData },
    { data: proiecteData },
    { data: recenziiData },
    { data: judeteSuplimentareData },
  ] = await Promise.all([
    company.judet_cod
      ? supabase.from("judete").select("nume").eq("cod", company.judet_cod).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("company_categories")
      .select("is_primary, categories(id, name_ro, slug)")
      .eq("company_id", id),
    supabase
      .from("company_categorii_cautate")
      .select("categories(id, name_ro, slug)")
      .eq("company_id", id),
    supabase.from("company_support_needs").select("nota, categories(name_ro)").eq("company_id", id),
    supabase.from("company_support_offers").select("nota, categories(name_ro)").eq("company_id", id),
    supabase
      .from("financial_snapshots")
      .select("an, cifra_afaceri, numar_salariati")
      .eq("company_id", id)
      .order("an", { ascending: false })
      .limit(1),
    supabase.from("company_contacts").select("*").eq("company_id", id).order("ordine"),
    supabase.from("company_projects").select("*").eq("company_id", id).order("created_at", { ascending: false }).limit(6),
    supabase
      .from("reviews")
      .select("id, rating, comentariu, created_at, reviewer:reviewer_company_id(id, denumire)")
      .eq("reviewed_company_id", id)
      .eq("status", "approved")
      .order("created_at", { ascending: false }),
    supabase.from("company_judete").select("judete(nume)").eq("company_id", id),
  ]);

  const judetNume = (judetData as { nume: string } | null)?.nume ?? null;
  const categorii =
    (categoriiData as unknown as { is_primary: boolean; categories: { id: string; name_ro: string; slug: string } | null }[]) ??
    [];
  const categoriiCautate =
    (categoriiCautateData as unknown as { categories: { id: string; name_ro: string; slug: string } | null }[]) ?? [];
  const nevoi = (nevoiData as unknown as { nota: string | null; categories: { name_ro: string } | null }[]) ?? [];
  const oferte = (oferteData as unknown as { nota: string | null; categories: { name_ro: string } | null }[]) ?? [];
  const financiar = (financiarData as { an: number; cifra_afaceri: number | null; numar_salariati: number | null }[] | null)?.[0];
  const contacte = (contacteData as CompanyContact[]) ?? [];
  const proiecte = (proiecteData as CompanyProject[]) ?? [];
  const judeteSuplimentare =
    (judeteSuplimentareData as unknown as { judete: { nume: string } | null }[] | null)
      ?.map((j) => j.judete?.nume)
      .filter((n): n is string => Boolean(n)) ?? [];
  const recenzii =
    (recenziiData as unknown as { id: string; rating: number; comentariu: string | null; created_at: string; reviewer: { id: string; denumire: string } | null }[]) ?? [];

  // ---- reprezentant (date personale) — RLS decide daca randul e vizibil -----
  const { data: profileData } = await supabase
    .from("profiles")
    .select("nume_complet, telefon_personal, email_personal")
    .eq("id", company.owner_id)
    .maybeSingle();
  const profil = profileData as Pick<Profile, "nume_complet" | "telefon_personal" | "email_personal"> | null;

  // ---- stare conexiune / eligibilitate recenzie pentru vizitatorul curent ----
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let connectionId: string | null = null;
  let stareConexiune: "none" | "pending_sent" | "pending_received" | "accepted" | "declined" = "none";
  let firmaVizitatorId: string | null = null;
  let motivRecenzie: MotivBlocare = "neautentificat";
  let vizitatorulEVerificat = false;

  if (user) {
    const { data: profilVizitator } = await supabase
      .from("profiles")
      .select("stare_verificare")
      .eq("id", user.id)
      .maybeSingle();
    vizitatorulEVerificat =
      (profilVizitator as { stare_verificare: string } | null)?.stare_verificare === "verificat";

    // Luam toate firmele userului, ca sa distingem intre "n-are firma" si
    // "are firma dar nu e verificata inca" — mesaje diferite pentru utilizator.
    const { data: firmeleMele } = await supabase
      .from("companies")
      .select("id, status")
      .eq("owner_id", user.id);

    const firme = (firmeleMele as { id: string; status: string }[] | null) ?? [];
    const firmaAprobata = firme.find((f) => f.status === "approved");
    firmaVizitatorId = firmaAprobata?.id ?? null;

    if (firme.length === 0) {
      motivRecenzie = "fara_firma";
    } else if (!firmaAprobata) {
      motivRecenzie = "firma_neverificata";
    } else if (firme.some((f) => f.id === id)) {
      motivRecenzie = "propria_firma";
    } else {
      motivRecenzie = "poate";
    }

    if (firmaVizitatorId && firmaVizitatorId !== id) {
      const { data: conn } = await supabase
        .from("connections")
        .select("id, status, requester_company_id")
        .or(
          `and(requester_company_id.eq.${firmaVizitatorId},target_company_id.eq.${id}),and(requester_company_id.eq.${id},target_company_id.eq.${firmaVizitatorId})`
        )
        .maybeSingle();

      if (conn) {
        const c = conn as { id: string; status: string; requester_company_id: string };
        connectionId = c.id;
        if (c.status === "accepted") stareConexiune = "accepted";
        else if (c.status === "declined") stareConexiune = "declined";
        else stareConexiune = c.requester_company_id === firmaVizitatorId ? "pending_sent" : "pending_received";
      }

      const { data: recenzieExistenta } = await supabase
        .from("reviews")
        .select("id")
        .eq("reviewer_company_id", firmaVizitatorId)
        .eq("reviewed_company_id", id)
        .maybeSingle();

      if (recenzieExistenta) motivRecenzie = "deja_recenzat";
    }
  }

  const domeniuPrincipal = categorii.find((c) => c.is_primary)?.categories?.name_ro;
  const domeniiSecundare = categorii.filter((c) => !c.is_primary && c.categories);

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      {company.status !== "approved" && (
        <div className="mb-6 rounded-lg bg-seal/10 px-4 py-2.5 text-sm text-seal">
          Acest profil nu e încă public — îl vezi pentru că ești proprietarul sau un administrator.
        </div>
      )}

      {/* Banner + avatar — antetul de profil, cu adancime si accent */}
      <div className="block-raised relative overflow-hidden p-0">
        <div className="relative h-40 w-full overflow-hidden sm:h-56">
          {company.banner_url ? (
            <Image src={company.banner_url} alt="" fill className="object-cover" unoptimized />
          ) : (
            <div className="mesh-hero h-full w-full">
              <div aria-hidden className="absolute inset-0 grid-registry" />
            </div>
          )}
          {/* gradient jos, ca avatarul si textul sa aiba contrast garantat */}
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 to-transparent" />
        </div>

        <div className="relative px-6 pb-6">
          <div className="-mt-12 flex items-end justify-between gap-4">
            <div className="relative h-24 w-24 overflow-hidden rounded-2xl border-4 border-surface bg-surface shadow-[var(--shadow-lg)]">
              {company.logo_url ? (
                <Image src={company.logo_url} alt={company.denumire} fill className="object-cover" unoptimized />
              ) : (
                <div className="flex h-full items-center justify-center bg-ink/4 text-ink-soft/40">
                  <Building2 className="h-9 w-9" strokeWidth={1.5} />
                </div>
              )}
            </div>
            <div className="mb-1 flex shrink-0 items-center gap-2">
              <FavoriteButton companyId={company.id} />
            </div>
          </div>

          <div className="mt-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              {domeniuPrincipal && <p className="stamp-label text-seal">{domeniuPrincipal}</p>}
              <h1 className="mt-1.5 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                {company.denumire}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-soft">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-ink-soft/60" />
                  {[company.localitate, judetNume].filter(Boolean).join(", ") || "—"}
                </span>
                {company.rating_numar > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-seal text-seal" />
                    <span className="font-mono-num font-semibold text-ink">
                      {company.rating_mediu.toFixed(1)}
                    </span>
                    <span className="text-ink-soft/70">({company.rating_numar} recenzii)</span>
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-ink-soft/70">
                  <Eye className="h-4 w-4" />
                  <span className="font-mono-num">{company.vizualizari}</span>
                </span>
              </div>
            </div>

            <VerifiedStamp size="md" className="hidden shrink-0 sm:block" />
          </div>
        </div>
      </div>

      {company.discount_procent ? (
        <div className="mt-6 overflow-hidden rounded-2xl gradient-seal p-[1.5px] shadow-[var(--shadow-md)]">
          <div className="rounded-[calc(1.25rem-1px)] bg-surface p-5">
            <div className="flex flex-wrap items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl gradient-seal text-primary-content shadow-[var(--shadow-sm)]">
                <span className="font-mono-num text-lg font-bold">-{company.discount_procent}%</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="stamp-label text-seal">Reducere pentru membrii ACDR</p>
                <p className="mt-1.5 font-semibold text-ink">
                  {company.discount_descriere || `${company.discount_procent}% reducere pentru firmele din ACDR`}
                </p>
                {company.discount_conditii && (
                  <p className="mt-1 text-sm text-ink-soft">{company.discount_conditii}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {company.descriere && (
        <p className="mt-8 max-w-2xl text-base leading-relaxed text-ink-soft">{company.descriere}</p>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {domeniiSecundare.map((c) => (
          <Badge key={c.categories!.id}>{c.categories!.name_ro}</Badge>
        ))}
        {company.domenii_altele && <Badge tone="neutral">{company.domenii_altele}</Badge>}
        {company.dimensiune_echipa && (
          <Badge tone="neutral">
            <Users className="mr-1 h-3 w-3 inline" /> {company.dimensiune_echipa} angajați
          </Badge>
        )}
        {financiar?.cifra_afaceri != null && (
          <Badge tone="success">
            <TrendingUp className="mr-1 h-3 w-3 inline" />
            {financiar.cifra_afaceri.toLocaleString("ro-RO")} lei ({financiar.an})
          </Badge>
        )}
        {company.timp_raspuns && (
          <Badge tone="success">
            <Zap className="mr-1 h-3 w-3 inline" /> {TIMP_RASPUNS_LABEL[company.timp_raspuns]}
          </Badge>
        )}
        {company.proiect_marime && (
          <Badge tone="violet">
            <Layers className="mr-1 h-3 w-3 inline" /> Proiecte {etichetaProiectMarime(company.proiect_marime)}
          </Badge>
        )}
        {company.data_inregistrare && (
          <Badge tone="neutral">Activă din {new Date(company.data_inregistrare).getFullYear()}</Badge>
        )}
      </div>

      {(categoriiCautate.length > 0 || company.domenii_cautate_altele) && (
        <div className="mt-4">
          <p className="stamp-label text-teal">Caută</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {categoriiCautate.map((c) => (
              <Badge key={c.categories!.id} tone="neutral" className="border border-teal/30 text-teal">
                {c.categories!.name_ro}
              </Badge>
            ))}
            {company.domenii_cautate_altele && (
              <Badge tone="neutral" className="border border-teal/30 text-teal">
                {company.domenii_cautate_altele}
              </Badge>
            )}
          </div>
        </div>
      )}

      {company.tags && company.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {company.tags.map((t) => (
            <span key={t} className="rounded-full bg-ink/6 px-2.5 py-1 text-xs text-ink-soft">
              {t}
            </span>
          ))}
        </div>
      )}

      {(company.facebook_url || company.instagram_url || company.linkedin_url) && (
        <div className="mt-4 flex gap-3">
          {company.facebook_url && (
            <a href={company.facebook_url} target="_blank" rel="noopener noreferrer" className="text-ink-soft/70 hover:text-seal">
              <FacebookIcon className="h-5 w-5" />
            </a>
          )}
          {company.instagram_url && (
            <a href={company.instagram_url} target="_blank" rel="noopener noreferrer" className="text-ink-soft/70 hover:text-seal">
              <InstagramIcon className="h-5 w-5" />
            </a>
          )}
          {company.linkedin_url && (
            <a href={company.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-ink-soft/70 hover:text-seal">
              <LinkedinIcon className="h-5 w-5" />
            </a>
          )}
        </div>
      )}

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <Card>
          <SectionLabel icon={<Phone className="h-3.5 w-3.5" />}>Contact firmă</SectionLabel>
          <div className="mt-3 space-y-2 text-sm">
            {(company.telefon_firma || company.email_firma) && (
              vizitatorulEVerificat ? (
                <>
                  {company.telefon_firma && (
                    <p className="flex items-center gap-2 text-ink"><Phone className="h-4 w-4 text-ink-soft/70" /> {company.telefon_firma}</p>
                  )}
                  {company.email_firma && (
                    <p className="flex items-center gap-2 text-ink"><Mail className="h-4 w-4 text-ink-soft/70" /> {company.email_firma}</p>
                  )}
                </>
              ) : (
                <div className="flex items-start gap-2 rounded-xl bg-ink/4 p-3 text-xs text-ink-soft">
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    {user
                      ? "Datele de contact devin vizibile după ce contul tău e verificat de un administrator."
                      : (
                        <>
                          <Link href="/login" className="font-semibold text-seal hover:underline">Autentifică-te</Link>
                          {" "}ca membru verificat pentru a vedea telefonul și emailul firmei.
                        </>
                      )}
                  </span>
                </div>
              )
            )}
            {company.website && (
              <p className="flex items-center gap-2 text-ink">
                <Globe className="h-4 w-4 text-ink-soft/70" />
                <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-seal hover:underline">
                  {company.website}
                </a>
              </p>
            )}
            <p className="flex items-center gap-2 text-ink-soft">
              <Building2 className="h-4 w-4 text-ink-soft/70" /> CUI <span className="font-mono-num">{company.cui}</span>
            </p>
          </div>
        </Card>

        <Card>
          <SectionLabel icon={<UserRound className="h-3.5 w-3.5" />}>Reprezentant</SectionLabel>
          {profil ? (
            <div className="mt-3 space-y-1 text-sm text-ink">
              <p className="font-medium text-ink">{profil.nume_complet}</p>
              {profil.telefon_personal && <p>{profil.telefon_personal}</p>}
              {profil.email_personal && <p>{profil.email_personal}</p>}
            </div>
          ) : (
            <p className="mt-3 text-sm text-ink-soft">Vizibil doar pentru firmele conectate.</p>
          )}
          <div className="mt-4 space-y-2.5">
            <ConnectButton
              targetCompanyId={company.id}
              connectionId={connectionId}
              stareInitiala={stareConexiune}
              autentificat={Boolean(user)}
            />
            {user?.id !== company.owner_id && (
              <StartConversationButton
                profileId={company.owner_id}
                numeDestinatar={profil?.nume_complet ?? company.denumire}
                autentificat={Boolean(user)}
                size="sm"
              />
            )}
          </div>
        </Card>
      </div>

      {(company.zona_deservita || company.raza_deservire_km || judeteSuplimentare.length > 0) && (
        <Card className="mt-6">
          <SectionLabel icon={<Navigation className="h-3.5 w-3.5" />}>Zonă deservită</SectionLabel>
          <div className="mt-2 space-y-1 text-sm text-ink-soft">
            {company.zona_deservita && <p>{company.zona_deservita}</p>}
            {company.raza_deservire_km && (
              <p>Rază de {company.raza_deservire_km} km în jurul sediului{judetNume ? ` (${judetNume})` : ""}.</p>
            )}
            {judeteSuplimentare.length > 0 && (
              <p>Deservește explicit și: {judeteSuplimentare.join(", ")}.</p>
            )}
          </div>
        </Card>
      )}

      {contacte.length > 0 && (
        <Card className="mt-6">
          <SectionLabel icon={<Users className="h-3.5 w-3.5" />}>Persoane de contact</SectionLabel>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {contacte.map((c) => (
              <div key={c.id} className="text-sm">
                <p className="font-medium text-ink">{c.nume}</p>
                <p className="text-ink-soft">{[c.rol, c.departament].filter(Boolean).join(" · ")}</p>
                <p className="text-ink-soft">{[c.telefon, c.email].filter(Boolean).join(" · ")}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {(nevoi.length > 0 || oferte.length > 0) && (
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {nevoi.length > 0 && (
            <Card>
              <SectionLabel icon={<HelpCircle className="h-3.5 w-3.5" />}>Caută ajutor în</SectionLabel>
              <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
                {nevoi.map((n, i) => (
                  <li key={i}>• {n.categories?.name_ro ?? ""} {n.nota && `— ${n.nota}`}</li>
                ))}
              </ul>
            </Card>
          )}
          {oferte.length > 0 && (
            <Card>
              <SectionLabel icon={<HandHeart className="h-3.5 w-3.5" />}>Poate ajuta cu</SectionLabel>
              <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
                {oferte.map((o, i) => (
                  <li key={i}>• {o.categories?.name_ro ?? ""} {o.nota && `— ${o.nota}`}</li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      {proiecte.length > 0 && (
        <div className="mt-8">
          <SectionLabel icon={<Images className="h-3.5 w-3.5" />}>Portofoliu</SectionLabel>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            {proiecte.map((p) => (
              <Link
                key={p.id}
                href={`/firma/${id}/portofoliu/${p.id}`}
                className="lift-on-hover overflow-hidden rounded-xl border border-line bg-surface"
              >
                <div className="relative h-28 w-full bg-ink/5">
                  {p.cover_url && <Image src={p.cover_url} alt={p.titlu} fill className="object-cover" unoptimized />}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-ink">{p.titlu}</p>
                  {p.locatie && <p className="text-xs text-ink-soft">{p.locatie}{p.an ? ` · ${p.an}` : ""}</p>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <SectionLabel icon={<Star className="h-3.5 w-3.5" />}>
          Recenzii {company.rating_numar > 0 && `(${company.rating_numar})`}
        </SectionLabel>

        <div className="mt-4">
          <ReviewSection
            reviewedCompanyId={id}
            reviewerCompanyId={firmaVizitatorId}
            recenzii={recenzii}
            ratingMediu={company.rating_mediu}
            ratingNumar={company.rating_numar}
            motiv={motivRecenzie}
          />
        </div>
      </div>
    </div>
  );
}
