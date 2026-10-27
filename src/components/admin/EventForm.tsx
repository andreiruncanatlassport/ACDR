"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, Loader2, Send, CalendarDays, Trash2, Crop, ImagePlus } from "lucide-react";
import { incarcaImagineSite } from "@/lib/upload";
import { Input, Label, Select, Textarea, FieldError, FieldHint, FieldGroup } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { DataOraInput } from "@/components/DataOraInput";
import { ImageCropper } from "@/components/ImageCropper";
import { isoDinRomania, parteDinIso } from "@/lib/evenimente-data";
import type { EventItem } from "@/types/database";

const TIP_OPTIUNI = [
  { id: "conferinta", label: "Conferință" },
  { id: "workshop", label: "Workshop" },
  { id: "networking", label: "Networking" },
  { id: "altul", label: "Altul" },
] as const;


export function EventForm({ initial }: { initial?: EventItem }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const editare = Boolean(initial);

  const [titlu, setTitlu] = useState(initial?.titlu ?? "");
  const [descriere, setDescriere] = useState(initial?.descriere ?? "");
  const [tip, setTip] = useState<string>(initial?.tip ?? "networking");
  const [locatie, setLocatie] = useState(initial?.locatie ?? "");
  const [online, setOnline] = useState(initial?.online ?? false);
  const [linkExtern, setLinkExtern] = useState(initial?.link_extern ?? "");
  const inceputInitial = parteDinIso(initial?.data_inceput);
  const sfarsitInitial = parteDinIso(initial?.data_sfarsit);
  const [dataInceput, setDataInceput] = useState(inceputInitial.data);
  const [oraInceput, setOraInceput] = useState(initial && initial.are_ora_inceput === false ? "" : inceputInitial.ora);
  const [dataSfarsit, setDataSfarsit] = useState(sfarsitInitial.data);
  const [oraSfarsit, setOraSfarsit] = useState(initial && initial.are_ora_sfarsit === false ? "" : sfarsitInitial.ora);
  const [capacitate, setCapacitate] = useState(initial?.capacitate?.toString() ?? "");
  const [imagineUrl, setImagineUrl] = useState(initial?.imagine_url ?? null);
  const [seIncarcaImagine, setSeIncarcaImagine] = useState(false);
  const [seSalveaza, setSeSalveaza] = useState(false);
  // Poza care se editeaza acum in fereastra de incadrare (fisier nou sau poza existenta).
  const [deIncadrat, setDeIncadrat] = useState<string | null>(null);
  const [eroare, setEroare] = useState<string | null>(null);

  async function incarcaImagine(fisier: File) {
    setSeIncarcaImagine(true);
    setEroare(null);
    try {
      const { publicUrl } = await incarcaImagineSite("evenimente", initial?.id ?? "temp", fisier);
      setImagineUrl(publicUrl);
    } catch (e) {
      setEroare(e instanceof Error ? e.message : "Eroare la încărcare.");
    } finally {
      setSeIncarcaImagine(false);
    }
  }

  function alegeFisier(fisier: File) {
    if (!fisier.type.startsWith("image/")) {
      setEroare("Fișierul trebuie să fie o imagine.");
      return;
    }
    // Originalul poate fi mare: dupa incadrare se salveaza la 1600 × 900, sub 1MB.
    if (fisier.size > 25 * 1024 * 1024) {
      setEroare("Imaginea e prea mare (max 25MB).");
      return;
    }
    setEroare(null);
    setDeIncadrat(URL.createObjectURL(fisier));
  }

  function inchideIncadrarea() {
    if (deIncadrat?.startsWith("blob:")) URL.revokeObjectURL(deIncadrat);
    setDeIncadrat(null);
  }

  async function salveaza(status: "draft" | "publicat") {
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
    setSeSalveaza(true);
    setEroare(null);
    try {
      const body = {
        titlu,
        descriere,
        tip,
        locatie: online ? null : locatie,
        online,
        link_extern: linkExtern || null,
        data_inceput: inceputIso,
        are_ora_inceput: Boolean(oraInceput),
        data_sfarsit: sfarsitIso,
        are_ora_sfarsit: Boolean(oraSfarsit),
        capacitate: capacitate ? Number(capacitate) : null,
        imagine_url: imagineUrl,
        status,
      };
      const res = await fetch(editare ? `/api/admin/evenimente/${initial!.id}` : "/api/admin/evenimente", {
        method: editare ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setEroare(json?.error ?? "Nu am putut salva evenimentul.");
        return;
      }
      router.push("/admin/evenimente");
      router.refresh();
    } finally {
      setSeSalveaza(false);
    }
  }

  async function sterge() {
    if (!initial || !confirm("Ștergi definitiv acest eveniment?")) return;
    await fetch(`/api/admin/evenimente/${initial.id}`, { method: "DELETE" });
    router.push("/admin/evenimente");
    router.refresh();
  }

  async function anuleaza() {
    if (!initial) return;
    await fetch(`/api/admin/evenimente/${initial.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "anulat" }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <FieldGroup>
        <div>
          <Label required>Titlu</Label>
          <Input value={titlu} onChange={(e) => setTitlu(e.target.value)} />
        </div>
        <div>
          <Label required>Descriere</Label>
          <Textarea
            value={descriere}
            onChange={(e) => setDescriere(e.target.value)}
            className="min-h-[180px]"
            placeholder="Paragrafele se despart printr-o linie goală."
          />
        </div>
        <div>
          <Label>Tip</Label>
          <Select value={tip} onChange={(e) => setTip(e.target.value)}>
            {TIP_OPTIUNI.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
      </FieldGroup>

      <FieldGroup title="Loc și dată">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="ev-inceput" required>Începe</Label>
            <DataOraInput id="ev-inceput" data={dataInceput} ora={oraInceput} onData={setDataInceput} onOra={setOraInceput} />
          </div>
          <div>
            <Label htmlFor="ev-sfarsit">Se termină (opțional)</Label>
            <DataOraInput id="ev-sfarsit" data={dataSfarsit} ora={oraSfarsit} onData={setDataSfarsit} onOra={setOraSfarsit} />
          </div>
        </div>
        <FieldHint>Ora e opțională și în format de 24 de ore (ex. 18:30). Fără oră, se afișează doar data.</FieldHint>

        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={online} onChange={(e) => setOnline(e.target.checked)} className="h-4 w-4 accent-[var(--color-seal)]" />
          Eveniment online
        </label>

        {!online && (
          <div>
            <Label>Locație</Label>
            <Input value={locatie ?? ""} onChange={(e) => setLocatie(e.target.value)} placeholder="Ex: Cluj-Napoca, Hotel X" />
          </div>
        )}

        <div>
          <Label>Link extern (înscriere/detalii)</Label>
          <Input value={linkExtern ?? ""} onChange={(e) => setLinkExtern(e.target.value)} placeholder="https://..." />
        </div>

        <div className="max-w-[200px]">
          <Label>Capacitate (opțional)</Label>
          <Input type="number" min={1} value={capacitate} onChange={(e) => setCapacitate(e.target.value)} />
          <FieldHint>Lasă gol pentru locuri nelimitate.</FieldHint>
        </div>
      </FieldGroup>

      <FieldGroup title="Imagine">
        <div className="flex flex-col gap-3">
          <div className="relative aspect-[16/9] w-full max-w-md overflow-hidden rounded-2xl bg-ink/5 ring-1 ring-inset ring-line">
            {imagineUrl ? (
              <Image src={imagineUrl} alt="" fill className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full items-center justify-center text-ink-soft/50">
                <CalendarDays className="h-8 w-8" strokeWidth={1.5} />
              </div>
            )}
            {seIncarcaImagine && (
              <div className="absolute inset-0 flex items-center justify-center bg-navy/50">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={seIncarcaImagine}>
              {imagineUrl ? <Camera className="h-4 w-4" /> : <ImagePlus className="h-4 w-4" />}
              {imagineUrl ? "Schimbă poza" : "Adaugă poză"}
            </Button>
            {imagineUrl && (
              <Button variant="secondary" onClick={() => setDeIncadrat(imagineUrl)} disabled={seIncarcaImagine}>
                <Crop className="h-4 w-4" /> Ajustează încadrarea
              </Button>
            )}
            {imagineUrl && (
              <Button variant="ghost" onClick={() => setImagineUrl(null)} disabled={seIncarcaImagine}>
                <Trash2 className="h-4 w-4" /> Scoate poza
              </Button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) alegeFisier(f);
              e.target.value = "";
            }}
          />
          <FieldHint>JPG sau PNG. După alegere poți muta și mări poza; se salvează la 16:9 (1600 × 900).</FieldHint>
        </div>
      </FieldGroup>

      {deIncadrat && (
        <ImageCropper
          src={deIncadrat}
          titlu="Încadrează poza evenimentului"
          onRenunta={inchideIncadrarea}
          onGata={async (fisier) => {
            await incarcaImagine(fisier);
            inchideIncadrarea();
          }}
        />
      )}

      <FieldError>{eroare}</FieldError>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={() => salveaza("draft")} disabled={seSalveaza}>
          Salvează ciornă
        </Button>
        <Button variant="seal" onClick={() => salveaza("publicat")} disabled={seSalveaza}>
          {seSalveaza ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Publică
        </Button>
        {editare && initial?.status !== "anulat" && (
          <Button variant="secondary" onClick={anuleaza}>
            Anulează evenimentul
          </Button>
        )}
        {editare && (
          <Button variant="danger" onClick={sterge} className="ml-auto">
            <Trash2 className="h-4 w-4" /> Șterge
          </Button>
        )}
      </div>
    </div>
  );
}
