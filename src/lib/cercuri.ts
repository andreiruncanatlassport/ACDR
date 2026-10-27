/** Tipuri si utilitare comune pentru Cercuri (vezi migratia 0040). */

export interface Cerc {
  id: string;
  nume: string;
  oras: string;
  judet_cod: string | null;
  domeniu: string | null;
  ritm: string | null;
  descriere: string | null;
  max_membri: number;
  activ: boolean;
}

export interface MembruCerc {
  profile_id: string;
  nume_complet: string;
  avatar_url: string | null;
  titlu: string | null;
  firma: string | null;
  rol: "lider" | "membru";
  status: "cerere" | "activ";
  mesaj: string | null;
  created_at: string;
}

export interface IntalnireCerc {
  id: string;
  circle_id: string;
  starts_at: string;
  loc: string | null;
  tema: string | null;
}

export interface AngajamentCerc {
  id: string;
  profile_id: string;
  text: string;
  luna: string;
  facut: boolean;
}

export interface MesajCerc {
  id: string;
  profile_id: string;
  continut: string;
  created_at: string;
}

export const SELECT_CERC = "id, nume, oras, judet_cod, domeniu, ritm, descriere, max_membri, activ";

/** Prima zi a lunii curente (ora Romaniei), ca "YYYY-MM-01". */
export function lunaCurenta(): string {
  const azi = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Bucharest",
    year: "numeric",
    month: "2-digit",
  }).format(new Date());
  return `${azi.slice(0, 7)}-01`;
}

export function initiale(nume: string): string {
  const parti = nume.trim().split(/\s+/).filter(Boolean);
  if (parti.length === 0) return "?";
  const prima = parti[0][0] ?? "";
  const ultima = parti.length > 1 ? parti[parti.length - 1][0] : "";
  return (prima + ultima).toUpperCase();
}

/** "joi, 6 noiembrie · 19:00" in ora Romaniei. */
export function formatIntalnire(iso: string): string {
  const d = new Date(iso);
  const zi = new Intl.DateTimeFormat("ro-RO", {
    timeZone: "Europe/Bucharest",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
  const ora = new Intl.DateTimeFormat("ro-RO", {
    timeZone: "Europe/Bucharest",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
  return `${zi} · ${ora}`;
}

export function textCurat(valoare: unknown, max: number): string {
  return String(valoare ?? "").trim().slice(0, max);
}
