import { redirect } from "next/navigation";
import { CalendarClock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ObligatieFiscalaRow } from "@/components/admin/ObligatieFiscalaRow";
import { SELECT_OBLIGATII, type ObligatieFiscala } from "@/lib/calendar-fiscal";

export const metadata = { title: "Calendar fiscal — Administrare ACDR" };

export default async function AdminCalendarFiscalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("rol").eq("id", user.id).single();
  const rol = (profile as { rol: string } | null)?.rol;
  if (rol !== "admin" && rol !== "moderator") redirect("/dashboard");

  const { data } = await supabase.from("fiscal_obligations").select(SELECT_OBLIGATII).order("ordine");
  const obligatii = (data as ObligatieFiscala[]) ?? [];

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <p className="stamp-label text-seal">Administrare</p>
      <h1 className="mt-1.5 flex items-center gap-2.5 text-3xl font-semibold tracking-tight text-ink">
        <CalendarClock className="h-6 w-6 text-seal" /> Calendar fiscal
      </h1>
      <p className="mt-3 text-sm text-ink-soft">
        Termenele din calendarul membrilor se calculează din lista de mai jos. Când se schimbă un termen prin lege,
        corectează-l aici: schimbarea apare imediat la toți, fără deploy. Mutarea pe prima zi lucrătoare se face automat.
      </p>
      <div className="mt-8 space-y-3">
        {obligatii.length === 0 && (
          <p className="text-sm text-ink-soft">Lista e goală. Rulează migrația 0041 în Supabase SQL Editor.</p>
        )}
        {obligatii.map((o) => (
          <ObligatieFiscalaRow key={o.id} o={o} />
        ))}
      </div>
    </div>
  );
}
