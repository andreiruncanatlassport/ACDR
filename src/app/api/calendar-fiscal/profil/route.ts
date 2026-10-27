import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mesajEroareSigur } from "@/lib/api-errors";
import { normalizeazaProfil } from "@/lib/calendar-fiscal";

/** Salveaza profilul fiscal al unei firme proprii. Body: { company_id, ...ProfilFiscal } */
export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const companyId = String(body?.company_id ?? "");
  if (!companyId) return NextResponse.json({ error: "Alege firma." }, { status: 400 });

  const { data: firma } = await supabase
    .from("companies")
    .select("id")
    .eq("id", companyId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!firma) return NextResponse.json({ error: "Poți completa profilul fiscal doar pentru firmele tale." }, { status: 403 });

  const profil = normalizeazaProfil(body);
  const { error } = await supabase
    .from("company_fiscal_profiles")
    .upsert({ company_id: companyId, ...profil, updated_at: new Date().toISOString() } as never, {
      onConflict: "company_id",
    });

  if (error) return NextResponse.json({ error: mesajEroareSigur(error, "PUT /api/calendar-fiscal/profil") }, { status: 500 });
  return NextResponse.json({ data: profil });
}
