"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { trimiteJson } from "@/lib/trimite-json";
import type { MesajCerc } from "@/lib/cercuri";

/** Mesajele grupului (cele mai noi sus) + formularul de mesaj nou. */
export function MesajeCerc({
  circleId,
  mesaje,
  nume,
  eu,
}: {
  circleId: string;
  mesaje: MesajCerc[];
  nume: Record<string, string>;
  eu: string;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [eroare, setEroare] = useState<string | null>(null);

  async function trimite(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setEroare(null);
    const r = await trimiteJson(`/api/cercuri/${circleId}/mesaje`, "POST", { continut: text });
    setLoading(false);
    if (!r.ok) return setEroare(r.error ?? null);
    setText("");
    router.refresh();
  }

  const format = new Intl.DateTimeFormat("ro-RO", {
    timeZone: "Europe/Bucharest",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="block-base p-4">
      <form onSubmit={trimite} className="space-y-2">
        <label htmlFor={`mesaj-cerc-${circleId}`} className="sr-only">Mesaj către cerc</label>
        <Textarea
          id={`mesaj-cerc-${circleId}`}
          value={text}
          maxLength={2000}
          onChange={(e) => setText(e.target.value)}
          placeholder="Scrie grupului: o veste, o cerere de rugăciune, o întrebare"
          className="min-h-[80px]"
        />
        <Button type="submit" size="md" className="min-h-11 w-full sm:w-auto" disabled={loading || !text.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Trimite
        </Button>
        {eroare && <p className="text-xs font-medium text-rust">{eroare}</p>}
      </form>

      {mesaje.length > 0 && (
        <ul className="mt-4 space-y-3 border-t border-line pt-4">
          {mesaje.map((m) => (
            <li key={m.id}>
              <p className="text-xs text-ink-soft">
                <span className="font-semibold text-ink">{m.profile_id === eu ? "Tu" : nume[m.profile_id] ?? "Fost membru"}</span>
                {" · "}
                {format.format(new Date(m.created_at))}
              </p>
              <p className="mt-0.5 whitespace-pre-line text-sm text-ink">{m.continut}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
