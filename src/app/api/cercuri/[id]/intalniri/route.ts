import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mesajEroareSigur } from "@/lib/api-errors";
import { creeazaNotificare } from "@/lib/notifications";
import { formatIntalnire, textCurat } from "@/lib/cercuri";

/** Liderul programeaza o intalnire; toti membrii activi primesc notificare. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: circleId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const startsAt = new Date(String(body?.starts_at ?? ""));
  if (Number.isNaN(startsAt.getTime())) {
    return NextResponse.json({ error: "Alege data și ora întâlnirii." }, { status: 400 });
  }
  if (startsAt.getTime() < Date.now() - 60 * 60 * 1000) {
    return NextResponse.json({ error: "Data întâlnirii e în trecut." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("circle_meetings")
    .insert({
      circle_id: circleId,
      starts_at: startsAt.toISOString(),
      loc: textCurat(body?.loc, 160) || null,
      tema: textCurat(body?.tema, 200) || null,
      created_by: user.id,
    } as never)
    .select("id")
    .single();

  if (error) {
    const interzis = error.code === "42501";
    return NextResponse.json(
      {
        error: mesajEroareSigur(error, "POST /api/cercuri/[id]/intalniri", {
          "42501": "Doar liderul cercului poate programa întâlniri.",
        }),
      },
      { status: interzis ? 403 : 500 }
    );
  }

  const [{ data: cerc }, { data: membri }] = await Promise.all([
    supabase.from("circles").select("nume").eq("id", circleId).maybeSingle(),
    supabase.from("circle_members").select("profile_id").eq("circle_id", circleId).eq("status", "activ"),
  ]);
  const numeCerc = (cerc as { nume: string } | null)?.nume ?? "Cercul tău";
  await Promise.all(
    ((membri as { profile_id: string }[]) ?? [])
      .filter((m) => m.profile_id !== user.id)
      .map((m) =>
        creeazaNotificare({
          profileId: m.profile_id,
          tip: "cerc_intalnire",
          titlu: `${numeCerc}: întâlnire ${formatIntalnire(startsAt.toISOString())}`,
          mesaj: textCurat(body?.tema, 200) || undefined,
          link: `/cercuri/${circleId}`,
        })
      )
  );

  return NextResponse.json({ data });
}
