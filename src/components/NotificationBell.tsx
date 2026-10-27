"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check } from "lucide-react";

interface Notificare {
  id: string;
  tip: string;
  titlu: string;
  mesaj: string | null;
  link: string | null;
  citit: boolean;
  created_at: string;
}

function candDemult(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "acum";
  if (min < 60) return `${min}m`;
  const ore = Math.floor(min / 60);
  if (ore < 24) return `${ore}h`;
  const zile = Math.floor(ore / 24);
  if (zile < 7) return `${zile}z`;
  return new Date(iso).toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit" });
}

export function NotificationBell() {
  const router = useRouter();
  const [notificari, setNotificari] = useState<Notificare[]>([]);
  const [necitite, setNecitite] = useState(0);
  const [deschis, setDeschis] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function incarca() {
    try {
      const res = await fetch("/api/notifications");
      const json = await res.json();
      if (json?.data) {
        setNotificari(json.data.notificari ?? []);
        setNecitite(json.data.necitite ?? 0);
      }
    } catch {
      // retea indisponibila — reincercam la urmatorul interval
    }
  }

  useEffect(() => {
    // Incarcare initiala + reimprospatare periodica — fetch la montare, nu
    // sincronizare de stare React<->React.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    incarca();
    const interval = setInterval(incarca, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setDeschis(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function marcheazaToate() {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: "{}" });
    setNecitite(0);
    setNotificari((prev) => prev.map((n) => ({ ...n, citit: true })));
  }

  async function deschideNotificare(n: Notificare) {
    if (!n.citit) {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: n.id }),
      });
      setNecitite((v) => Math.max(0, v - 1));
    }
    setDeschis(false);
    if (n.link) router.push(n.link);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setDeschis((v) => !v)}
        className="relative rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
        aria-label="Notificări"
      >
        <Bell className="h-[18px] w-[18px]" />
        {necitite > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full gradient-seal px-1 text-[10px] font-bold text-primary-content">
            {necitite > 9 ? "9+" : necitite}
          </span>
        )}
      </button>

      {deschis && (
        <div className="glass absolute right-0 top-full z-50 mt-3 w-80 overflow-hidden p-0 text-ink shadow-[var(--shadow-xl)]">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="stamp-label text-ink-soft">Notificări</p>
            {necitite > 0 && (
              <button
                onClick={marcheazaToate}
                className="inline-flex items-center gap-1 text-xs font-semibold text-seal hover:underline"
              >
                <Check className="h-3 w-3" /> Marchează citite
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notificari.length === 0 && (
              <p className="py-8 text-center text-sm text-ink-soft">Nicio notificare încă.</p>
            )}
            {notificari.map((n) => (
              <button
                key={n.id}
                onClick={() => deschideNotificare(n)}
                className={
                  "block w-full border-b border-line px-4 py-3 text-left transition hover:bg-ink/4 " +
                  (n.citit ? "" : "bg-seal/6")
                }
              >
                <div className="flex items-start justify-between gap-2">
                  <p className={"text-sm " + (n.citit ? "text-ink-soft" : "font-semibold text-ink")}>
                    {n.titlu}
                  </p>
                  <span className="font-mono-num shrink-0 text-[10px] text-ink-soft/60">
                    {candDemult(n.created_at)}
                  </span>
                </div>
                {n.mesaj && (
                  <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-ink-soft">{n.mesaj}</p>
                )}
              </button>
            ))}
          </div>

          <Link
            href="/dashboard"
            onClick={() => setDeschis(false)}
            className="block border-t border-line px-4 py-2.5 text-center text-xs font-semibold text-seal hover:bg-ink/4"
          >
            Vezi contul meu
          </Link>
        </div>
      )}
    </div>
  );
}
