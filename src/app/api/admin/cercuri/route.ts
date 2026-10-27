import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { mesajEroareSigur } from "@/lib/api-errors";
import { creeazaNotificare } from "@/lib/notifications";
import { textCurat } from "@/lib/cercuri";

/**
 * Adminul/moderatorul creeaza un cerc si ii numeste liderul (dupa emailul
 * personal al unui cont existent).
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Neautentificat." }, { status: 401 });

  const { data: profil } = await supabase.from("profiles").select("rol").eq("id", user.id).maybeSingle();
  const rol = (profil as { rol: string } | null)?.rol;
  if (rol !== "admin" && rol !== "moderator") {
    return NextResponse.json({ error: "Doar administratorii pot crea cercuri." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const nume = textCurat(body?.nume, 80);
  const oras = textCurat(body?.oras, 60);
  const emailLider = textCurat(body?.email_lider, 200).toLowerCase();
  if (nume.length < 3 || oras.length < 2 || !emailLider) {
    return NextResponse.json({ error: "Numele cercului, orașul și emailul liderului sunt obligatorii." }, { status: 400 });
  }
  const maxMembri = Math.min(12, Math.max(3, Number(body?.max_membri) || 8));

  // Cautam liderul cu service_role: profilele altor persoane nu sunt vizibile prin RLS.
  const admin = createServiceRoleClient();
  const { data: liderData } = await admin
    .from("profiles")
    .select("id, activ")
    // "_" si "%" sunt wildcard-uri in ILIKE: le scapam, ca sa potrivim exact emailul.
    .ilike("email_personal", emailLider.replace(/[\\%_]/g, (c) => "\\" + c))
    .limit(1)
    .maybeSingle();
  const lider = liderData as { id: string; activ: boolean } | null;
  if (!lider || !lider.activ) {
    return NextResponse.json({ error: "Nu există un cont activ cu acest email." }, { status: 404 });
  }

  const { data: cerc, error } = await supabase
    .from("circles")
    .insert({
      nume,
      oras,
      judet_cod: textCurat(body?.judet_cod, 3) || null,
      domeniu: textCurat(body?.domeniu, 80) || null,
      ritm: textCurat(body?.ritm, 80) || null,
      descriere: textCurat(body?.descriere, 1000) || null,
      max_membri: maxMembri,
      created_by: user.id,
    } as never)
    .select("id")
    .single();

  if (error || !cerc) {
    return NextResponse.json({ error: mesajEroareSigur(error, "POST /api/admin/cercuri") }, { status: 500 });
  }
  const circleId = (cerc as { id: string }).id;

  const { error: errLider } = await supabase
    .from("circle_members")
    .insert({ circle_id: circleId, profile_id: lider.id, rol: "lider", status: "activ" } as never);
  if (errLider) {
    await supabase.from("circles").delete().eq("id", circleId);
    return NextResponse.json({ error: mesajEroareSigur(errLider, "POST /api/admin/cercuri (lider)") }, { status: 500 });
  }

  await supabase.from("admin_audit_log").insert({
    admin_id: user.id,
    actiune: "cerc_creat",
    detalii: { circle_id: circleId, nume, lider_id: lider.id },
  } as never);

  if (lider.id !== user.id) {
    await creeazaNotificare({
      profileId: lider.id,
      tip: "cerc_acceptat",
      titlu: `Ești liderul cercului ${nume}`,
      mesaj: "Poți primi membri și programa întâlnirile din pagina cercului.",
      link: `/cercuri/${circleId}`,
    });
  }

  return NextResponse.json({ data: { id: circleId } });
}
