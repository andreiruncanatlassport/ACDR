import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mesajEroareSigur } from "@/lib/api-errors";

function citesteBody(body: unknown) {
  const b = body as { company_id?: unknown; obligation_id?: unknown; scadenta?: unknown } | null;
  const companyId = String(b?.company_id ?? "");
  const obligationId = String(b?.obligation_id ?? "");
  const scadenta = String(b?.scadenta ?? "");
  const valid = companyId && obligationId && /^\d{4}-\d{2}-\d{2}$/.test(scadenta);
  return valid ? { companyId, obligationId, scadenta } : null;
}

/** Marcheaza un termen ca depus. RLS permite doar proprietarului firmei. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });

  const date = citesteBody(await request.json().catch(() => null));
  if (!date) return NextResponse.json({ error: "Date incomplete." }, { status: 400 });

  const { error } = await supabase.from("fiscal_deadline_done").upsert(
    {
      company_id: date.companyId,
      obligation_id: date.obligationId,
      scadenta: date.scadenta,
      done_by: user.id,
    } as never,
    { onConflict: "company_id,obligation_id,scadenta", ignoreDuplicates: true }
  );

  if (error) {
    const interzis = error.code === "42501";
    return NextResponse.json(
      {
        error: mesajEroareSigur(error, "POST /api/calendar-fiscal/bifat", {
          "42501": "Poți bifa termene doar pentru firmele tale.",
        }),
      },
      { status: interzis ? 403 : 500 }
    );
  }
  return NextResponse.json({ data: { ok: true } });
}

/** Scoate bifa de pe un termen. */
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });

  const date = citesteBody(await request.json().catch(() => null));
  if (!date) return NextResponse.json({ error: "Date incomplete." }, { status: 400 });

  const { error } = await supabase
    .from("fiscal_deadline_done")
    .delete()
    .eq("company_id", date.companyId)
    .eq("obligation_id", date.obligationId)
    .eq("scadenta", date.scadenta);

  if (error) return NextResponse.json({ error: mesajEroareSigur(error, "DELETE /api/calendar-fiscal/bifat") }, { status: 500 });
  return NextResponse.json({ data: { ok: true } });
}
