import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mesajEroareSigur } from "@/lib/api-errors";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Neautentificat." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Cerere invalidă." }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (typeof body.titlu === "string") update.titlu = body.titlu.trim();
  if (typeof body.descriere === "string") update.descriere = body.descriere.trim();
  if (typeof body.imagine_url === "string" || body.imagine_url === null) update.imagine_url = body.imagine_url;
  if (["conferinta", "workshop", "networking", "altul"].includes(body.tip)) update.tip = body.tip;
  if (typeof body.locatie === "string" || body.locatie === null) update.locatie = body.locatie;
  if (typeof body.online === "boolean") update.online = body.online;
  if (typeof body.link_extern === "string" || body.link_extern === null) update.link_extern = body.link_extern;
  if (typeof body.data_inceput === "string") update.data_inceput = body.data_inceput;
  if (typeof body.data_sfarsit === "string" || body.data_sfarsit === null) update.data_sfarsit = body.data_sfarsit;
  if (typeof body.are_ora_inceput === "boolean") update.are_ora_inceput = body.are_ora_inceput;
  if (typeof body.are_ora_sfarsit === "boolean") update.are_ora_sfarsit = body.are_ora_sfarsit;
  if (body.capacitate === null || typeof body.capacitate === "number") update.capacitate = body.capacitate;
  if (["draft", "publicat", "anulat"].includes(body.status)) update.status = body.status;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nimic de actualizat." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("events")
    .update(update as never)
    .eq("id", id)
    .select("id, slug, status")
    .single();

  if (error) return NextResponse.json({ error: mesajEroareSigur(error, "PATCH src/app/api/admin/evenimente/[id]/route.ts") }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Neautentificat." }, { status: 401 });

  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return NextResponse.json({ error: mesajEroareSigur(error, "DELETE src/app/api/admin/evenimente/[id]/route.ts") }, { status: 500 });
  return NextResponse.json({ data: { ok: true } });
}
