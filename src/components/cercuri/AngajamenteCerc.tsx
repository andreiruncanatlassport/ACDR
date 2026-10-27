"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { trimiteJson } from "@/lib/trimite-json";
import type { AngajamentCerc } from "@/lib/cercuri";

/** Angajamentele mele pe luna curenta: adaug, bifez, sterg. */
export function AngajamenteleMele({ circleId, angajamente }: { circleId: string; angajamente: AngajamentCerc[] }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [eroare, setEroare] = useState<string | null>(null);

  async function adauga(e: React.FormEvent) {
    e.preventDefault();
    if (text.trim().length < 3) return;
    setLoading(true);
    setEroare(null);
    const r = await trimiteJson(`/api/cercuri/${circleId}/angajamente`, "POST", { text });
    setLoading(false);
    if (!r.ok) return setEroare(r.error ?? null);
    setText("");
    router.refresh();
  }

  async function bifeaza(a: AngajamentCerc) {
    const r = await trimiteJson(`/api/cercuri/angajamente/${a.id}`, "PATCH", { facut: !a.facut });
    if (!r.ok) return setEroare(r.error ?? null);
    router.refresh();
  }

  async function sterge(a: AngajamentCerc) {
    const r = await trimiteJson(`/api/cercuri/angajamente/${a.id}`, "DELETE");
    if (!r.ok) return setEroare(r.error ?? null);
    router.refresh();
  }

  return (
    <div className="block-base p-4">
      <p className="stamp-label text-ink-soft">Ce mi-am propus luna asta</p>
      {angajamente.length === 0 && (
        <p className="mt-2 text-sm text-ink-soft">Scrie un lucru concret pe care vrei să-l faci până la următoarea întâlnire.</p>
      )}
      <ul className="mt-2">
        {angajamente.map((a) => (
          <li key={a.id} className="flex items-center gap-3">
            <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={a.facut}
                onChange={() => bifeaza(a)}
                className="h-5 w-5 shrink-0 accent-[var(--color-primary)]"
              />
              <span className={a.facut ? "text-ink-soft line-through" : "text-ink"}>{a.text}</span>
            </label>
            <button
              type="button"
              onClick={() => sterge(a)}
              className="flex h-11 w-11 items-center justify-center text-ink-soft hover:text-rust"
              aria-label={`Șterge angajamentul: ${a.text}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={adauga} className="mt-2 flex gap-2">
        <label htmlFor={`angajament-${circleId}`} className="sr-only">Angajament nou</label>
        <Input
          id={`angajament-${circleId}`}
          value={text}
          maxLength={200}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ex: să trimit 3 oferte noi"
          className="min-h-11"
        />
        <Button type="submit" size="md" className="min-h-11 shrink-0" disabled={loading || text.trim().length < 3} aria-label="Adaugă angajamentul">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </Button>
      </form>
      {eroare && <p className="mt-2 text-xs font-medium text-rust">{eroare}</p>}
    </div>
  );
}
