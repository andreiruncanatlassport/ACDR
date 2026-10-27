import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mesajEroareSigur } from "@/lib/api-errors";

/** Bifeaza / debifeaza propriul angajament: { facut: boolean }. */
export async function PATCH(request: Request, { params }: { params: Promise<{ commitmentId: string }> }) {
  const { commitmentId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { data, error } = await supabase
    .from("circle_commitments")
    .update({ facut: Boolean(body?.facut) } as never)
    .eq("id", commitmentId)
    .eq("profile_id", user.id)
    .select("id");

  if (error) {
    return NextResponse.json({ error: mesajEroareSigur(error, "PATCH /api/cercuri/angajamente/[id]") }, { status: 500 });
  }
  if (!data || (data as unknown[]).length === 0) {
    return NextResponse.json({ error: "Angajamentul nu există." }, { status: 404 });
  }
  return NextResponse.json({ data: { ok: true } });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ commitmentId: string }> }) {
  const { commitmentId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });

  const { error } = await supabase
    .from("circle_commitments")
    .delete()
    .eq("id", commitmentId)
    .eq("profile_id", user.id);

  if (error) {
    return NextResponse.json({ error: mesajEroareSigur(error, "DELETE /api/cercuri/angajamente/[id]") }, { status: 500 });
  }
  return NextResponse.json({ data: { ok: true } });
}
