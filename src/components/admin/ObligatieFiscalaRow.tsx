"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Field";
import { trimiteJson } from "@/lib/trimite-json";
import type { ObligatieFiscala } from "@/lib/calendar-fiscal";

/** Un rand din lista adminului: ziua, luna, descrierea si activ/inactiv. */
export function ObligatieFiscalaRow({ o }: { o: ObligatieFiscala }) {
  const router = useRouter();
  const [zi, setZi] = useState(String(o.zi));
  const [luna, setLuna] = useState(o.luna_anuala ? String(o.luna_anuala) : "");
  const [descriere, setDescriere] = useState(o.descriere ?? "");
  const [loading, setLoading] = useState(false);
  const [mesaj, setMesaj] = useState<string | null>(null);

  async function salveaza(doarActiv?: { activ: boolean }) {
    setLoading(true);
    setMesaj(null);
    const r = await trimiteJson(
      `/api/admin/obligatii-fiscale/${o.id}`,
      "PATCH",
      doarActiv ?? {
        zi: Number(zi),
        luna_anuala: o.frecventa === "anual" ? Number(luna) : null,
        descriere,
      }
    );
    setLoading(false);
    setMesaj(r.ok ? "Salvat." : r.error ?? "Eroare.");
    if (r.ok) router.refresh();
  }

  return (
    <div className={o.activ ? "block-base p-4" : "block-inset p-4 opacity-70"}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-ink">
            {o.formular ? `${o.formular} · ` : ""}
            {o.denumire}
          </p>
          <p className="text-xs text-ink-soft">
            {o.frecventa} · se aplică: {o.conditie.replace(/_/g, " ")}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => salveaza({ activ: !o.activ })} disabled={loading}>
          {o.activ ? "Dezactivează" : "Activează"}
        </Button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <Label htmlFor={`zi-${o.id}`}>Ziua (31 = ultima)</Label>
          <Input id={`zi-${o.id}`} type="number" min={1} max={31} value={zi} onChange={(e) => setZi(e.target.value)} />
        </div>
        {o.frecventa === "anual" && (
          <div>
            <Label htmlFor={`luna-${o.id}`}>Luna</Label>
            <Input id={`luna-${o.id}`} type="number" min={1} max={12} value={luna} onChange={(e) => setLuna(e.target.value)} />
          </div>
        )}
      </div>
      <div className="mt-3">
        <Label htmlFor={`desc-${o.id}`}>Descriere pentru membri</Label>
        <Textarea id={`desc-${o.id}`} value={descriere} maxLength={500} onChange={(e) => setDescriere(e.target.value)} className="min-h-[70px]" />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Button size="sm" onClick={() => salveaza()} disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvează
        </Button>
        {mesaj && <span className="text-xs text-ink-soft">{mesaj}</span>}
      </div>
    </div>
  );
}
