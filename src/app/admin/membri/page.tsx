import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Users, UserRound, Download } from "lucide-react";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { Card, Badge, SectionLabel } from "@/components/ui/Card";
import { AdminMemberActions } from "@/components/AdminMemberActions";
import type { Profile } from "@/types/database";

interface MembruRand {
  id: string;
  nume_complet: string;
  email_personal: string | null;
  avatar_url: string | null;
  titlu: string | null;
  firma_declarata: string | null;
  oras: string | null;
  rol: string;
  activ: boolean;
  stare_verificare: "nou" | "verificat" | "neverificat";
  created_at: string;
}

export default async function AdminMembriPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const stareFiltru = params.stare?.trim() ?? "toate";
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("rol").eq("id", user.id).single();
  const rol = (profile as Pick<Profile, "rol"> | null)?.rol;
  if (rol !== "admin" && rol !== "moderator") redirect("/dashboard");
  const potSterge = rol === "admin";

  // Service role: adminul vede TOTI membrii (inclusiv cei dezactivati sau
  // cu profil ascuns), ceea ce politica normala pe profiles nu permite.
  const admin = createServiceRoleClient();
  let query = admin
    .from("profiles")
    .select("id, nume_complet, email_personal, avatar_url, titlu, firma_declarata, oras, rol, activ, stare_verificare, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (q) query = query.or(`nume_complet.ilike.%${q}%,email_personal.ilike.%${q}%,firma_declarata.ilike.%${q}%`);
  if (stareFiltru !== "toate") query = query.eq("stare_verificare", stareFiltru);

  const { data } = await query;
  const membri = (data as MembruRand[]) ?? [];

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-seal">
        <ArrowLeft className="h-4 w-4" /> Administrare
      </Link>

      <div className="mt-6 flex items-start justify-between gap-4">
        <div>
          <p className="stamp-label text-seal">Gestionare membri</p>
          <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-ink">Membri</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Dezactivarea ascunde membrul din director și oprește contactarea, dar păstrează contul (reversibil).
            {potSterge ? " Ștergerea e definitivă." : " Doar un administrator poate șterge definitiv un cont."}
          </p>
        </div>
        <a
          href="/api/admin/export?tip=membri"
          className="mt-1 inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-line-strong px-3.5 py-2 text-sm font-semibold text-ink transition hover:border-seal/40"
        >
          <Download className="h-4 w-4" /> Export CSV
        </a>
      </div>

      <section className="mt-8">
        <SectionLabel icon={<Users className="h-3.5 w-3.5" />}>Toți membrii ({membri.length})</SectionLabel>

        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              { id: "toate", label: "Toate" },
              { id: "nou", label: "Noi" },
              { id: "verificat", label: "Verificați" },
              { id: "neverificat", label: "Neverificați" },
            ] as const
          ).map((f) => (
            <Link
              key={f.id}
              href={`/admin/membri?stare=${f.id}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                stareFiltru === f.id
                  ? "gradient-seal text-primary-content shadow-[var(--shadow-sm)]"
                  : "bg-ink/5 text-ink-soft hover:bg-ink/10 hover:text-ink"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>

        <form className="mt-3 max-w-sm">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Caută după nume, email, firmă..."
            className="w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-ink shadow-[inset_0_1px_2px_rgba(16,24,40,0.04)] outline-none transition-all duration-200 placeholder:text-ink-soft/60 focus:border-seal focus:ring-3 focus:ring-seal/12"
          />
        </form>

        <div className="mt-4 space-y-3">
          {membri.length === 0 && <p className="text-sm text-ink-soft">Niciun membru găsit.</p>}
          {membri.map((m) => (
            <Card key={m.id} className={m.activ ? "" : "opacity-60"}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-ink/5 ring-1 ring-inset ring-line">
                    {m.avatar_url ? (
                      <Image src={m.avatar_url} alt="" fill className="object-cover" unoptimized />
                    ) : (
                      <div className="flex h-full items-center justify-center text-ink-soft/40">
                        <UserRound className="h-5 w-5" strokeWidth={1.5} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/membri/${m.id}`} className="font-medium text-ink hover:text-seal">
                        {m.nume_complet}
                      </Link>
                      {m.rol !== "user" && <Badge tone="seal">{m.rol}</Badge>}
                      <Badge
                        tone={
                          m.stare_verificare === "verificat"
                            ? "success"
                            : m.stare_verificare === "neverificat"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {m.stare_verificare === "verificat"
                          ? "Verificat"
                          : m.stare_verificare === "neverificat"
                            ? "Neverificat"
                            : "Nou"}
                      </Badge>
                      {!m.activ && <Badge tone="danger">Dezactivat</Badge>}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-ink-soft">
                      {[m.email_personal, m.titlu, m.firma_declarata, m.oras].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                </div>
                <AdminMemberActions
                  membruId={m.id}
                  activ={m.activ}
                  stareVerificare={m.stare_verificare}
                  potSterge={potSterge && m.id !== user.id}
                />
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
