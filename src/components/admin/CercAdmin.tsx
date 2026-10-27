"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Field";
import { trimiteJson } from "@/lib/trimite-json";

/** Formularul adminului pentru un cerc nou. */
export function CercNouForm({ judete }: { judete: { cod: string; nume: string }[] }) {
  const router = useRouter();
  const [deschis, setDeschis] = useState(false);
  const [loading, setLoading] = useState(false);
  const [eroare, setEroare] = useState<string | null>(null);

  async function salveaza(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setLoading(true);
    setEroare(null);
    const r = await trimiteJson<{ id: string }>("/api/admin/cercuri", "POST", Object.fromEntries(f.entries()));
    setLoading(false);
    if (!r.ok) return setEroare(r.error ?? null);
    setDeschis(false);
    router.refresh();
  }

  if (!deschis) {
    return (
      <Button variant="seal" size="sm" onClick={() => setDeschis(true)}>
        <Plus className="h-4 w-4" /> Cerc nou
      </Button>
    );
  }

  return (
    <form onSubmit={salveaza} className="block-base grid gap-4 p-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label htmlFor="cerc-nume" required>Numele cercului</Label>
        <Input id="cerc-nume" name="nume" required minLength={3} maxLength={80} placeholder="Ex: Cercul de joi" />
      </div>
      <div>
        <Label htmlFor="cerc-oras" required>Oraș</Label>
        <Input id="cerc-oras" name="oras" required maxLength={60} />
      </div>
      <div>
        <Label htmlFor="cerc-judet">Județ</Label>
        <Select id="cerc-judet" name="judet_cod" defaultValue="">
          <option value="">—</option>
          {judete.map((j) => (
            <option key={j.cod} value={j.cod}>{j.nume}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="cerc-domeniu">Domeniu</Label>
        <Input id="cerc-domeniu" name="domeniu" maxLength={80} placeholder="Ex: Construcții și servicii" />
      </div>
      <div>
        <Label htmlFor="cerc-ritm">Când se întâlnesc</Label>
        <Input id="cerc-ritm" name="ritm" maxLength={80} placeholder="Ex: lunar, joia seara" />
      </div>
      <div>
        <Label htmlFor="cerc-max">Număr maxim de membri</Label>
        <Input id="cerc-max" name="max_membri" type="number" min={3} max={12} defaultValue={8} />
      </div>
      <div>
        <Label htmlFor="cerc-lider" required>Emailul liderului</Label>
        <Input id="cerc-lider" name="email_lider" type="email" required placeholder="emailul contului pe ACDR" />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="cerc-descriere">Descriere</Label>
        <Textarea id="cerc-descriere" name="descriere" maxLength={1000} />
      </div>
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Creează cercul
        </Button>
        <Button type="button" variant="ghost" onClick={() => setDeschis(false)}>Renunță</Button>
      </div>
      {eroare && <p className="text-sm font-medium text-rust sm:col-span-2">{eroare}</p>}
    </form>
  );
}

/** Butoanele de pe randul unui cerc: inchide/redeschide, sterge. */
export function CercAdminActions({ id, activ }: { id: string; activ: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [eroare, setEroare] = useState<string | null>(null);

  async function comuta() {
    setLoading(true);
    const r = await trimiteJson(`/api/admin/cercuri/${id}`, "PATCH", { activ: !activ });
    setLoading(false);
    if (!r.ok) return setEroare(r.error ?? null);
    router.refresh();
  }

  async function sterge() {
    if (!window.confirm("Ștergi cercul cu toți membrii, întâlnirile și mesajele lui? Nu se poate anula.")) return;
    setLoading(true);
    const r = await trimiteJson(`/api/admin/cercuri/${id}`, "DELETE");
    setLoading(false);
    if (!r.ok) return setEroare(r.error ?? null);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="secondary" size="sm" onClick={comuta} disabled={loading}>
        {activ ? "Închide" : "Redeschide"}
      </Button>
      <Button variant="danger" size="sm" onClick={sterge} disabled={loading}>Șterge</Button>
      {eroare && <p className="w-full text-xs font-medium text-rust">{eroare}</p>}
    </div>
  );
}
