import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Circle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SectionLabel } from "@/components/ui/Card";
import { CerereCercButton } from "@/components/cercuri/CerereCercButton";
import { CereriCerc } from "@/components/cercuri/CereriCerc";
import { UrmatoareaIntalnire, IntalnireNouaForm } from "@/components/cercuri/IntalnireCerc";
import { AngajamenteleMele } from "@/components/cercuri/AngajamenteCerc";
import { MesajeCerc } from "@/components/cercuri/MesajeCerc";
import {
  SELECT_CERC,
  initiale,
  lunaCurenta,
  type AngajamentCerc,
  type Cerc,
  type IntalnireCerc,
  type MembruCerc,
  type MesajCerc,
} from "@/lib/cercuri";
import { LUNI } from "@/lib/calendar-fiscal";

export const metadata = { title: "Cerc — ACDR" };

/** O intalnire inceputa acum 3 ore inca e "urmatoarea" (ca sa poti confirma pe loc). */
function pragIntalniri(): string {
  return new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
}

export default async function CercPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: cercData }, { data: euData }, { data: profilData }] = await Promise.all([
    supabase.from("circles").select(SELECT_CERC).eq("id", id).maybeSingle(),
    supabase.from("circle_members").select("status, rol").eq("circle_id", id).eq("profile_id", user.id).maybeSingle(),
    supabase.from("profiles").select("rol, stare_verificare").eq("id", user.id).maybeSingle(),
  ]);

  const cerc = cercData as Cerc | null;
  if (!cerc) notFound();

  const eu = euData as { status: "cerere" | "activ"; rol: "lider" | "membru" } | null;
  const profil = profilData as { rol: string; stare_verificare: string } | null;
  const esteAdmin = profil?.rol === "admin" || profil?.rol === "moderator";
  const esteMembru = eu?.status === "activ";
  const esteLider = esteMembru && eu?.rol === "lider";

  const antet = (
    <div>
      <Link href="/cercuri" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Cercuri
      </Link>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">{cerc.nume}</h1>
      <p className="mt-1 text-sm text-ink-soft">{[cerc.oras, cerc.domeniu, cerc.ritm].filter(Boolean).join(" · ")}</p>
      {!cerc.activ && <p className="mt-2 text-sm font-semibold text-rust">Cercul este închis.</p>}
    </div>
  );

  // ---- Vizitator (nu e membru activ) --------------------------------------
  if (!esteMembru && !esteAdmin) {
    const { data: numarData } = await supabase.rpc("circle_counts");
    const nr =
      ((numarData as { circle_id: string; membri_activi: number }[]) ?? []).find((r) => r.circle_id === id)
        ?.membri_activi ?? 0;
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:py-12">
        {antet}
        {cerc.descriere && <p className="text-base text-ink">{cerc.descriere}</p>}
        <p className="text-sm text-ink-soft">
          {nr} din {cerc.max_membri} locuri ocupate
        </p>
        <CerereCercButton
          circleId={id}
          stare={eu?.status ?? "niciuna"}
          plin={nr >= cerc.max_membri}
          verificat={profil?.stare_verificare === "verificat"}
        />
      </div>
    );
  }

  // ---- Membru / admin --------------------------------------------------------
  const luna = lunaCurenta();
  const [{ data: membriData }, { data: intalnireData }, { data: angajamenteData }, { data: mesajeData }] =
    await Promise.all([
      supabase.rpc("circle_member_profiles", { p_circle: id }),
      supabase
        .from("circle_meetings")
        .select("id, circle_id, starts_at, loc, tema")
        .eq("circle_id", id)
        .gte("starts_at", pragIntalniri())
        .order("starts_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("circle_commitments")
        .select("id, profile_id, text, luna, facut")
        .eq("circle_id", id)
        .eq("luna", luna)
        .order("created_at"),
      supabase
        .from("circle_messages")
        .select("id, profile_id, continut, created_at")
        .eq("circle_id", id)
        .order("created_at", { ascending: false })
        .limit(40),
    ]);

  const toti = (membriData as MembruCerc[]) ?? [];
  const membri = toti.filter((m) => m.status === "activ");
  const cereri = toti.filter((m) => m.status === "cerere");
  const nume = Object.fromEntries(toti.map((m) => [m.profile_id, m.nume_complet]));
  const intalnire = intalnireData as IntalnireCerc | null;
  const angajamente = (angajamenteData as AngajamentCerc[]) ?? [];
  const mesaje = (mesajeData as MesajCerc[]) ?? [];

  let raspunsulMeu: "vin" | "nu_vin" | null = null;
  let vin = 0;
  if (intalnire) {
    const { data: rsvpData } = await supabase
      .from("circle_meeting_rsvps")
      .select("profile_id, raspuns")
      .eq("meeting_id", intalnire.id);
    const rsvps = (rsvpData as { profile_id: string; raspuns: "vin" | "nu_vin" }[]) ?? [];
    raspunsulMeu = rsvps.find((r) => r.profile_id === user.id)?.raspuns ?? null;
    vin = rsvps.filter((r) => r.raspuns === "vin").length;
  }

  const aleMele = angajamente.filter((a) => a.profile_id === user.id);
  const aleAltora = angajamente.filter((a) => a.profile_id !== user.id);
  const numeLuna = LUNI[Number(luna.slice(5, 7)) - 1];

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:py-12">
      {antet}

      {(esteLider || esteAdmin) && <CereriCerc circleId={id} cereri={cereri} />}

      {intalnire ? (
        <UrmatoareaIntalnire
          key={intalnire.id}
          intalnire={intalnire}
          raspunsulMeu={raspunsulMeu}
          vin={vin}
          esteLider={esteLider || esteAdmin}
          poateRaspunde={esteMembru}
        />
      ) : (
        <div className="block-inset p-4 text-sm text-ink-soft">
          Nicio întâlnire programată.{esteLider ? "" : " Liderul cercului o va anunța aici."}
        </div>
      )}
      {(esteLider || esteAdmin) && <IntalnireNouaForm circleId={id} />}

      {esteMembru && <AngajamenteleMele circleId={id} angajamente={aleMele} />}

      {aleAltora.length > 0 && (
        <section>
          <SectionLabel>Angajamentele cercului în {numeLuna}</SectionLabel>
          <ul className="mt-3 space-y-2">
            {aleAltora.map((a) => (
              <li key={a.id} className="flex items-start gap-2.5 text-sm">
                {a.facut ? (
                  <><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden="true" /><span className="sr-only">Făcut:</span></>
                ) : (
                  <><Circle className="mt-0.5 h-4 w-4 shrink-0 text-ink-soft" aria-hidden="true" /><span className="sr-only">În lucru:</span></>
                )}
                <span>
                  <span className="font-semibold text-ink">{nume[a.profile_id] ?? "Membru"}:</span>{" "}
                  <span className={a.facut ? "text-ink-soft" : "text-ink"}>{a.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <SectionLabel>
          Membri ({membri.length} din {cerc.max_membri})
        </SectionLabel>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {membri.map((m) => (
            <li key={m.profile_id}>
              <Link href={`/membri/${m.profile_id}`} className="lift-on-hover block-base flex min-h-14 items-center gap-3 p-3">
                {m.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.avatar_url} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink/8 text-xs font-bold text-ink">
                    {initiale(m.nume_complet)}
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-ink">{m.nume_complet}</span>
                  <span className="block truncate text-xs text-ink-soft">
                    {m.rol === "lider" ? "Lider" : [m.titlu, m.firma].filter(Boolean).join(" · ") || "Membru"}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {esteMembru && (
        <section>
          <SectionLabel>Mesajele cercului</SectionLabel>
          <div className="mt-3">
            <MesajeCerc circleId={id} mesaje={mesaje} nume={nume} eu={user.id} />
          </div>
        </section>
      )}

      {esteMembru && (
        <div className="pt-2">
          <CerereCercButton circleId={id} stare="activ" plin={false} verificat compact />
        </div>
      )}
    </div>
  );
}
