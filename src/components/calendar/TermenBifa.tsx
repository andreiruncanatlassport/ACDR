"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trimiteJson } from "@/lib/trimite-json";

/** Bifa "Depus" pentru un termen din calendarul fiscal. */
export function TermenBifa({
  companyId,
  obligationId,
  scadenta,
  depus,
  eticheta,
}: {
  companyId: string;
  obligationId: string;
  scadenta: string;
  depus: boolean;
  eticheta: string;
}) {
  const router = useRouter();
  const [bifat, setBifat] = useState(depus);
  const [ocupat, setOcupat] = useState(false);
  const [eroare, setEroare] = useState<string | null>(null);

  async function comuta() {
    const nou = !bifat;
    setBifat(nou);
    setOcupat(true);
    setEroare(null);
    const r = await trimiteJson("/api/calendar-fiscal/bifat", nou ? "POST" : "DELETE", {
      company_id: companyId,
      obligation_id: obligationId,
      scadenta,
    });
    setOcupat(false);
    if (!r.ok) {
      setBifat(!nou);
      setEroare("Nu s-a salvat");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex shrink-0 flex-col items-center">
      <label className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2 text-xs font-semibold text-ink-soft">
        <input
          type="checkbox"
          checked={bifat}
          onChange={comuta}
          disabled={ocupat}
          aria-label={`${eticheta}: depus`}
          className="h-5 w-5 accent-[var(--color-primary)]"
        />
        <span className="hidden sm:inline">Depus</span>
      </label>
      <span role="status" className="text-[11px] font-semibold text-rust">{eroare}</span>
    </div>
  );
}
