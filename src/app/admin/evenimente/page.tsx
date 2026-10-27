import { redirect } from "next/navigation";
import { formatData, formatOra } from "@/lib/evenimente-data";
import Link from "next/link";
import { Plus, CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, Badge } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import type { Profile, EventItem } from "@/types/database";

const STATUS_TONE: Record<string, "success" | "neutral" | "danger" | "warning"> = {
  publicat: "success",
  draft: "neutral",
  propunere: "warning",
  anulat: "danger",
};
const STATUS_LABEL: Record<string, string> = {
  publicat: "Publicat",
  draft: "Ciornă",
  propunere: "Propunere de membru",
  anulat: "Anulat",
};

export default async function AdminEvenimentePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("rol").eq("id", user.id).single();
  const rol = (profile as Pick<Profile, "rol"> | null)?.rol;
  if (rol !== "admin" && rol !== "moderator") redirect("/dashboard");

  const { data } = await supabase.from("events").select("*").order("data_inceput", { ascending: false });
  const evenimente = ((data as EventItem[]) ?? []).sort(
    (a, b) => Number(b.status === "propunere") - Number(a.status === "propunere")
  );

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="stamp-label text-seal">Administrare</p>
          <h1 className="mt-1.5 flex items-center gap-2.5 text-3xl font-semibold tracking-tight text-ink">
            <CalendarDays className="h-6 w-6 text-seal" /> Evenimente
          </h1>
        </div>
        <LinkButton href="/admin/evenimente/noua" variant="seal" size="sm">
          <Plus className="h-4 w-4" /> Eveniment nou
        </LinkButton>
      </div>

      <div className="mt-8 space-y-3">
        {evenimente.length === 0 && <p className="text-sm text-ink-soft">Niciun eveniment încă.</p>}
        {evenimente.map((e) => (
          <Link key={e.id} href={`/admin/evenimente/${e.id}`}>
            <Card className="lift-on-hover flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{e.titlu}</p>
                <p className="mt-0.5 text-xs text-ink-soft">
                  {formatData(e.data_inceput, "ro-RO", { day: "2-digit", month: "short", year: "numeric" })}
                  {e.are_ora_inceput !== false && ` · ${formatOra(e.data_inceput)}`}
                </p>
              </div>
              <Badge tone={STATUS_TONE[e.status]}>{STATUS_LABEL[e.status]}</Badge>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
