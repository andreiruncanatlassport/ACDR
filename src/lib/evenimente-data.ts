/**
 * Date si ore pentru evenimente, mereu in ora Romaniei (Europe/Bucharest) si
 * in format de 24 de ore.
 *
 * De ce: serverul (Railway) ruleaza in UTC. Fara un fus orar explicit, ora
 * evenimentului s-ar afisa cu 2–3 ore in urma, iar „toLocaleTimeString” poate
 * da AM/PM pe unele sisteme. Aici fixam ambele lucruri.
 *
 * Fisierul nu foloseste nimic din browser sau server, deci merge in ambele.
 */

export const FUS_ORAR = "Europe/Bucharest";

/** Diferenta (in minute) dintre ora Romaniei si UTC la momentul dat. */
function decalajRomania(momentUtc: number): number {
  const parti = new Intl.DateTimeFormat("en-GB", {
    timeZone: FUS_ORAR,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(momentUtc));
  const v = (t: string) => Number(parti.find((p) => p.type === t)?.value);
  const caUtc = Date.UTC(v("year"), v("month") - 1, v("day"), v("hour"), v("minute"));
  return Math.round((caUtc - momentUtc) / 60000);
}

/**
 * Transforma o data („2026-11-14”) si o ora optionala („18:30”) din ora
 * Romaniei in ISO UTC, gata de salvat. Fara ora → miezul noptii, ora Romaniei.
 * Intoarce null daca data lipseste sau nu e valida.
 */
export function isoDinRomania(data: string, ora: string | null): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data);
  if (!m) return null;
  let h = 0;
  let min = 0;
  if (ora) {
    const o = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(ora);
    if (!o) return null;
    h = Number(o[1]);
    min = Number(o[2]);
  }
  const caUtc = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), h, min);
  // Respingem datele imposibile (ex. 30 februarie), pe care Date le-ar muta in luna urmatoare.
  if (new Date(caUtc).getUTCDate() !== Number(m[3])) return null;
  // Doua treceri: corect si in zilele cu schimbare de ora (martie/octombrie).
  let moment = caUtc - decalajRomania(caUtc) * 60000;
  moment = caUtc - decalajRomania(moment) * 60000;
  return new Date(moment).toISOString();
}

/** Inversul: din ISO UTC → { data: "2026-11-14", ora: "18:30" } in ora Romaniei. */
export function parteDinIso(iso: string | null | undefined): { data: string; ora: string } {
  if (!iso) return { data: "", ora: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { data: "", ora: "" };
  const parti = new Intl.DateTimeFormat("en-GB", {
    timeZone: FUS_ORAR,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const v = (t: string) => parti.find((p) => p.type === t)?.value ?? "";
  return { data: `${v("year")}-${v("month")}-${v("day")}`, ora: `${v("hour")}:${v("minute")}` };
}

/** „18:30” — ora in Romania, mereu 24h. */
export function formatOra(iso: string, locale = "ro-RO"): string {
  return new Date(iso).toLocaleTimeString(locale, {
    timeZone: FUS_ORAR,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

/** Data in Romania, cu optiunile date (zi, luna, an). */
export function formatData(iso: string, locale: string, optiuni: Intl.DateTimeFormatOptions): string {
  return new Date(iso).toLocaleDateString(locale, { timeZone: FUS_ORAR, ...optiuni });
}

/** Inceputul zilei de azi, ora Romaniei, ca ISO UTC (pentru filtrul „viitoare”). */
export function inceputulZileiDeAzi(): string {
  const azi = parteDinIso(new Date().toISOString()).data;
  return isoDinRomania(azi, null) ?? new Date().toISOString();
}
