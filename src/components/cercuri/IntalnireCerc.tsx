"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Check, Loader2, MapPin } from "lucide-react";
import { clsx } from "clsx";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { trimiteJson } from "@/lib/trimite-json";
import { formatIntalnire, type IntalnireCerc as Intalnire } from "@/lib/cercuri";

/** Cardul urmatoarei intalniri, cu "Vin" / "Nu pot" si numarul de confirmari. */
export function UrmatoareaIntalnire({
  intalnire,
  raspunsulMeu,
  vin,
  esteLider,
  poateRaspunde,
}: {
  intalnire: Intalnire;
  raspunsulMeu: "vin" | "nu_vin" | null;
  vin: number;
  esteLider: boolean;
  /** doar membrii activi confirma prezenta (adminii care nu sunt membri nu pot) */
  poateRaspunde: boolean;
}) {
  const router = useRouter();
  const [raspuns, setRaspuns] = useState(raspunsulMeu);
  const [loading, setLoading] = useState(false);
  const [eroare, setEroare] = useState<string | null>(null);

  async function raspunde(r: "vin" | "nu_vin") {
    setLoading(true);
    setEroare(null);
    const rez = await trimiteJson(`/api/cercuri/intalniri/${intalnire.id}`, "POST", { raspuns: r });
    setLoading(false);
    if (!rez.ok) return setEroare(rez.error ?? null);
    setRaspuns(r);
    router.refresh();
  }

  async function anuleaza() {
    if (!window.confirm("Anulezi întâlnirea? Membrii nu mai o văd în pagina cercului.")) return;
    setLoading(true);
    const rez = await trimiteJson(`/api/cercuri/intalniri/${intalnire.id}`, "DELETE");
    setLoading(false);
    if (!rez.ok) return setEroare(rez.error ?? null);
    router.refresh();
  }

  return (
    <div className="rounded-[20px] bg-primary p-5 text-primary-content">
      <p className="stamp-label opacity-80">Următoarea întâlnire</p>
      <p className="mt-1 text-xl font-semibold first-letter:uppercase">{formatIntalnire(intalnire.starts_at)}</p>
      {intalnire.tema && <p className="mt-1 text-sm opacity-90">Tema: {intalnire.tema}</p>}
      {intalnire.loc && (
        <p className="mt-1 flex items-center gap-1.5 text-sm opacity-90">
          <MapPin className="h-4 w-4 shrink-0" /> {intalnire.loc}
        </p>
      )}
      <p className="mt-3 text-xs opacity-80">{vin === 1 ? "1 membru vine" : `${vin} membri vin`}</p>
      {poateRaspunde && (
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => raspunde("vin")}
          disabled={loading}
          aria-pressed={raspuns === "vin"}
          className={clsx(
            "min-h-12 flex-1 rounded-2xl px-4 text-sm font-bold transition",
            raspuns === "vin" ? "bg-primary-content text-primary" : "border-[1.5px] border-primary-content/80 text-primary-content"
          )}
        >
          <span className="inline-flex items-center justify-center gap-1.5">
            {raspuns === "vin" && <Check className="h-4 w-4" />}
            Vin
          </span>
        </button>
        <button
          type="button"
          onClick={() => raspunde("nu_vin")}
          disabled={loading}
          aria-pressed={raspuns === "nu_vin"}
          className={clsx(
            "min-h-12 flex-1 rounded-2xl px-4 text-sm font-bold transition",
            raspuns === "nu_vin" ? "bg-primary-content text-primary" : "border-[1.5px] border-primary-content/80 text-primary-content"
          )}
        >
          Nu pot
        </button>
      </div>
      )}
      {esteLider && (
        <button type="button" onClick={anuleaza} disabled={loading} className="mt-3 min-h-11 text-xs font-semibold underline opacity-80">
          Anulează întâlnirea
        </button>
      )}
      {eroare && <p className="mt-2 text-xs font-medium">{eroare}</p>}
    </div>
  );
}

/** Formularul liderului pentru o intalnire noua. */
export function IntalnireNouaForm({ circleId }: { circleId: string }) {
  const router = useRouter();
  const [deschis, setDeschis] = useState(false);
  const [data, setData] = useState("");
  const [ora, setOra] = useState("19:00");
  const [loc, setLoc] = useState("");
  const [tema, setTema] = useState("");
  const [loading, setLoading] = useState(false);
  const [eroare, setEroare] = useState<string | null>(null);

  async function salveaza(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return setEroare("Alege data întâlnirii.");
    setLoading(true);
    setEroare(null);
    // Data si ora sunt introduse in ora locala a browserului.
    const startsAt = new Date(`${data}T${ora || "19:00"}`).toISOString();
    const r = await trimiteJson(`/api/cercuri/${circleId}/intalniri`, "POST", { starts_at: startsAt, loc, tema });
    setLoading(false);
    if (!r.ok) return setEroare(r.error ?? null);
    setDeschis(false);
    setData("");
    setLoc("");
    setTema("");
    router.refresh();
  }

  if (!deschis) {
    return (
      <Button variant="secondary" size="md" className="min-h-11 w-full" onClick={() => setDeschis(true)}>
        <CalendarPlus className="h-4 w-4" /> Programează o întâlnire
      </Button>
    );
  }

  return (
    <form onSubmit={salveaza} className="block-base space-y-3 p-4">
      <p className="stamp-label text-seal">Întâlnire nouă</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="intalnire-data" required>Data</Label>
          <Input id="intalnire-data" type="date" value={data} onChange={(e) => setData(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="intalnire-ora">Ora</Label>
          <Input id="intalnire-ora" type="time" value={ora} onChange={(e) => setOra(e.target.value)} />
        </div>
      </div>
      <div>
        <Label htmlFor="intalnire-loc">Locul</Label>
        <Input id="intalnire-loc" value={loc} maxLength={160} onChange={(e) => setLoc(e.target.value)} placeholder="Adresa sau linkul de întâlnire" />
      </div>
      <div>
        <Label htmlFor="intalnire-tema">Tema</Label>
        <Input id="intalnire-tema" value={tema} maxLength={200} onChange={(e) => setTema(e.target.value)} placeholder="Despre ce vorbim" />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="md" className="min-h-11 flex-1" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Programează și anunță membrii
        </Button>
        <Button type="button" variant="ghost" size="md" className="min-h-11" onClick={() => setDeschis(false)}>
          Renunță
        </Button>
      </div>
      {eroare && <p className="text-xs font-medium text-rust">{eroare}</p>}
    </form>
  );
}
