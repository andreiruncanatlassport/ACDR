import { redirect } from "next/navigation";
import Link from "next/link";
import { UsersRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, Badge } from "@/components/ui/Card";
import { CercNouForm, CercAdminActions } from "@/components/admin/CercAdmin";
import { SELECT_CERC, type Cerc } from "@/lib/cercuri";

export const metadata = { title: "Cercuri — Administrare ACDR" };

export default async function AdminCercuriPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("rol").eq("id", user.id).single();
  const rol = (profile as { rol: string } | null)?.rol;
  if (rol !== "admin" && rol !== "moderator") redirect("/dashboard");

  const [{ data: cercuriData }, { data: judeteData }, { data: membriData }] = await Promise.all([
    supabase.from("circles").select(SELECT_CERC).order("activ", { ascending: false }).order("oras"),
    supabase.from("judete").select("cod, nume").order("nume"),
    // Adminul vede toate randurile prin RLS (is_admin_or_mod).
    supabase.from("circle_members").select("circle_id, status"),
  ]);

  const cercuri = (cercuriData as Cerc[]) ?? [];
  const membri = (membriData as { circle_id: string; status: string }[]) ?? [];
  const numar = (id: string, status: string) => membri.filter((m) => m.circle_id === id && m.status === status).length;

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <p className="stamp-label text-seal">Administrare</p>
      <h1 className="mt-1.5 flex items-center gap-2.5 text-3xl font-semibold tracking-tight text-ink">
        <UsersRound className="h-6 w-6 text-seal" /> Cercuri
      </h1>
      <p className="mt-3 text-sm text-ink-soft">
        Liderul primește membrii și programează întâlnirile. Doar membrii verificați pot cere loc.
      </p>
      <div className="mt-4">
        <CercNouForm judete={(judeteData as { cod: string; nume: string }[]) ?? []} />
      </div>

      <div className="mt-8 space-y-3">
        {cercuri.length === 0 && <p className="text-sm text-ink-soft">Niciun cerc încă.</p>}
        {cercuri.map((c) => (
          <Card key={c.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <Link href={`/cercuri/${c.id}`} className="font-semibold text-ink hover:text-seal">
                {c.nume}
              </Link>
              <p className="mt-0.5 text-xs text-ink-soft">
                {c.oras} · {numar(c.id, "activ")}/{c.max_membri} membri
                {numar(c.id, "cerere") > 0 ? ` · ${numar(c.id, "cerere")} cereri` : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={c.activ ? "success" : "neutral"}>{c.activ ? "Deschis" : "Închis"}</Badge>
              <CercAdminActions id={c.id} activ={c.activ} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
