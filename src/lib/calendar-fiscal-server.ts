import type { createClient } from "@/lib/supabase/server";
import {
  SELECT_OBLIGATII,
  cheieTermen,
  genereazaTermene,
  normalizeazaProfil,
  type ObligatieFiscala,
  type ProfilFiscal,
  type Termen,
} from "@/lib/calendar-fiscal";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export interface CalendarFirma {
  profil: ProfilFiscal;
  /** false = proprietarul inca n-a completat profilul fiscal */
  salvat: boolean;
  termene: Termen[];
  /** chei cheieTermen(obligation_id, scadenta) ale termenelor bifate */
  depuse: Set<string>;
}

/**
 * Incarca termenele unei firme intre `de` si `pana`, cu bifele "depus".
 * `tvaActiv` (din datele ANAF) e folosit doar ca valoare propusa cand profilul
 * nu a fost completat inca.
 */
export async function incarcaCalendar(
  supabase: Supabase,
  companyId: string,
  de: string,
  pana: string,
  tvaActiv: boolean | null
): Promise<CalendarFirma> {
  const [{ data: obligatiiData }, { data: profilData }, { data: depuseData }] = await Promise.all([
    supabase.from("fiscal_obligations").select(SELECT_OBLIGATII).eq("activ", true),
    supabase.from("company_fiscal_profiles").select("*").eq("company_id", companyId).maybeSingle(),
    supabase
      .from("fiscal_deadline_done")
      .select("obligation_id, scadenta")
      .eq("company_id", companyId)
      .gte("scadenta", de)
      .lte("scadenta", pana),
  ]);

  const salvat = Boolean(profilData);
  const profil = salvat
    ? normalizeazaProfil(profilData as Partial<ProfilFiscal>)
    : normalizeazaProfil({ tva: tvaActiv ? "trimestrial" : "neplatitor" });

  const termene = genereazaTermene((obligatiiData as ObligatieFiscala[]) ?? [], profil, de, pana);
  const depuse = new Set(
    ((depuseData as { obligation_id: string; scadenta: string }[]) ?? []).map((d) => cheieTermen(d.obligation_id, d.scadenta))
  );

  return { profil, salvat, termene, depuse };
}
