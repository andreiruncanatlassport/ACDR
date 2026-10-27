"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Building2, Briefcase, MessageCircle, UserRound } from "lucide-react";
import { clsx } from "clsx";
import { useSettings } from "@/lib/settings/context";
import { useUnreadMessagesCount } from "@/lib/useUnreadMessagesCount";

/**
 * Bara de navigare de jos, doar pe mobil — face site-ul sa se simta ca o
 * aplicatie (modelul din aplicatia AER). Cele mai importante actiuni ale
 * comunitatii sunt mereu la un deget distanta: gasesti oameni si firme,
 * si vorbesti cu ei.
 */
export function MobileTabBar({ autentificat }: { autentificat: boolean }) {
  const pathname = usePathname();
  const { t } = useSettings();
  const unreadMesaje = useUnreadMessagesCount(autentificat);

  const taburi = [
    { href: "/", label: t.mobileNav.home, icon: Home, exact: true },
    { href: "/catalog", label: t.mobileNav.companies, icon: Building2 },
    // Proiecte (oportunitatile) aduc colaborari, de-aia stau in bara; Membri
    // ramane accesibil din meniu si de pe pagina de start.
    { href: "/oportunitati", label: t.mobileNav.projects, icon: Briefcase },
    {
      href: "/mesaje",
      label: unreadMesaje > 0 ? `${t.mobileNav.messages} (${unreadMesaje > 9 ? "9+" : unreadMesaje})` : t.mobileNav.messages,
      icon: MessageCircle,
    },
    {
      href: autentificat ? "/dashboard" : "/login",
      label: autentificat ? t.mobileNav.account : t.mobileNav.login,
      icon: UserRound,
    },
  ];

  function esteActiv(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navigare principală"
    >
      <div className="mx-auto flex max-w-lg items-stretch">
        {taburi.map((tab) => {
          const activ = esteActiv(tab.href, tab.exact);
          return (
            <Link
              key={tab.href + tab.label}
              href={tab.href}
              aria-current={activ ? "page" : undefined}
              className={clsx(
                "flex min-h-14 flex-1 flex-col items-center justify-center gap-1 py-1.5 transition-colors active:scale-95",
                activ ? "text-seal" : "text-ink-soft"
              )}
            >
              <span
                className={clsx(
                  "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                  activ && "bg-olive-pale"
                )}
              >
                <tab.icon className="h-5 w-5" strokeWidth={activ ? 2.2 : 1.8} />
              </span>
              <span className={clsx("text-[11px] leading-tight", activ ? "font-bold" : "font-semibold")}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
