import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mesajEroareSigur } from "@/lib/api-errors";
import { textCurat } from "@/lib/cercuri";

/** Mesaj in grupul cercului (fara notificari, ca sa nu umplem clopotelul). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: circleId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const continut = textCurat(body?.continut, 2000);
  if (!continut) return NextResponse.json({ error: "Mesajul e gol." }, { status: 400 });

  const { data, error } = await supabase
    .from("circle_messages")
    .insert({ circle_id: circleId, profile_id: user.id, continut } as never)
    .select("id, profile_id, continut, created_at")
    .single();

  if (error) {
    const interzis = error.code === "42501";
    return NextResponse.json(
      {
        error: mesajEroareSigur(error, "POST /api/cercuri/[id]/mesaje", {
          "42501": "Doar membrii cercului pot scrie aici.",
        }),
      },
      { status: interzis ? 403 : 500 }
    );
  }
  return NextResponse.json({ data });
}
