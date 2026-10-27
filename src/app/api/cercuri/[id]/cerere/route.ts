import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { mesajEroareSigur } from "@/lib/api-errors";
import { creeazaNotificare } from "@/lib/notifications";
import { textCurat } from "@/lib/cercuri";

/** Cerere de intrare intr-un cerc. Doar membrii verificati de admin pot cere loc. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: circleId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });

  const { data: profil } = await supabase
    .from("profiles")
    .select("nume_complet, stare_verificare")
    .eq("id", user.id)
    .maybeSingle();
  const p = profil as { nume_complet: string; stare_verificare: string } | null;
  if (p?.stare_verificare !== "verificat") {
    return NextResponse.json(
      { error: "Poți cere loc într-un cerc după ce contul tău e verificat de un administrator." },
      { status: 403 }
    );
  }

  const { data: cercData } = await supabase.from("circles").select("id, nume, activ").eq("id", circleId).maybeSingle();
  const cerc = cercData as { id: string; nume: string; activ: boolean } | null;
  if (!cerc || !cerc.activ) return NextResponse.json({ error: "Cercul nu mai primește membri." }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const mesaj = textCurat(body?.mesaj, 500) || null;

  const { error } = await supabase
    .from("circle_members")
    .insert({ circle_id: circleId, profile_id: user.id, status: "cerere", rol: "membru", mesaj } as never);

  if (error) {
    const duplicat = error.code === "23505";
    return NextResponse.json(
      { error: mesajEroareSigur(error, "POST /api/cercuri/[id]/cerere", { "23505": "Ai cerut deja loc în acest cerc." }) },
      { status: duplicat ? 409 : 500 }
    );
  }

  // Anunta liderul (sau liderii) cercului.
  const admin = createServiceRoleClient();
  const { data: lideri } = await admin
    .from("circle_members")
    .select("profile_id")
    .eq("circle_id", circleId)
    .eq("rol", "lider")
    .eq("status", "activ");
  await Promise.all(
    ((lideri as { profile_id: string }[]) ?? []).map((l) =>
      creeazaNotificare({
        profileId: l.profile_id,
        tip: "cerc_cerere",
        titlu: `${p.nume_complet || "Un membru"} vrea să intre în ${cerc.nume}`,
        mesaj: mesaj ?? undefined,
        link: `/cercuri/${circleId}`,
      })
    )
  );

  return NextResponse.json({ data: { ok: true } });
}

/** Anuleaza cererea sau iese din cerc. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: circleId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });

  // Cercul nu poate ramane fara lider: ultimul lider activ nu poate pleca.
  const { data: euData } = await supabase
    .from("circle_members")
    .select("rol, status")
    .eq("circle_id", circleId)
    .eq("profile_id", user.id)
    .maybeSingle();
  const eu = euData as { rol: string; status: string } | null;
  if (eu?.rol === "lider" && eu.status === "activ") {
    const { count } = await supabase
      .from("circle_members")
      .select("profile_id", { count: "exact", head: true })
      .eq("circle_id", circleId)
      .eq("rol", "lider")
      .eq("status", "activ");
    if ((count ?? 0) <= 1) {
      return NextResponse.json(
        { error: "Ești singurul lider al cercului. Cere unui administrator să numească alt lider înainte să pleci." },
        { status: 409 }
      );
    }
  }

  const { error } = await supabase
    .from("circle_members")
    .delete()
    .eq("circle_id", circleId)
    .eq("profile_id", user.id);

  if (error) return NextResponse.json({ error: mesajEroareSigur(error, "DELETE /api/cercuri/[id]/cerere") }, { status: 500 });
  return NextResponse.json({ data: { ok: true } });
}
