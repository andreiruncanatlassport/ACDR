import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, UsersRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SectionLabel } from "@/components/ui/Card";
import { CerereCercButton } from "@/components/cercuri/CerereCercButton";
import { SELECT_CERC, type Cerc } from "@/lib/cercuri";

export const metadata = { title: "Cercuri — ACDR" };

export default async function CercuriPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: cercuriData }, { data: numarData }, { data: aleMeleData }, { data: profilData }] = await Promise.all([
    supabase.from("circles").select(SELECT_CERC).eq("activ", true).order("oras"),
    supabase.rpc("circle_counts"),
    supabase.from("circle_members").select("circle_id, status, rol").eq("profile_id", user.id),
    supabase.from("profiles").select("stare_verificare").eq("id", user.id).maybeSingle(),
  ]);

  const cercuri = (cercuriData as Cerc[]) ?? [];
  const ocupate = new Map(
    ((numarData as { circle_id: string; membri_activi: number }[]) ?? []).map((r) => [r.circle_id, r.membri_activi])
  );
  const aleMele = new Map(
    ((aleMeleData as { circle_id: string; status: "cerere" | "activ"; rol: string }[]) ?? []).map((r) => [r.circle_id, r])
  );
  const verificat = (profilData as { stare_verificare: string } | null)?.stare_verificare === "verificat";

  const membruIn = cercuri.filter((c) => aleMele.get(c.id)?.status === "activ");
  const ceruteDeMine = cercuri.filter((c) => aleMele.get(c.id)?.status === "cerere");
  const celelalte = cercuri.filter((c) => !aleMele.has(c.id));

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <p className="stamp-label text-seal">Comunitate</p>
      <h1 className="mt-1.5 flex items-center gap-2.5 text-3xl font-semibold tracking-tight text-ink">
        <UsersRound className="h-7 w-7 text-seal" strokeWidth={1.8} /> Cercuri
      </h1>
      <p className="mt-3 text-base text-ink-soft">
        Grupuri de 6–8 antreprenori care se văd lunar, discută deciziile grele, își iau angajamente pentru
        luna următoare și se roagă unii pentru alții.
      </p>

      {membruIn.length > 0 && (
        <section className="mt-8 space-y-3">
          <SectionLabel>Cercul tău</SectionLabel>
          {membruIn.map((c) => (
            <Link
              key={c.id}
              href={`/cercuri/${c.id}`}
              className="lift-on-hover flex min-h-16 items-center gap-4 rounded-[20px] bg-primary p-5 text-primary-content"
            >
              <div className="min-w-0 flex-1">
                <p className="text-lg font-semibold">{c.nume}</p>
                <p className="text-sm opacity-85">
                  {c.oras}
                  {c.ritm ? ` · ${c.ritm}` : ""}
                </p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0" />
            </Link>
          ))}
        </section>
      )}

      {ceruteDeMine.length > 0 && (
        <section className="mt-8 space-y-3">
          <SectionLabel>Cererile tale</SectionLabel>
          {ceruteDeMine.map((c) => (
            <div key={c.id} className="block-base flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{c.nume}</p>
                <p className="text-sm text-ink-soft">Așteaptă răspunsul liderului</p>
              </div>
              <CerereCercButton circleId={c.id} stare="cerere" plin={false} verificat={verificat} compact />
            </div>
          ))}
        </section>
      )}

      <section className="mt-8 space-y-3">
        <SectionLabel>{membruIn.length > 0 ? "Alte cercuri" : "Cercuri cu locuri libere"}</SectionLabel>
        {celelalte.length === 0 && (
          <p className="text-sm text-ink-soft">
            Nu sunt alte cercuri deschise acum. Dacă vrei să pornești unul în orașul tău, scrie-ne din pagina de
            contact a comunității.
          </p>
        )}
        {celelalte.map((c) => {
          const nr = ocupate.get(c.id) ?? 0;
          const libere = Math.max(0, c.max_membri - nr);
          return (
            <div key={c.id} className="block-base p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{c.nume}</p>
                  <p className="text-sm text-ink-soft">
                    {[c.oras, c.domeniu, c.ritm].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-seal/12 px-2.5 py-1 text-xs font-bold text-ink">
                  {libere === 0 ? "complet" : libere === 1 ? "1 loc" : `${libere} locuri`}
                </span>
              </div>
              {c.descriere && <p className="mt-2 text-sm text-ink-soft">{c.descriere}</p>}
              <div className="mt-3">
                <CerereCercButton circleId={c.id} stare="niciuna" plin={libere === 0} verificat={verificat} compact />
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
