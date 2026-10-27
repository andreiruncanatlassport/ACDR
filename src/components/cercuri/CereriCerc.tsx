"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { trimiteJson } from "@/lib/trimite-json";
import type { MembruCerc } from "@/lib/cercuri";

/** Lista de cereri in asteptare, vizibila doar liderului. */
export function CereriCerc({ circleId, cereri }: { circleId: string; cereri: MembruCerc[] }) {
  const router = useRouter();
  const [ocupat, setOcupat] = useState<string | null>(null);
  const [eroare, setEroare] = useState<string | null>(null);

  async function actioneaza(profileId: string, accepta: boolean) {
    setOcupat(profileId);
    setEroare(null);
    const url = `/api/cercuri/${circleId}/membri/${profileId}`;
    const r = accepta ? await trimiteJson(url, "PATCH", { actiune: "accepta" }) : await trimiteJson(url, "DELETE");
    setOcupat(null);
    if (!r.ok) return setEroare(r.error ?? null);
    router.refresh();
  }

  if (cereri.length === 0) return null;

  return (
    <div className="block-base p-4">
      <p className="stamp-label text-seal">Cereri noi ({cereri.length})</p>
      <ul className="mt-3 divide-y divide-line">
        {cereri.map((c) => (
          <li key={c.profile_id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">{c.nume_complet}</p>
              {(c.titlu || c.firma) && (
                <p className="text-xs text-ink-soft">{[c.titlu, c.firma].filter(Boolean).join(" · ")}</p>
              )}
              {c.mesaj && <p className="mt-1 text-sm text-ink-soft">„{c.mesaj}”</p>}
            </div>
            <div className="flex gap-2">
              <Button
                size="md"
                className="min-h-11"
                onClick={() => actioneaza(c.profile_id, true)}
                disabled={ocupat !== null}
              >
                <Check className="h-4 w-4" /> Primește
              </Button>
              <Button
                variant="secondary"
                size="md"
                className="min-h-11"
                onClick={() => actioneaza(c.profile_id, false)}
                disabled={ocupat !== null}
                aria-label={`Respinge cererea lui ${c.nume_complet}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {eroare && <p className="mt-2 text-xs font-medium text-rust">{eroare}</p>}
    </div>
  );
}
