import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mesajEroareSigur } from "@/lib/api-errors";

/** Raspunsul unui membru la o intalnire: { raspuns: "vin" | "nu_vin" }. */
export async function POST(request: Request, { params }: { params: Promise<{ meetingId: string }> }) {
  const { meetingId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const raspuns = body?.raspuns;
  if (raspuns !== "vin" && raspuns !== "nu_vin") {
    return NextResponse.json({ error: "Răspuns necunoscut." }, { status: 400 });
  }

  const { error } = await supabase
    .from("circle_meeting_rsvps")
    .upsert(
      { meeting_id: meetingId, profile_id: user.id, raspuns, updated_at: new Date().toISOString() } as never,
      { onConflict: "meeting_id,profile_id" }
    );

  if (error) {
    const interzis = error.code === "42501";
    return NextResponse.json(
      {
        error: mesajEroareSigur(error, "POST /api/cercuri/intalniri/[meetingId]", {
          "42501": "Doar membrii cercului pot confirma prezența.",
        }),
      },
      { status: interzis ? 403 : 500 }
    );
  }
  return NextResponse.json({ data: { ok: true } });
}

/** Liderul anuleaza o intalnire. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ meetingId: string }> }) {
  const { meetingId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });

  const { data, error } = await supabase.from("circle_meetings").delete().eq("id", meetingId).select("id");
  if (error) {
    return NextResponse.json({ error: mesajEroareSigur(error, "DELETE /api/cercuri/intalniri/[meetingId]") }, { status: 500 });
  }
  if (!data || (data as unknown[]).length === 0) {
    return NextResponse.json({ error: "Doar liderul cercului poate anula întâlnirea." }, { status: 403 });
  }
  return NextResponse.json({ data: { ok: true } });
}
