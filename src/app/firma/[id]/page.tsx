import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Globe, Phone, Mail, MapPin, ShieldCheck, Zap, Layers, Lock, TrendingUp } from "lucide-react";
import { FacebookIcon, InstagramIcon, LinkedinIcon } from "@/components/ui/SocialIcons";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { BrandMark } from "@/components/ui/BrandMark";
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
    .select("nume_complet, telefon_personal, email_personal, avatar_url")
    .eq("id", company.owner_id)
    .maybeSingle();
  const profil = profileData as Pick<Profile, "nume_complet" | "telefon_personal" | "email_personal" | "avatar_url"> | null;

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

  // Initialele firmei, pentru cand nu exista logo („Registru Bun SRL” -> „RB”).
  const initiale =
    company.denumire
      .replace(/\b(S\.?R\.?L\.?|S\.?A\.?|P\.?F\.?A\.?|I\.?I\.?)\b/gi, "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "—";

  const angajati = financiar?.numar_salariati ?? company.numar_angajati ?? null;
  const cifre = [
    company.data_inregistrare
      ? { valoare: String(new Date(company.data_inregistrare).getFullYear()), eticheta: "înființată" }
      : null,
    angajati != null
      ? { valoare: angajati.toLocaleString("ro-RO"), eticheta: "angajați" }
      : company.dimensiune_echipa
        ? { valoare: company.dimensiune_echipa, eticheta: "angajați" }
        : null,
    company.rating_numar > 0
      ? { valoare: company.rating_mediu.toFixed(1), eticheta: `${company.rating_numar} ${company.rating_numar === 1 ? "recenzie" : "recenzii"}` }
      : { valoare: company.vizualizari.toLocaleString("ro-RO"), eticheta: "vizualizări" },
  ].filter((c): c is { valoare: string; eticheta: string } => c !== null);

  const verificatLa = company.anaf_ultima_verificare
    ? new Date(company.anaf_ultima_verificare).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const datePublice = [
    { eticheta: "CUI", valoare: String(company.cui) },
    company.nr_reg_com ? { eticheta: "Nr. Reg. Com.", valoare: company.nr_reg_com } : null,
    company.cod_caen_principal
      ? {
          eticheta: "CAEN principal",
          valoare: [company.cod_caen_principal, company.den_caen_principal].filter(Boolean).join(" · "),
        }
      : null,
    company.tva_activ != null ? { eticheta: "Plătitor de TVA", valoare: company.tva_activ ? "Da" : "Nu" } : null,
    company.stare_inregistrare ? { eticheta: "Stare", valoare: company.stare_inregistrare } : null,
    { eticheta: "Sursa", valoare: verificatLa ? `ANAF, verificat pe ${verificatLa}` : "ANAF" },
  ].filter((r): r is { eticheta: string; valoare: string } => r !== null);

  const areOferta = domeniiSecundare.length > 0 || Boolean(company.domenii_altele) || oferte.length > 0;
  const areCautari = categoriiCautate.length > 0 || Boolean(company.domenii_cautate_altele) || nevoi.length > 0;
  const titluSectiune = "text-[1.625rem] leading-tight text-ink md:text-3xl";
  const chip =
    "inline-flex min-h-[34px] items-center rounded-full border border-line bg-surface px-3.5 text-sm font-semibold text-ink";

  return (
    <div className="mx-auto max-w-4xl pb-12 md:px-5 md:py-10">
      {company.status !== "approved" && (
        <div className="mx-5 mt-4 rounded-xl bg-gold-pale px-4 py-2.5 text-sm text-gold-ink md:mx-0 md:mt-0 md:mb-6">
          Acest profil nu e încă public — îl vezi pentru că ești proprietarul sau un administrator.
        </div>
      )}

      {/* ================= COPERTA =================
          Fotografia firmei, daca a incarcat una. Altfel o suprafata plina, cu
          semnul ACDR discret — fara fotografii de stoc puse in numele firmei. */}
      <div className="relative h-[220px] w-full overflow-hidden bg-olive-pale md:h-64 md:rounded-[28px]">
        {company.banner_url ? (
          <Image src={company.banner_url} alt="" fill className="object-cover" unoptimized />
        ) : (
          <div aria-hidden className="flex h-full items-center justify-center">
            <BrandMark className="h-20 w-20 opacity-15" />
          </div>
        )}
      </div>

      {/* ================= CARTEA DE VIZITA ================= */}
      <section className="relative mx-4 -mt-9 flex flex-col gap-4 rounded-[22px] border border-line bg-surface p-5 shadow-[var(--shadow-md)] md:mx-8 md:-mt-14 md:p-7">
        <div className="flex items-start gap-3.5">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-primary text-primary-content md:h-16 md:w-16">
            {company.logo_url ? (
              <Image src={company.logo_url} alt={company.denumire} fill className="object-cover" unoptimized />
            ) : (
              <span className="font-display text-2xl font-medium">{initiale}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            {domeniuPrincipal && <p className="stamp-label text-seal">{domeniuPrincipal}</p>}
            <h1 className="mt-1 text-[1.75rem] leading-[1.15] text-ink md:text-4xl">{company.denumire}</h1>
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-soft">
              <MapPin className="h-4 w-4 shrink-0" />
              {[company.localitate, judetNume].filter(Boolean).join(", ") || "—"}
            </p>
          </div>
          <div className="shrink-0">
            <FavoriteButton companyId={company.id} />
          </div>
        </div>

        {company.status === "approved" && (
          <div className="flex items-center gap-2.5 rounded-[14px] bg-olive-pale px-3.5 py-3">
            <ShieldCheck className="h-5 w-5 shrink-0 text-seal" strokeWidth={2.2} />
            <div className="flex flex-col">
              <span className="text-sm font-extrabold text-seal">Verificată la ANAF</span>
              <span className="text-xs text-ink-soft">
                {company.radiata ? "Radiată" : company.stare_inregistrare || "Firmă activă"}
                {verificatLa ? ` · verificat pe ${verificatLa}` : ""}
              </span>
            </div>
          </div>
        )}

        {cifre.length > 0 && (
          <dl className="grid grid-cols-3 gap-2 tabular-nums">
            {cifre.map((c, i) => (
              <div key={c.eticheta} className={i > 0 ? "border-l border-line pl-3" : ""}>
                <dt className="sr-only">{c.eticheta}</dt>
                <dd className="font-display text-2xl leading-7 text-ink">{c.valoare}</dd>
                <dd aria-hidden="true" className="mt-0.5 text-xs text-ink-soft">{c.eticheta}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
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
              size="md"
            />
          )}
        </div>
      </section>

      <div className="flex flex-col gap-9 px-5 pt-8 md:px-0 md:pt-10">
        {company.discount_procent ? (
          <section className="flex items-start gap-4 rounded-[20px] bg-gold-pale p-5">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] bg-gold font-display text-xl text-[#121614]">
              -{company.discount_procent}%
            </span>
            <div className="min-w-0 flex-1">
              <p className="stamp-label text-gold-ink">Reducere pentru membrii ACDR</p>
              <p className="mt-1.5 font-bold text-ink">
                {company.discount_descriere || `${company.discount_procent}% reducere pentru firmele din ACDR`}
              </p>
              {company.discount_conditii && <p className="mt-1 text-sm text-ink-soft">{company.discount_conditii}</p>}
            </div>
          </section>
        ) : null}

        {/* ================= DESPRE ================= */}
        {(company.descriere || company.timp_raspuns || company.proiect_marime || financiar?.cifra_afaceri != null) && (
          <section className="flex flex-col gap-4">
            <h2 className={titluSectiune}>Despre firmă</h2>
            {company.descriere && (
              <p className="max-w-2xl text-base leading-relaxed text-ink-soft">{company.descriere}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {company.timp_raspuns && (
                <span className={chip}>
                  <Zap className="mr-1.5 h-3.5 w-3.5 text-seal" /> {TIMP_RASPUNS_LABEL[company.timp_raspuns]}
                </span>
              )}
              {company.proiect_marime && (
                <span className={chip}>
                  <Layers className="mr-1.5 h-3.5 w-3.5 text-seal" /> Proiecte {etichetaProiectMarime(company.proiect_marime)}
                </span>
              )}
              {financiar?.cifra_afaceri != null && (
                <span className={chip}>
                  <TrendingUp className="mr-1.5 h-3.5 w-3.5 text-seal" />
                  {financiar.cifra_afaceri.toLocaleString("ro-RO")} lei ({financiar.an})
                </span>
              )}
            </div>
          </section>
        )}

        {/* ================= CE OFERA ================= */}
        {areOferta && (
          <section className="flex flex-col gap-4">
            <h2 className={titluSectiune}>Ce oferă</h2>
            {(domeniiSecundare.length > 0 || company.domenii_altele) && (
              <div className="flex flex-wrap gap-2">
                {domeniiSecundare.map((c) => (
                  <span key={c.categories!.id} className={chip}>
                    {c.categories!.name_ro}
                  </span>
                ))}
                {company.domenii_altele && <span className={chip}>{company.domenii_altele}</span>}
              </div>
            )}
            {oferte.length > 0 && (
              <ul className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-surface px-4">
                {oferte.map((o, i) => (
                  <li key={i} className="py-3 text-sm text-ink">
                    <span className="font-bold">{o.categories?.name_ro ?? ""}</span>
                    {o.nota && <span className="text-ink-soft"> — {o.nota}</span>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* ================= CE CAUTA ================= */}
        {areCautari && (
          <section className="flex flex-col gap-4">
            <h2 className={titluSectiune}>Ce caută</h2>
            {(categoriiCautate.length > 0 || company.domenii_cautate_altele) && (
              <div className="flex flex-wrap gap-2">
                {categoriiCautate.map((c) => (
                  <span key={c.categories!.id} className="inline-flex min-h-[34px] items-center rounded-full bg-gold-pale px-3.5 text-sm font-bold text-gold-ink">
                    {c.categories!.name_ro}
                  </span>
                ))}
                {company.domenii_cautate_altele && (
                  <span className="inline-flex min-h-[34px] items-center rounded-full bg-gold-pale px-3.5 text-sm font-bold text-gold-ink">
                    {company.domenii_cautate_altele}
                  </span>
                )}
              </div>
            )}
            {nevoi.length > 0 && (
              <ul className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-surface px-4">
                {nevoi.map((n, i) => (
                  <li key={i} className="py-3 text-sm text-ink">
                    <span className="font-bold">{n.categories?.name_ro ?? ""}</span>
                    {n.nota && <span className="text-ink-soft"> — {n.nota}</span>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {company.tags && company.tags.length > 0 && (
          <div className="-mt-4 flex flex-wrap gap-1.5">
            {company.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-ink/6 px-2.5 py-1 text-xs text-ink-soft">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* ================= OMUL DIN SPATELE FIRMEI ================= */}
        <section className="flex flex-col gap-4">
          <h2 className={titluSectiune}>Omul din spatele firmei</h2>
          {profil ? (
            <div className="grid grid-cols-[6.5rem_1fr] items-start gap-4 sm:grid-cols-[8.25rem_1fr]">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-olive-pale">
                {profil.avatar_url ? (
                  <Image src={profil.avatar_url} alt={profil.nume_complet ?? ""} fill className="object-cover" unoptimized />
                ) : (
                  <span aria-hidden className="flex h-full items-center justify-center font-display text-3xl text-seal">
                    {(profil.nume_complet ?? "?")
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join("")
                      .toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1.5 pt-1 text-sm">
                <p className="text-lg font-extrabold text-ink">{profil.nume_complet}</p>
                {profil.telefon_personal && <p className="text-ink-soft">{profil.telefon_personal}</p>}
                {profil.email_personal && <p className="break-all text-ink-soft">{profil.email_personal}</p>}
              </div>
            </div>
          ) : (
            <p className="flex items-start gap-2 rounded-2xl bg-ink/4 p-4 text-sm text-ink-soft">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" />
              Numele și datele reprezentantului sunt vizibile doar pentru firmele conectate.
            </p>
          )}
        </section>

        {/* ================= CONTACT ================= */}
        <section className="flex flex-col gap-4">
          <h2 className={titluSectiune}>Contact</h2>
          <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 text-sm">
            {(company.telefon_firma || company.email_firma) &&
              (vizitatorulEVerificat ? (
                <>
                  {company.telefon_firma && (
                    <a href={`tel:${company.telefon_firma}`} className="flex min-h-11 items-center gap-2.5 font-semibold text-ink hover:text-seal">
                      <Phone className="h-4 w-4 text-seal" /> {company.telefon_firma}
                    </a>
                  )}
                  {company.email_firma && (
                    <a href={`mailto:${company.email_firma}`} className="flex min-h-11 items-center gap-2.5 break-all font-semibold text-ink hover:text-seal">
                      <Mail className="h-4 w-4 shrink-0 text-seal" /> {company.email_firma}
                    </a>
                  )}
                </>
              ) : (
                <div className="flex items-start gap-2 rounded-xl bg-ink/4 p-3 text-ink-soft">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    {user ? (
                      "Telefonul și emailul firmei devin vizibile după ce contul tău e verificat de un administrator."
                    ) : (
                      <>
                        <Link href="/login" className="font-bold text-seal hover:underline">
                          Intră în cont
                        </Link>{" "}
                        ca membru verificat pentru a vedea telefonul și emailul firmei.
                      </>
                    )}
                  </span>
                </div>
              ))}
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 items-center gap-2.5 break-all font-semibold text-seal hover:underline"
              >
                <Globe className="h-4 w-4 shrink-0" /> {company.website}
              </a>
            )}
            {(company.facebook_url || company.instagram_url || company.linkedin_url) && (
              <div className="flex gap-1">
                {company.facebook_url && (
                  <a href={company.facebook_url} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="flex h-11 w-11 items-center justify-center rounded-xl text-ink-soft hover:bg-ink/6 hover:text-seal">
                    <FacebookIcon className="h-5 w-5" />
                  </a>
                )}
                {company.instagram_url && (
                  <a href={company.instagram_url} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-11 w-11 items-center justify-center rounded-xl text-ink-soft hover:bg-ink/6 hover:text-seal">
                    <InstagramIcon className="h-5 w-5" />
                  </a>
                )}
                {company.linkedin_url && (
                  <a href={company.linkedin_url} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="flex h-11 w-11 items-center justify-center rounded-xl text-ink-soft hover:bg-ink/6 hover:text-seal">
                    <LinkedinIcon className="h-5 w-5" />
                  </a>
                )}
              </div>
            )}
          </div>

          {contacte.length > 0 && (
            <ul className="grid gap-3 sm:grid-cols-2">
              {contacte.map((c) => (
                <li key={c.id} className="rounded-2xl border border-line bg-surface p-4 text-sm">
                  <p className="font-bold text-ink">{c.nume}</p>
                  <p className="text-ink-soft">{[c.rol, c.departament].filter(Boolean).join(" · ")}</p>
                  <p className="text-ink-soft">{[c.telefon, c.email].filter(Boolean).join(" · ")}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ================= ZONA DESERVITA ================= */}
        {(company.zona_deservita || company.raza_deservire_km || judeteSuplimentare.length > 0) && (
          <section className="flex flex-col gap-3">
            <h2 className={titluSectiune}>Zonă deservită</h2>
            <div className="flex flex-col gap-1 text-sm leading-relaxed text-ink-soft">
              {company.zona_deservita && <p>{company.zona_deservita}</p>}
              {company.raza_deservire_km && (
                <p>
                  Rază de {company.raza_deservire_km} km în jurul sediului{judetNume ? ` (${judetNume})` : ""}.
                </p>
              )}
              {judeteSuplimentare.length > 0 && <p>Deservește explicit și: {judeteSuplimentare.join(", ")}.</p>}
            </div>
          </section>
        )}

        {/* ================= PORTOFOLIU ================= */}
        {proiecte.length > 0 && (
          <section className="flex flex-col gap-4">
            <h2 className={titluSectiune}>Lucrări</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {proiecte.map((p) => (
                <Link
                  key={p.id}
                  href={`/firma/${id}/portofoliu/${p.id}`}
                  className="overflow-hidden rounded-2xl border border-line bg-surface transition-colors hover:border-seal"
                >
                  <div className="relative h-36 w-full bg-ink/5 sm:h-28">
                    {p.cover_url && <Image src={p.cover_url} alt={p.titlu} fill className="object-cover" unoptimized />}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-bold text-ink">{p.titlu}</p>
                    {p.locatie && (
                      <p className="text-xs text-ink-soft">
                        {p.locatie}
                        {p.an ? ` · ${p.an}` : ""}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ================= DATE PUBLICE ================= */}
        <section className="flex flex-col gap-3">
          <h2 className={titluSectiune}>Date publice</h2>
          <dl className="rounded-2xl border border-line bg-surface px-4 tabular-nums">
            {datePublice.map((r, i) => (
              <div
                key={r.eticheta}
                className={`flex justify-between gap-4 py-3 ${i < datePublice.length - 1 ? "border-b border-line" : ""}`}
              >
                <dt className="shrink-0 text-sm text-ink-soft">{r.eticheta}</dt>
                <dd className="text-right text-sm font-bold text-ink">{r.valoare}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ================= RECENZII ================= */}
        <section className="flex flex-col gap-4">
          <h2 className={titluSectiune}>
            Recenzii{company.rating_numar > 0 ? ` (${company.rating_numar})` : ""}
          </h2>
          <ReviewSection
            reviewedCompanyId={id}
            reviewerCompanyId={firmaVizitatorId}
            recenzii={recenzii}
            ratingMediu={company.rating_mediu}
            ratingNumar={company.rating_numar}
            motiv={motivRecenzie}
          />
        </section>
      </div>
    </div>
  );
}
