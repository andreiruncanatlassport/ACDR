import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ShieldQuestion,
  Users,
  Building2,
  MessageCircle,
  ThumbsUp,
  Briefcase,
  Newspaper,
  CalendarDays,
  Star,
  TrendingUp,
  ArrowRight,
  Settings2,
  UsersRound,
  CalendarClock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAdminStats } from "@/lib/admin-stats";
import { Card, Badge, SectionLabel } from "@/components/ui/Card";
import { AdminCompanyActions } from "@/components/AdminCompanyActions";
import { MaintenanceToggle } from "@/components/MaintenanceToggle";
import type { Company, Profile } from "@/types/database";

function StatCard({
  icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className={`block-base p-4 ${accent ? "ring-1 ring-inset ring-seal/30" : ""}`}>
      <div className="flex items-center gap-2 text-ink-soft">
        <span className={accent ? "text-seal" : "text-ink-soft"}>{icon}</span>
        <span className="stamp-label">{label}</span>
      </div>
      <p className="mt-2 font-mono-num text-2xl font-bold text-ink">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-soft/70">{hint}</p>}
    </div>
  );
}

const TOOLURI = [
  { href: "/admin/firme", icon: Building2, titlu: "Firme", desc: "Adaugă, editează, șterge, aprobă" },
  { href: "/admin/membri", icon: Users, titlu: "Membri", desc: "Verifică, dezactivează, șterge, caută" },
  { href: "/admin/oportunitati", icon: Briefcase, titlu: "Oportunități", desc: "Aprobă sau respinge oportunitățile noi" },
  { href: "/admin/recenzii", icon: Star, titlu: "Recenzii", desc: "Moderează recenziile firmelor" },
  { href: "/admin/stiri", icon: Newspaper, titlu: "Știri", desc: "Publică și editează articole" },
  { href: "/admin/evenimente", icon: CalendarDays, titlu: "Evenimente", desc: "Creează și gestionează evenimente" },
  { href: "/admin/cercuri", icon: UsersRound, titlu: "Cercuri", desc: "Creează cercuri și numește liderii" },
  { href: "/admin/calendar-fiscal", icon: CalendarClock, titlu: "Calendar fiscal", desc: "Termenele ANAF folosite în calendar" },
  { href: "/admin/categorii", icon: Settings2, titlu: "Categorii & CAEN", desc: "Taxonomia de domenii" },
];

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("rol").eq("id", user.id).single();
  const rol = (profile as Pick<Profile, "rol"> | null)?.rol;
  if (rol !== "admin" && rol !== "moderator") redirect("/dashboard");

  const [stats, { data: pendingData }, { data: setariData }] = await Promise.all([
    getAdminStats(),
    supabase.from("companies").select("*").eq("status", "pending").order("created_at", { ascending: true }).limit(10),
    supabase.from("platform_settings").select("mentenanta_activa, mentenanta_mesaj").eq("id", true).maybeSingle(),
  ]);
  const pending = (pendingData as Company[]) ?? [];
  const setari = setariData as { mentenanta_activa: boolean; mentenanta_mesaj: string | null } | null;

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="stamp-label text-seal">Panou de control</p>
          <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-ink">Administrare</h1>
        </div>
      </div>

      <div className="mt-6">
        <MaintenanceToggle
          initialActiva={setari?.mentenanta_activa ?? false}
          initialMesaj={setari?.mentenanta_mesaj ?? null}
        />
      </div>

      {/* ============ STATISTICI ============ */}
      <section className="mt-8">
        <SectionLabel icon={<TrendingUp className="h-3.5 w-3.5" />}>Comunitatea în cifre</SectionLabel>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={<Users className="h-4 w-4" />} label="Membri" value={stats.membriTotal} hint={`${stats.membriActivi} activi · +${stats.membriNoi7z} în 7 zile`} />
          <StatCard icon={<Building2 className="h-4 w-4" />} label="Firme" value={stats.firmeAprobate} hint={`din ${stats.firmeTotal} · +${stats.firmeNoi7z} în 7 zile`} />
          <StatCard icon={<MessageCircle className="h-4 w-4" />} label="Mesaje" value={stats.mesajeTotal} hint={`+${stats.mesaje7z} în 7 zile`} />
          <StatCard icon={<ThumbsUp className="h-4 w-4" />} label="Recomandări" value={stats.recomandariTotal} hint={`${stats.membriVerificati} membri verificați`} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={<Briefcase className="h-4 w-4" />} label="Oportunități" value={stats.oportunitatiDeschise} hint="deschise acum" />
          <StatCard icon={<CalendarDays className="h-4 w-4" />} label="Evenimente" value={stats.evenimenteViitoare} hint="viitoare" />
          <StatCard icon={<Newspaper className="h-4 w-4" />} label="Știri" value={stats.stiriPublicate} hint="publicate" />
          <StatCard icon={<ShieldQuestion className="h-4 w-4" />} label="De verificat" value={stats.firmePending + stats.recenziiPending} hint={`${stats.firmePending} firme · ${stats.recenziiPending} recenzii`} accent />
        </div>
      </section>

      {/* ============ TOOLURI ============ */}
      <section className="mt-10">
        <SectionLabel icon={<Settings2 className="h-3.5 w-3.5" />}>Instrumente</SectionLabel>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLURI.map((t) => (
            <Link key={t.href} href={t.href} className="lift-on-hover block-base flex items-center gap-3.5 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-seal/10 text-seal">
                <t.icon className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{t.titlu}</p>
                <p className="truncate text-xs text-ink-soft">{t.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-ink-soft/50" />
            </Link>
          ))}
        </div>
      </section>

      {/* ============ FIRME ÎN VERIFICARE ============ */}
      <section className="mt-10">
        <SectionLabel icon={<ShieldQuestion className="h-3.5 w-3.5" />}>
          Firme în verificare manuală ({pending.length})
        </SectionLabel>
        <p className="mt-1 text-xs text-ink-soft/70">
          Firme neaprobate automat (CUI inactiv/radiat la ANAF sau alt semnal de verificat).
        </p>

        <div className="mt-4 space-y-3">
          {pending.length === 0 && <p className="text-sm text-ink-soft">Nimic în așteptare — bravo!</p>}
          {pending.map((c) => (
            <Card key={c.id} className="lift-on-hover">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link href={`/firma/${c.id}`} className="font-medium text-ink hover:text-seal">
                    {c.denumire}
                  </Link>
                  <p className="mt-1 font-mono-num text-xs text-ink-soft">CUI {c.cui}</p>
                  <p className="mt-1 text-xs text-ink-soft">Stare ANAF: {c.stare_inregistrare || "—"}</p>
                  {c.radiata && <Badge tone="danger">Radiată la ANAF</Badge>}
                </div>
                <AdminCompanyActions companyId={c.id} actiuniDisponibile={["approve", "reject"]} potSterge />
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
