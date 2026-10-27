"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { Button } from "@/components/ui/Button";
import { trimiteJson } from "@/lib/trimite-json";
import type { ProfilFiscal } from "@/lib/calendar-fiscal";

function Optiuni<T extends string>({
  legenda,
  nume,
  valoare,
  optiuni,
  onChange,
}: {
  legenda: string;
  nume: string;
  valoare: T;
  optiuni: { valoare: T; eticheta: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-ink">{legenda}</legend>
      <div className="flex flex-wrap gap-2">
        {optiuni.map((o) => (
          <label
            key={o.valoare}
            className={clsx(
              "flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-sm font-semibold transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-seal",
              valoare === o.valoare ? "border-primary bg-primary text-primary-content" : "border-line-strong bg-surface text-ink"
            )}
          >
            <input
              type="radio"
              name={nume}
              value={o.valoare}
              checked={valoare === o.valoare}
              onChange={() => onChange(o.valoare)}
              className="sr-only"
            />
            {o.eticheta}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Bifa({ eticheta, detaliu, checked, onChange }: { eticheta: string; detaliu?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-start gap-3 py-1">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-primary)]"
      />
      <span>
        <span className="block text-sm font-semibold text-ink">{eticheta}</span>
        {detaliu && <span className="block text-xs text-ink-soft">{detaliu}</span>}
      </span>
    </label>
  );
}

/** Profilul fiscal al firmei: din el se decide ce termene apar in calendar. */
export function ProfilFiscalForm({
  companyId,
  initial,
  salvat,
}: {
  companyId: string;
  initial: ProfilFiscal;
  salvat: boolean;
}) {
  const router = useRouter();
  const [deschis, setDeschis] = useState(!salvat);
  const [p, setP] = useState<ProfilFiscal>(initial);
  const [loading, setLoading] = useState(false);
  const [eroare, setEroare] = useState<string | null>(null);

  const seteaza = <K extends keyof ProfilFiscal>(k: K, v: ProfilFiscal[K]) => setP((vechi) => ({ ...vechi, [k]: v }));

  async function salveaza(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setEroare(null);
    const r = await trimiteJson("/api/calendar-fiscal/profil", "PUT", { company_id: companyId, ...p });
    setLoading(false);
    if (!r.ok) return setEroare(r.error ?? null);
    setDeschis(false);
    router.refresh();
  }

  if (!deschis) {
    return (
      <button
        type="button"
        onClick={() => setDeschis(true)}
        className="min-h-11 text-sm font-semibold text-ink-soft underline-offset-4 hover:text-ink hover:underline"
      >
        Modifică profilul fiscal al firmei
      </button>
    );
  }

  return (
    <form onSubmit={salveaza} className="block-base space-y-5 p-5">
      <div>
        <p className="stamp-label text-seal">Profilul fiscal</p>
        <p className="mt-1 text-sm text-ink-soft">
          Din răspunsuri alegem termenele care se aplică firmei. Dacă nu ești sigur, întreabă contabilul.
        </p>
      </div>

      <Optiuni
        legenda="TVA"
        nume="tva"
        valoare={p.tva}
        onChange={(v) => seteaza("tva", v)}
        optiuni={[
          { valoare: "neplatitor", eticheta: "Neplătitor" },
          { valoare: "trimestrial", eticheta: "Trimestrial" },
          { valoare: "lunar", eticheta: "Lunar" },
        ]}
      />

      <Optiuni
        legenda="Impozit"
        nume="impozit"
        valoare={p.impozit}
        onChange={(v) => seteaza("impozit", v)}
        optiuni={[
          { valoare: "micro", eticheta: "Microîntreprindere" },
          { valoare: "profit", eticheta: "Impozit pe profit" },
        ]}
      />

      <Optiuni
        legenda="SAF-T (D406)"
        nume="saft"
        valoare={p.saft}
        onChange={(v) => seteaza("saft", v)}
        optiuni={[
          { valoare: "trimestrial", eticheta: "Trimestrial" },
          { valoare: "lunar", eticheta: "Lunar" },
          { valoare: "nu", eticheta: "Nu depun" },
        ]}
      />

      <div className="divide-y divide-line">
        <Bifa eticheta="Am angajați" detaliu="Declarația 112 în fiecare lună" checked={p.angajator} onChange={(v) => seteaza("angajator", v)} />
        <Bifa
          eticheta="Am operațiuni intracomunitare"
          detaliu="Livrări, achiziții sau servicii cu firme din UE (D390)"
          checked={p.intracomunitar}
          onChange={(v) => seteaza("intracomunitar", v)}
        />
        <Bifa
          eticheta="Firma are clădiri, terenuri sau mașini"
          detaliu="Impozitele locale, plătite la primărie"
          checked={p.cladiri_auto}
          onChange={(v) => seteaza("cladiri_auto", v)}
        />
        <Bifa
          eticheta="Rețin impozit la sursă"
          detaliu="Dividende, drepturi de autor, chirii plătite persoanelor fizice (D205)"
          checked={p.retineri_la_sursa}
          onChange={(v) => seteaza("retineri_la_sursa", v)}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="md" className="min-h-12 flex-1 sm:flex-none" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvează și arată termenele
        </Button>
        {salvat && (
          <Button type="button" variant="ghost" size="md" className="min-h-12" onClick={() => setDeschis(false)}>
            Renunță
          </Button>
        )}
      </div>
      {eroare && <p className="text-xs font-medium text-rust">{eroare}</p>}
    </form>
  );
}
