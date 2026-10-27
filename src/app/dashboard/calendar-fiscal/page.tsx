import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarClock, Download, Info } from "lucide-react";
import { clsx } from "clsx";
import { createClient } from "@/lib/supabase/server";
import { SectionLabel } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { ProfilFiscalForm } from "@/components/calendar/ProfilFiscalForm";
import { TermenBifa } from "@/components/calendar/TermenBifa";
import { incarcaCalendar } from "@/lib/calendar-fiscal-server";
import { LUNI, adaugaZile, aziRomania, cheieTermen, zileRamase, type Termen } from "@/lib/calendar-fiscal";

export const metadata = { title: "Calendar fiscal — ACDR" };

function eticheta(t: Termen): string {
  return t.obligatie.formular ? `${t.obligatie.formular} · ${t.obligatie.denumire}` : t.obligatie.denumire;
}

function textRamas(zile: number): string {
  if (zile < 0) return zile === -1 ? "a trecut ieri" : `a trecut acum ${-zile} zile`;
  if (zile === 0) return "azi";
  if (zile === 1) return "mâine";
  return `în ${zile} zile`;
}

function RandTermen({ t, azi, depus, companyId }: { t: Termen; azi: string; depus: boolean; companyId: string }) {
  const zile = zileRamase(azi, t.scadenta);
  const [, l, z] = t.scadenta.split("-").map(Number);
  const urgent = !depus && zile <= 7;
  const mutat = t.scadenta !== t.scadentaLegala;
  return (
    <li className="flex items-center gap-3 py-3">
      <div
        className={clsx(
          "flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-xl border",
          depus ? "border-line text-ink-soft" : urgent ? "border-seal bg-seal/10 text-ink" : "border-line-strong text-ink"
        )}
      >
        <span className="text-lg font-bold leading-none">{z}</span>
        <span className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide">{LUNI[l - 1].slice(0, 3)}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className={clsx("text-sm font-semibold leading-snug", depus ? "text-ink-soft line-through" : "text-ink")}>
          {eticheta(t)}
        </p>
        <p className="text-xs text-ink-soft">
          pentru {t.perioada} · {depus ? "depus" : textRamas(zile)}
          {mutat ? " · mutat de pe o zi nelucrătoare" : ""}
        </p>
      </div>
      <TermenBifa
        companyId={companyId}
        obligationId={t.obligatie.id}
        scadenta={t.scadenta}
        depus={depus}
        eticheta={`${eticheta(t)}, ${t.perioada}`}
      />
    </li>
  );
}

export default async function CalendarFiscalPage({ searchParams }: { searchParams: Promise<{ firma?: string }> }) {
  const { firma: firmaCeruta } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: firmeData } = await supabase
    .from("companies")
    .select("id, denumire, tva_activ")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true });
  const firme = (firmeData as { id: string; denumire: string; tva_activ: boolean | null }[]) ?? [];

  const antet = (
    <div>
      <Link href="/dashboard" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Contul meu
      </Link>
      <h1 className="mt-1 flex items-center gap-2.5 text-3xl font-semibold tracking-tight text-ink">
        <CalendarClock className="h-7 w-7 text-seal" strokeWidth={1.8} /> Calendar fiscal
      </h1>
    </div>
  );

  if (firme.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-8 sm:py-12">
        {antet}
        <p className="text-sm text-ink-soft">Calendarul fiscal se calculează pentru o firmă. Adaugă-ți firma ca să-l vezi.</p>
        <LinkButton href="/inregistrare/firma" variant="seal">Adaugă o firmă</LinkButton>
      </div>
    );
  }

  const firma = firme.find((f) => f.id === firmaCeruta) ?? firme[0];
  const azi = aziRomania();
  const de = adaugaZile(azi, -45);
  const pana = adaugaZile(azi, 120);
  const { profil, salvat, termene, depuse } = await incarcaCalendar(supabase, firma.id, de, pana, firma.tva_activ);

  const esteDepus = (t: Termen) => depuse.has(cheieTermen(t.obligatie.id, t.scadenta));
  const restante = termene.filter((t) => t.scadenta < azi && !esteDepus(t));
  const viitoare = termene.filter((t) => t.scadenta >= azi);
  const urmatoarele30 = viitoare.filter((t) => zileRamase(azi, t.scadenta) <= 30);
  const maiTarziu = viitoare.filter((t) => zileRamase(azi, t.scadenta) > 30);

  const peLuni = new Map<string, Termen[]>();
  for (const t of maiTarziu) {
    const cheie = t.scadenta.slice(0, 7);
    peLuni.set(cheie, [...(peLuni.get(cheie) ?? []), t]);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:py-12">
      {antet}

      {firme.length > 1 && (
        <nav aria-label="Alege firma" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {firme.map((f) => (
            <Link
              key={f.id}
              href={`/dashboard/calendar-fiscal?firma=${f.id}`}
              aria-current={f.id === firma.id ? "page" : undefined}
              className={clsx(
                "flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm font-semibold",
                f.id === firma.id ? "border-primary bg-primary text-primary-content" : "border-line-strong bg-surface text-ink"
              )}
            >
              {f.denumire}
            </Link>
          ))}
        </nav>
      )}

      {firme.length === 1 && <p className="-mt-3 text-sm text-ink-soft">{firma.denumire}</p>}

      <ProfilFiscalForm key={firma.id} companyId={firma.id} initial={profil} salvat={salvat} />

      {salvat && (
        <>
          {restante.length > 0 && (
            <section>
              <SectionLabel>Nebifate ({restante.length})</SectionLabel>
              <ul className="block-base mt-3 divide-y divide-line px-4">
                {restante.map((t) => (
                  <RandTermen key={cheieTermen(t.obligatie.id, t.scadenta)} t={t} azi={azi} depus={false} companyId={firma.id} />
                ))}
              </ul>
            </section>
          )}

          <section>
            <SectionLabel>Următoarele 30 de zile</SectionLabel>
            {urmatoarele30.length === 0 ? (
              <p className="mt-3 text-sm text-ink-soft">Niciun termen în următoarele 30 de zile.</p>
            ) : (
              <ul className="block-base mt-3 divide-y divide-line px-4">
                {urmatoarele30.map((t) => (
                  <RandTermen key={cheieTermen(t.obligatie.id, t.scadenta)} t={t} azi={azi} depus={esteDepus(t)} companyId={firma.id} />
                ))}
              </ul>
            )}
          </section>

          {[...peLuni.entries()].map(([luna, lista]) => (
            <section key={luna}>
              <SectionLabel>
                {LUNI[Number(luna.slice(5, 7)) - 1]} {luna.slice(0, 4)}
              </SectionLabel>
              <ul className="block-base mt-3 divide-y divide-line px-4">
                {lista.map((t) => (
                  <RandTermen key={cheieTermen(t.obligatie.id, t.scadenta)} t={t} azi={azi} depus={esteDepus(t)} companyId={firma.id} />
                ))}
              </ul>
            </section>
          ))}

          <a
            href={`/api/calendar-fiscal/ics?firma=${firma.id}`}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface px-4 text-sm font-semibold text-ink hover:border-seal"
          >
            <Download className="h-4 w-4" /> Adaugă termenele în calendarul telefonului (.ics)
          </a>
        </>
      )}

      <p className="flex gap-2 text-xs leading-relaxed text-ink-soft">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        Termenele sunt calculate după regulile generale ANAF și mutate pe prima zi lucrătoare când cad în weekend
        sau în sărbători legale. Situația fiecărei firme poate diferi: verifică cu contabilul și în Spațiul Privat
        Virtual.
      </p>
    </div>
  );
}
