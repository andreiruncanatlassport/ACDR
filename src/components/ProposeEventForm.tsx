"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { Input, Label, Textarea, Select, FieldError, FieldHint, FieldGroup } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { DataOraInput } from "@/components/DataOraInput";
import { isoDinRomania } from "@/lib/evenimente-data";

const TIPURI = [
  { id: "conferinta", label: "Conferință" },
  { id: "workshop", label: "Workshop" },
  { id: "networking", label: "Networking" },
  { id: "altul", label: "Altul" },
];

export function ProposeEventForm() {
  const router = useRouter();
  const [titlu, setTitlu] = useState("");
  const [descriere, setDescriere] = useState("");
  const [tip, setTip] = useState("networking");
  const [online, setOnline] = useState(false);
  const [locatie, setLocatie] = useState("");
  const [linkExtern, setLinkExtern] = useState("");
  const [dataInceput, setDataInceput] = useState("");
  const [oraInceput, setOraInceput] = useState("");
  const [dataSfarsit, setDataSfarsit] = useState("");
  const [oraSfarsit, setOraSfarsit] = useState("");
  const [capacitate, setCapacitate] = useState("");
  const [seTrimite, setSeTrimite] = useState(false);
  const [eroare, setEroare] = useState<string | null>(null);
  const [trimis, setTrimis] = useState(false);

  async function trimite() {
    if (!titlu.trim() || !descriere.trim() || !dataInceput) {
      setEroare("Titlul, descrierea și data de început sunt obligatorii.");
      return;
    }
    const inceputIso = isoDinRomania(dataInceput, oraInceput || null);
    const sfarsitIso = dataSfarsit ? isoDinRomania(dataSfarsit, oraSfarsit || null) : null;
    if (!inceputIso || (dataSfarsit && !sfarsitIso)) {
      setEroare("Data nu e validă. Verifică ziua, luna și anul.");
      return;
    }
    if (sfarsitIso && sfarsitIso < inceputIso) {
      setEroare("Data de sfârșit e înaintea datei de început.");
      return;
    }
    setSeTrimite(true);
    setEroare(null);
    try {
      const res = await fetch("/api/evenimente/propune", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titlu,
          descriere,
          tip,
          online,
          locatie: locatie || null,
          link_extern: linkExtern || null,
          data_inceput: inceputIso,
          are_ora_inceput: Boolean(oraInceput),
          data_sfarsit: sfarsitIso,
          are_ora_sfarsit: Boolean(oraSfarsit),
          capacitate: capacitate ? Number(capacitate) : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setEroare(json?.error ?? "Nu am putut trimite propunerea.");
        return;
      }
      setTrimis(true);
    } finally {
      setSeTrimite(false);
    }
  }

  if (trimis) {
    return (
      <div className="block-base flex flex-col items-center gap-3 p-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-teal" />
        <p className="text-lg font-semibold text-ink">Propunere trimisă!</p>
        <p className="max-w-sm text-sm text-ink-soft">
          Un administrator o va analiza și, dacă e potrivită, o va publica pe pagina de Evenimente.
        </p>
        <Button variant="secondary" onClick={() => router.push("/evenimente")}>
          Înapoi la Evenimente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <FieldGroup>
        <div>
          <Label required>Titlu</Label>
          <Input value={titlu} onChange={(e) => setTitlu(e.target.value)} placeholder="Titlul evenimentului" />
        </div>
        <div>
          <Label required>Descriere</Label>
          <Textarea
            value={descriere}
            onChange={(e) => setDescriere(e.target.value)}
            className="min-h-[160px]"
            placeholder="Despre ce e evenimentul, cine ar trebui să participe..."
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Tip</Label>
            <Select value={tip} onChange={(e) => setTip(e.target.value)}>
              {TIPURI.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Capacitate (opțional)</Label>
            <Input
              type="number"
              min={1}
              value={capacitate}
              onChange={(e) => setCapacitate(e.target.value)}
              placeholder="ex: 50"
            />
          </div>
        </div>
      </FieldGroup>

      <FieldGroup title="Când și unde">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="pr-inceput" required>Începe</Label>
            <DataOraInput id="pr-inceput" data={dataInceput} ora={oraInceput} onData={setDataInceput} onOra={setOraInceput} />
          </div>
          <div>
            <Label htmlFor="pr-sfarsit">Se termină (opțional)</Label>
            <DataOraInput id="pr-sfarsit" data={dataSfarsit} ora={oraSfarsit} onData={setDataSfarsit} onOra={setOraSfarsit} />
          </div>
        </div>
        <FieldHint>Ora e opțională, în format de 24 de ore.</FieldHint>

        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={online} onChange={(e) => setOnline(e.target.checked)} className="h-4 w-4" />
          Eveniment online
        </label>

        {!online && (
          <div>
            <Label>Locație</Label>
            <Input value={locatie} onChange={(e) => setLocatie(e.target.value)} placeholder="Adresă sau oraș" />
          </div>
        )}

        <div>
          <Label>Link extern (opțional)</Label>
          <Input
            value={linkExtern}
            onChange={(e) => setLinkExtern(e.target.value)}
            placeholder="Link de înscriere, Zoom, Facebook event..."
          />
        </div>
      </FieldGroup>

      <FieldHint>
        Propunerea ta ajunge doar la administratori — nu apare public decât dacă e aprobată și publicată.
      </FieldHint>

      <FieldError>{eroare}</FieldError>

      <Button variant="seal" onClick={trimite} disabled={seTrimite}>
        {seTrimite ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Trimite propunerea
      </Button>
    </div>
  );
}
