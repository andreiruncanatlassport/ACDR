"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { trimiteJson } from "@/lib/trimite-json";

type Stare = "niciuna" | "cerere" | "activ";

/**
 * Butonul de intrare / iesire dintr-un cerc.
 *  - niciuna: "Cere loc" (cu un mesaj scurt optional pentru lider)
 *  - cerere:  "Anulează cererea"
 *  - activ:   "Ieși din cerc" (cu confirmare)
 */
export function CerereCercButton({
  circleId,
  stare,
  plin,
  verificat,
  compact = false,
}: {
  circleId: string;
  stare: Stare;
  plin: boolean;
  verificat: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [deschis, setDeschis] = useState(false);
  const [mesaj, setMesaj] = useState("");
  const [loading, setLoading] = useState(false);
  const [eroare, setEroare] = useState<string | null>(null);

  async function trimite() {
    setLoading(true);
    setEroare(null);
    const r = await trimiteJson(`/api/cercuri/${circleId}/cerere`, "POST", { mesaj });
    setLoading(false);
    if (!r.ok) return setEroare(r.error ?? null);
    setDeschis(false);
    router.refresh();
  }

  async function retrage() {
    if (stare === "activ" && !window.confirm("Sigur vrei să ieși din cerc?")) return;
    setLoading(true);
    setEroare(null);
    const r = await trimiteJson(`/api/cercuri/${circleId}/cerere`, "DELETE");
    setLoading(false);
    if (!r.ok) return setEroare(r.error ?? null);
    router.refresh();
  }

  if (stare === "activ" || stare === "cerere") {
    return (
      <div>
        <Button variant="secondary" size={compact ? "sm" : "md"} onClick={retrage} disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {stare === "activ" ? "Ieși din cerc" : "Anulează cererea"}
        </Button>
        {eroare && <p className="mt-2 text-xs font-medium text-rust">{eroare}</p>}
      </div>
    );
  }

  if (!verificat) {
    return (
      <p className="text-xs text-ink-soft">
        Poți cere loc după ce contul tău e verificat de un administrator.
      </p>
    );
  }

  if (plin) {
    return <p className="text-xs font-medium text-ink-soft">Cercul este complet.</p>;
  }

  if (!deschis) {
    return (
      <Button variant="secondary" size={compact ? "sm" : "md"} onClick={() => setDeschis(true)}>
        Cere loc
      </Button>
    );
  }

  return (
    <div className="w-full space-y-2">
      <label htmlFor={`mesaj-${circleId}`} className="block text-sm font-semibold text-ink">
        Un rând pentru lider (opțional)
      </label>
      <Textarea
        id={`mesaj-${circleId}`}
        value={mesaj}
        maxLength={500}
        onChange={(e) => setMesaj(e.target.value)}
        placeholder="Cu ce te ocupi și ce aștepți de la cerc"
        className="min-h-[80px]"
      />
      <div className="flex gap-2">
        <Button onClick={trimite} disabled={loading} size="md" className="min-h-11 flex-1">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Trimite cererea
        </Button>
        <Button variant="ghost" size="md" className="min-h-11" onClick={() => setDeschis(false)} disabled={loading}>
          Renunță
        </Button>
      </div>
      {eroare && <p className="text-xs font-medium text-rust">{eroare}</p>}
    </div>
  );
}
