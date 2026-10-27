/**
 * Calendarul fiscal: din lista de obligatii (tabela fiscal_obligations) si
 * profilul fiscal al firmei, calculeaza scadentele concrete.
 *
 * Regula zilelor nelucratoare: daca termenul cade sambata, duminica sau intr-o
 * sarbatoare legala, se muta pe prima zi lucratoare urmatoare.
 *
 * Toate datele sunt siruri "YYYY-MM-DD" (fara ore), ca sa nu depindem de fusul
 * orar al serverului.
 */

export type Conditie =
  | "toti"
  | "angajator"
  | "tva_lunar"
  | "tva_trimestrial"
  | "micro"
  | "profit"
  | "intracomunitar"
  | "saft_lunar"
  | "saft_trimestrial"
  | "cladiri_auto"
  | "retineri_la_sursa";

export interface ObligatieFiscala {
  id: string;
  cod: string;
  formular: string | null;
  denumire: string;
  descriere: string | null;
  frecventa: "lunar" | "trimestrial" | "anual";
  zi: number;
  luna_anuala: number | null;
  decalaj_luni: number;
  trimestre: number[];
  perioada_an_anterior: boolean;
  conditie: Conditie;
  activ: boolean;
  ordine: number;
}

export interface ProfilFiscal {
  angajator: boolean;
  tva: "neplatitor" | "lunar" | "trimestrial";
  impozit: "micro" | "profit";
  intracomunitar: boolean;
  saft: "nu" | "lunar" | "trimestrial";
  cladiri_auto: boolean;
  retineri_la_sursa: boolean;
}

export interface Termen {
  obligatie: ObligatieFiscala;
  /** Data la care trebuie depus (deja mutata pe zi lucratoare). */
  scadenta: string;
  /** Data din lege, inainte de mutare (egala cu scadenta daca e zi lucratoare). */
  scadentaLegala: string;
  /** Perioada raportata, ex: "septembrie 2026", "T3 2026", "anul 2025". */
  perioada: string;
}

export const SELECT_OBLIGATII =
  "id, cod, formular, denumire, descriere, frecventa, zi, luna_anuala, decalaj_luni, trimestre, perioada_an_anterior, conditie, activ, ordine";

export const PROFIL_IMPLICIT: ProfilFiscal = {
  angajator: false,
  tva: "neplatitor",
  impozit: "micro",
  intracomunitar: false,
  saft: "trimestrial",
  cladiri_auto: false,
  retineri_la_sursa: false,
};

export const LUNI = [
  "ianuarie", "februarie", "martie", "aprilie", "mai", "iunie",
  "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie",
];

// ---------------------------------------------------------------------------
// Date calendaristice
// ---------------------------------------------------------------------------

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function formatIso(an: number, luna: number, zi: number): string {
  return `${an}-${pad(luna)}-${pad(zi)}`;
}

function zileInLuna(an: number, luna: number): number {
  return new Date(Date.UTC(an, luna, 0)).getUTCDate();
}

function dinIso(iso: string): Date {
  const [a, l, z] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, l - 1, z));
}

function inIso(d: Date): string {
  return formatIso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

export function adaugaZile(iso: string, zile: number): string {
  const d = dinIso(iso);
  d.setUTCDate(d.getUTCDate() + zile);
  return inIso(d);
}

/** Data de azi in Romania, ca "YYYY-MM-DD". */
export function aziRomania(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Bucharest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Paștele ortodox (calendar gregorian), valabil pentru 1900–2099. */
export function pasteOrtodox(an: number): string {
  const a = an % 4;
  const b = an % 7;
  const c = an % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const luna = Math.floor((d + e + 114) / 31);
  const zi = ((d + e + 114) % 31) + 1;
  // data iuliana + 13 zile = data gregoriana
  return adaugaZile(formatIso(an, luna, zi), 13);
}

const cacheSarbatori = new Map<number, Set<string>>();

/** Sărbătorile legale din România (Codul muncii, art. 139). */
export function sarbatoriLegale(an: number): Set<string> {
  const din = cacheSarbatori.get(an);
  if (din) return din;
  const paste = pasteOrtodox(an);
  const zile = new Set<string>([
    formatIso(an, 1, 1),
    formatIso(an, 1, 2),
    formatIso(an, 1, 6),
    formatIso(an, 1, 7),
    formatIso(an, 1, 24),
    adaugaZile(paste, -2), // Vinerea Mare
    paste,
    adaugaZile(paste, 1),
    formatIso(an, 5, 1),
    formatIso(an, 6, 1),
    adaugaZile(paste, 49), // Rusalii
    adaugaZile(paste, 50),
    formatIso(an, 8, 15),
    formatIso(an, 11, 30),
    formatIso(an, 12, 1),
    formatIso(an, 12, 25),
    formatIso(an, 12, 26),
  ]);
  cacheSarbatori.set(an, zile);
  return zile;
}

export function esteZiLucratoare(iso: string): boolean {
  const zi = dinIso(iso).getUTCDay();
  if (zi === 0 || zi === 6) return false;
  return !sarbatoriLegale(Number(iso.slice(0, 4))).has(iso);
}

export function primaZiLucratoare(iso: string): string {
  let d = iso;
  while (!esteZiLucratoare(d)) d = adaugaZile(d, 1);
  return d;
}

// ---------------------------------------------------------------------------
// Ce obligatii se aplica firmei
// ---------------------------------------------------------------------------

export function seAplica(o: ObligatieFiscala, p: ProfilFiscal): boolean {
  switch (o.conditie) {
    case "toti":
      return true;
    case "angajator":
      return p.angajator;
    case "tva_lunar":
      return p.tva === "lunar";
    case "tva_trimestrial":
      return p.tva === "trimestrial";
    case "micro":
      return p.impozit === "micro";
    case "profit":
      return p.impozit === "profit";
    case "intracomunitar":
      return p.intracomunitar && p.tva !== "neplatitor";
    case "saft_lunar":
      return p.saft === "lunar";
    case "saft_trimestrial":
      return p.saft === "trimestrial";
    case "cladiri_auto":
      return p.cladiri_auto;
    case "retineri_la_sursa":
      return p.retineri_la_sursa;
    default:
      return false;
  }
}

/** Data din lege: ziua `zi` din luna data, limitata la ultima zi a lunii. */
function dataLegala(an: number, luna: number, zi: number): string {
  return formatIso(an, luna, Math.min(zi, zileInLuna(an, luna)));
}

/** Adauga `n` luni la (an, luna) si intoarce noua pereche. */
function plusLuni(an: number, luna: number, n: number): [number, number] {
  const total = an * 12 + (luna - 1) + n;
  return [Math.floor(total / 12), (total % 12) + 1];
}

function termeneObligatie(o: ObligatieFiscala, de: string, pana: string): Termen[] {
  const anDe = Number(de.slice(0, 4));
  const anPana = Number(pana.slice(0, 4));
  const rezultat: Termen[] = [];

  const adauga = (legala: string, perioada: string) => {
    const scadenta = primaZiLucratoare(legala);
    if (scadenta >= de && scadenta <= pana) {
      rezultat.push({ obligatie: o, scadenta, scadentaLegala: legala, perioada });
    }
  };

  if (o.frecventa === "lunar") {
    for (let an = anDe - 1; an <= anPana; an++) {
      for (let luna = 1; luna <= 12; luna++) {
        const [anS, lunaS] = plusLuni(an, luna, o.decalaj_luni);
        adauga(dataLegala(anS, lunaS, o.zi), `${LUNI[luna - 1]} ${an}`);
      }
    }
  } else if (o.frecventa === "trimestrial") {
    for (let an = anDe - 1; an <= anPana; an++) {
      for (let t = 1; t <= 4; t++) {
        if (!o.trimestre.includes(t)) continue;
        const [anS, lunaS] = plusLuni(an, t * 3, o.decalaj_luni);
        adauga(dataLegala(anS, lunaS, o.zi), `T${t} ${an}`);
      }
    }
  } else if (o.luna_anuala) {
    for (let an = anDe; an <= anPana + 1; an++) {
      const perioada = o.perioada_an_anterior ? `anul ${an - 1}` : `anul ${an}`;
      adauga(dataLegala(an, o.luna_anuala, o.zi), perioada);
    }
  }

  return rezultat;
}

/** Toate scadentele firmei intre `de` si `pana` (inclusiv), in ordine. */
export function genereazaTermene(
  obligatii: ObligatieFiscala[],
  profil: ProfilFiscal,
  de: string,
  pana: string
): Termen[] {
  return obligatii
    .filter((o) => o.activ && seAplica(o, profil))
    .flatMap((o) => termeneObligatie(o, de, pana))
    .sort((a, b) => a.scadenta.localeCompare(b.scadenta) || a.obligatie.ordine - b.obligatie.ordine);
}

export function cheieTermen(obligationId: string, scadenta: string): string {
  return `${obligationId}|${scadenta}`;
}

/** "25 noiembrie" sau "25 noiembrie 2027" daca e alt an decat cel de referinta. */
export function formatData(iso: string, anReferinta?: number): string {
  const [a, l, z] = iso.split("-").map(Number);
  const baza = `${z} ${LUNI[l - 1]}`;
  return anReferinta && a !== anReferinta ? `${baza} ${a}` : baza;
}

export function zileRamase(azi: string, scadenta: string): number {
  return Math.round((dinIso(scadenta).getTime() - dinIso(azi).getTime()) / 86_400_000);
}

export function normalizeazaProfil(raw: Partial<ProfilFiscal> | null | undefined): ProfilFiscal {
  const p = { ...PROFIL_IMPLICIT, ...(raw ?? {}) };
  return {
    angajator: Boolean(p.angajator),
    tva: ["lunar", "trimestrial"].includes(p.tva) ? p.tva : "neplatitor",
    impozit: p.impozit === "profit" ? "profit" : "micro",
    intracomunitar: Boolean(p.intracomunitar),
    saft: ["nu", "lunar"].includes(p.saft) ? p.saft : "trimestrial",
    cladiri_auto: Boolean(p.cladiri_auto),
    retineri_la_sursa: Boolean(p.retineri_la_sursa),
  };
}

// ---------------------------------------------------------------------------
// Export .ics (iCalendar)
// ---------------------------------------------------------------------------

function escapeIcs(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Liniile mai lungi de 75 de octeti se impart, cum cere RFC 5545. */
function pliaza(linie: string): string {
  const bytes = new TextEncoder().encode(linie);
  if (bytes.length <= 75) return linie;
  const parti: string[] = [];
  let curenta = "";
  let lungime = 0;
  for (const ch of linie) {
    const l = new TextEncoder().encode(ch).length;
    if (lungime + l > (parti.length === 0 ? 75 : 74)) {
      parti.push(curenta);
      curenta = "";
      lungime = 0;
    }
    curenta += ch;
    lungime += l;
  }
  parti.push(curenta);
  return parti.join("\r\n ");
}

export function genereazaIcs(termene: Termen[], denumireFirma: string, companyId: string): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const linii = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ACDR//Calendar fiscal//RO",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcs(`Calendar fiscal — ${denumireFirma}`)}`,
  ];
  for (const t of termene) {
    const start = t.scadenta.replace(/-/g, "");
    const end = adaugaZile(t.scadenta, 1).replace(/-/g, "");
    const titlu = t.obligatie.formular ? `${t.obligatie.formular} · ${t.obligatie.denumire}` : t.obligatie.denumire;
    linii.push(
      "BEGIN:VEVENT",
      `UID:${t.obligatie.cod}-${start}-${companyId}@acdr`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${end}`,
      `SUMMARY:${escapeIcs(`${titlu} (${t.perioada})`)}`,
      `DESCRIPTION:${escapeIcs(`${denumireFirma}. ${t.obligatie.descriere ?? ""}`.trim())}`,
      "BEGIN:VALARM",
      "TRIGGER:-P3D",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeIcs(titlu)}`,
      "END:VALARM",
      "END:VEVENT"
    );
  }
  linii.push("END:VCALENDAR");
  return linii.map(pliaza).join("\r\n") + "\r\n";
}
