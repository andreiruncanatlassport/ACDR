import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mesajEroareSigur } from "@/lib/api-errors";
import { lunaCurenta, textCurat } from "@/lib/cercuri";

const MAX_PE_LUNA = 5;

/** Un membru isi adauga un angajament pentru luna curenta. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: circleId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const text = textCurat(body?.text, 200);
  if (text.length < 3) return NextResponse.json({ error: "Scrie ce îți propui (minimum 3 caractere)." }, { status: 400 });

  const luna = lunaCurenta();
  const { count } = await supabase
    .from("circle_commitments")
    .select("id", { count: "exact", head: true })
    .eq("circle_id", circleId)
    .eq("profile_id", user.id)
    .eq("luna", luna);
  if ((count ?? 0) >= MAX_PE_LUNA) {
    return NextResponse.json({ error: `Poți avea cel mult ${MAX_PE_LUNA} angajamente pe lună.` }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("circle_commitments")
    .insert({ circle_id: circleId, profile_id: user.id, text, luna } as never)
    .select("id, profile_id, text, luna, facut")
    .single();

  if (error) {
    const interzis = error.code === "42501";
    return NextResponse.json(
      {
        error: mesajEroareSigur(error, "POST /api/cercuri/[id]/angajamente", {
          "42501": "Doar membrii cercului pot adăuga angajamente.",
        }),
      },
      { status: interzis ? 403 : 500 }
    );
  }
  return NextResponse.json({ data });
}
