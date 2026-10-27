import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  SELECT_OBLIGATII,
  adaugaZile,
  aziRomania,
  genereazaIcs,
  genereazaTermene,
  normalizeazaProfil,
  type ObligatieFiscala,
  type ProfilFiscal,
} from "@/lib/calendar-fiscal";

/**
 * Descarca termenele firmei pe urmatoarele 12 luni ca fisier .ics, ca sa le
 * importe in Google Calendar, Outlook sau calendarul telefonului.
 * GET /api/calendar-fiscal/ics?firma=<company_id>
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });

  const companyId = new URL(request.url).searchParams.get("firma") ?? "";
  const { data: firmaData } = await supabase
    .from("companies")
    .select("id, denumire")
    .eq("id", companyId)
    .eq("owner_id", user.id)
    .maybeSingle();
  const firma = firmaData as { id: string; denumire: string } | null;
  if (!firma) return NextResponse.json({ error: "Firma nu a fost găsită." }, { status: 404 });

  const [{ data: obligatiiData }, { data: profilData }] = await Promise.all([
    supabase.from("fiscal_obligations").select(SELECT_OBLIGATII).eq("activ", true),
    supabase.from("company_fiscal_profiles").select("*").eq("company_id", firma.id).maybeSingle(),
  ]);

  const azi = aziRomania();
  const termene = genereazaTermene(
    (obligatiiData as ObligatieFiscala[]) ?? [],
    normalizeazaProfil(profilData as Partial<ProfilFiscal> | null),
    azi,
    adaugaZile(azi, 366)
  );

  const ics = genereazaIcs(termene, firma.denumire, firma.id);
  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="calendar-fiscal-acdr.ics"',
      "Cache-Control": "no-store",
    },
  });
}
