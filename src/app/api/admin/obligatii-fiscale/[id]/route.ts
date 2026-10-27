import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mesajEroareSigur } from "@/lib/api-errors";

/**
 * Adminul corecteaza o obligatie fiscala cand se schimba legea:
 * { activ?, zi?, luna_anuala?, denumire?, descriere? }
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Neautentificat." }, { status: 401 });

  const { data: profil } = await supabase.from("profiles").select("rol").eq("id", user.id).maybeSingle();
  const rol = (profil as { rol: string } | null)?.rol;
  if (rol !== "admin" && rol !== "moderator") return NextResponse.json({ error: "Acces interzis." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const modificari: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body?.activ === "boolean") modificari.activ = body.activ;
  if (body?.zi !== undefined) {
    const zi = Number(body.zi);
    if (!Number.isInteger(zi) || zi < 1 || zi > 31) return NextResponse.json({ error: "Ziua trebuie să fie între 1 și 31." }, { status: 400 });
    modificari.zi = zi;
  }
  if (body?.luna_anuala !== undefined && body.luna_anuala !== null) {
    const luna = Number(body.luna_anuala);
    if (!Number.isInteger(luna) || luna < 1 || luna > 12) return NextResponse.json({ error: "Luna trebuie să fie între 1 și 12." }, { status: 400 });
    modificari.luna_anuala = luna;
  }
  if (typeof body?.denumire === "string" && body.denumire.trim()) modificari.denumire = body.denumire.trim().slice(0, 160);
  if (typeof body?.descriere === "string") modificari.descriere = body.descriere.trim().slice(0, 500) || null;

  const { error } = await supabase.from("fiscal_obligations").update(modificari as never).eq("id", id);
  if (error) return NextResponse.json({ error: mesajEroareSigur(error, "PATCH /api/admin/obligatii-fiscale/[id]") }, { status: 500 });

  await supabase.from("admin_audit_log").insert({
    admin_id: user.id,
    actiune: "obligatie_fiscala_modificata",
    detalii: { obligation_id: id, ...modificari },
  } as never);
  return NextResponse.json({ data: { ok: true } });
}
