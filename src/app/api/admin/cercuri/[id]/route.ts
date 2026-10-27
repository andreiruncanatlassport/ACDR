import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mesajEroareSigur } from "@/lib/api-errors";

async function verificaAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, eroare: NextResponse.json({ error: "Neautentificat." }, { status: 401 }) };
  const { data: profil } = await supabase.from("profiles").select("rol").eq("id", user.id).maybeSingle();
  const rol = (profil as { rol: string } | null)?.rol;
  if (rol !== "admin" && rol !== "moderator") {
    return { supabase, user, eroare: NextResponse.json({ error: "Acces interzis." }, { status: 403 }) };
  }
  return { supabase, user, eroare: null };
}

/** Activeaza / dezactiveaza un cerc: { activ: boolean }. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, eroare } = await verificaAdmin();
  if (eroare) return eroare;

  const body = await request.json().catch(() => ({}));
  const { error } = await supabase.from("circles").update({ activ: Boolean(body?.activ) } as never).eq("id", id);
  if (error) return NextResponse.json({ error: mesajEroareSigur(error, "PATCH /api/admin/cercuri/[id]") }, { status: 500 });

  await supabase.from("admin_audit_log").insert({
    admin_id: user!.id,
    actiune: body?.activ ? "cerc_activat" : "cerc_dezactivat",
    detalii: { circle_id: id },
  } as never);
  return NextResponse.json({ data: { ok: true } });
}

/** Sterge cercul cu tot ce tine de el (membri, intalniri, mesaje). */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, eroare } = await verificaAdmin();
  if (eroare) return eroare;

  const { error } = await supabase.from("circles").delete().eq("id", id);
  if (error) return NextResponse.json({ error: mesajEroareSigur(error, "DELETE /api/admin/cercuri/[id]") }, { status: 500 });

  await supabase.from("admin_audit_log").insert({
    admin_id: user!.id,
    actiune: "cerc_sters",
    detalii: { circle_id: id },
  } as never);
  return NextResponse.json({ data: { ok: true } });
}
