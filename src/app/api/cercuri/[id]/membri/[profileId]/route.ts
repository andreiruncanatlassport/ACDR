import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mesajEroareSigur } from "@/lib/api-errors";
import { creeazaNotificare } from "@/lib/notifications";

/**
 * Liderul (sau adminul) accepta o cerere ori face pe cineva co-lider.
 * Body: { actiune: "accepta" | "lider" }
 * RLS + trigger-ul circle_members_protect se asigura ca doar liderul/adminul
 * poate schimba statusul sau rolul.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; profileId: string }> }
) {
  const { id: circleId, profileId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const actiune = body?.actiune;
  if (actiune !== "accepta" && actiune !== "lider") {
    return NextResponse.json({ error: "Acțiune necunoscută." }, { status: 400 });
  }

  const modificari = actiune === "accepta" ? { status: "activ" } : { rol: "lider" };
  let interogare = supabase
    .from("circle_members")
    .update(modificari as never)
    .eq("circle_id", circleId)
    .eq("profile_id", profileId);
  // Doar un membru deja activ poate deveni lider.
  if (actiune === "lider") interogare = interogare.eq("status", "activ");
  const { data, error } = await interogare
    .select("status, rol")
    .maybeSingle();

  if (error) {
    const complet = error.code === "P0001";
    return NextResponse.json(
      { error: mesajEroareSigur(error, "PATCH /api/cercuri/[id]/membri/[profileId]", { P0001: "Cercul este complet." }) },
      { status: complet ? 409 : 500 }
    );
  }

  const rand = data as { status: string; rol: string } | null;
  const aplicat = actiune === "accepta" ? rand?.status === "activ" : rand?.rol === "lider";
  if (!aplicat) {
    return NextResponse.json({ error: "Doar liderul cercului poate face această schimbare." }, { status: 403 });
  }

  if (actiune === "accepta") {
    const { data: cerc } = await supabase.from("circles").select("nume").eq("id", circleId).maybeSingle();
    await creeazaNotificare({
      profileId,
      tip: "cerc_acceptat",
      titlu: `Ai intrat în ${(cerc as { nume: string } | null)?.nume ?? "cerc"}`,
      link: `/cercuri/${circleId}`,
    });
  }

  return NextResponse.json({ data: { ok: true } });
}

/** Liderul respinge o cerere sau scoate un membru din cerc. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; profileId: string }> }
) {
  const { id: circleId, profileId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });

  const { data, error } = await supabase
    .from("circle_members")
    .delete()
    .eq("circle_id", circleId)
    .eq("profile_id", profileId)
    .select("profile_id");

  if (error) {
    return NextResponse.json({ error: mesajEroareSigur(error, "DELETE /api/cercuri/[id]/membri/[profileId]") }, { status: 500 });
  }
  if (!data || (data as unknown[]).length === 0) {
    return NextResponse.json({ error: "Doar liderul cercului poate face această schimbare." }, { status: 403 });
  }
  return NextResponse.json({ data: { ok: true } });
}
