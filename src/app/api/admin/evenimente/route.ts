import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mesajEroareSigur } from "@/lib/api-errors";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Neautentificat." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const titlu = String(body?.titlu || "").trim();
  const descriere = String(body?.descriere || "").trim();
  const dataInceput = body?.data_inceput;
  if (!titlu || !descriere || !dataInceput) {
    return NextResponse.json({ error: "Titlul, descrierea și data de început sunt obligatorii." }, { status: 400 });
  }

  if (Number.isNaN(Date.parse(dataInceput)) || (body?.data_sfarsit && Number.isNaN(Date.parse(body.data_sfarsit)))) {
    return NextResponse.json({ error: "Data nu e validă." }, { status: 400 });
  }

  const tip = ["conferinta", "workshop", "networking", "altul"].includes(body?.tip) ? body.tip : "networking";
  const status = body?.status === "draft" ? "draft" : "publicat";

  // RLS (public.events) permite scriere doar adminilor/moderatorilor.
  const { data, error } = await supabase
    .from("events")
    .insert({
      autor_id: user.id,
      titlu,
      descriere,
      imagine_url: body?.imagine_url || null,
      tip,
      locatie: body?.locatie ? String(body.locatie).trim() : null,
      online: Boolean(body?.online),
      link_extern: body?.link_extern ? String(body.link_extern).trim() : null,
      data_inceput: dataInceput,
      data_sfarsit: body?.data_sfarsit || null,
      are_ora_inceput: body?.are_ora_inceput !== false,
      are_ora_sfarsit: body?.are_ora_sfarsit !== false,
      capacitate: body?.capacitate ? Number(body.capacitate) : null,
      status,
    } as never)
    .select("id, slug")
    .single();

  if (error) return NextResponse.json({ error: mesajEroareSigur(error, "POST src/app/api/admin/evenimente/route.ts") }, { status: 500 });
  return NextResponse.json({ data });
}
