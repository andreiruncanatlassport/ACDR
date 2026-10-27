"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useSettings } from "@/lib/settings/context";
import { LinkButton } from "@/components/ui/Button";
import { SettingsMenu } from "@/components/SettingsMenu";
import { NotificationBell } from "@/components/NotificationBell";
import { BrandMark } from "@/components/ui/BrandMark";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { useUnreadMessagesCount } from "@/lib/useUnreadMessagesCount";

interface HeaderProps {
  userEmail: string | null;
  rol: "user" | "moderator" | "admin" | null;
}

export function Header({ userEmail, rol }: HeaderProps) {
  const { t } = useSettings();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const unreadMesaje = useUnreadMessagesCount(Boolean(userEmail));

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const linkClass = (href: string) =>
    clsx(
      "relative py-1 text-sm font-medium transition-colors",
      pathname === href ? "text-white" : "text-white/65 hover:text-white"
    );

  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-navy/90 backdrop-blur-xl">
      {/* fir auriu de sigiliu, sus */}
      <div className="h-0.5 w-full gradient-gold opacity-80" />

      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link href="/" className="group flex items-center gap-2.5" title="ACDR">
          <BrandMark variant="white" className="h-8 w-8 shrink-0" />
          <span className="hidden font-sans text-lg font-extrabold tracking-tight text-white sm:inline">
            ACDR
          </span>
        </Link>

        <nav className="hidden items-center gap-5 md:flex">
          <Link href="/catalog" className={linkClass("/catalog")}>
            {t.nav.catalog}
            {pathname === "/catalog" && (
              <span className="absolute -bottom-3.5 left-0 right-0 h-0.5 gradient-gold" />
            )}
          </Link>
          <Link href="/oportunitati" className={linkClass("/oportunitati")}>
            {t.nav.opportunities}
            {pathname === "/oportunitati" && (
              <span className="absolute -bottom-3.5 left-0 right-0 h-0.5 gradient-gold" />
            )}
          </Link>
          <Link href="/membri" className={linkClass("/membri")}>
            {t.nav.members}
            {pathname === "/membri" && (
              <span className="absolute -bottom-3.5 left-0 right-0 h-0.5 gradient-gold" />
            )}
          </Link>
          <Link href="/stiri" className={linkClass("/stiri")}>
            {t.nav.news}
            {pathname === "/stiri" && (
              <span className="absolute -bottom-3.5 left-0 right-0 h-0.5 gradient-gold" />
            )}
          </Link>
          <Link href="/evenimente" className={linkClass("/evenimente")}>
            {t.nav.events}
            {pathname === "/evenimente" && (
              <span className="absolute -bottom-3.5 left-0 right-0 h-0.5 gradient-gold" />
            )}
          </Link>

          {userEmail ? (
            <>
              {(rol === "admin" || rol === "moderator") && (
                <Link href="/admin" className={linkClass("/admin")}>
                  {t.nav.admin}
                </Link>
              )}
              <Link href="/cercuri" className={linkClass("/cercuri")}>
                {t.nav.circles}
              </Link>
              <Link href="/mesaje" className={linkClass("/mesaje")}>
                {t.nav.messages}
                {unreadMesaje > 0 && <span className="ml-1 font-bold text-white">({unreadMesaje > 9 ? "9+" : unreadMesaje})</span>}
              </Link>
              <Link href="/dashboard" className={linkClass("/dashboard")}>
                {t.nav.dashboard}
              </Link>
              <span className="h-5 w-px bg-white/12" />
              <NotificationBell />
              <SettingsMenu />
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-white/65 transition-colors hover:text-white"
              >
                {t.nav.logout}
              </button>
            </>
          ) : (
            <>
              <SettingsMenu />
              {/* Un singur buton; pagina de cont are tabul Autentificare si tabul Cont nou */}
              <LinkButton href="/login" variant="gold" size="sm">
                {t.nav.signIn}
              </LinkButton>
            </>
          )}
        </nav>

        <div className="flex items-center gap-1 md:hidden">
          {userEmail && <NotificationBell />}
          <SettingsMenu />
          <button
            className="rounded-lg p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
            onClick={() => setOpen(!open)}
            aria-label="Meniu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/8 bg-navy px-5 py-5 md:hidden">
          <div className="flex flex-col gap-4">
            <Link href="/catalog" onClick={() => setOpen(false)} className="text-sm font-medium text-white/80">
              {t.nav.catalog}
            </Link>
            <Link href="/oportunitati" onClick={() => setOpen(false)} className="text-sm font-medium text-white/80">
              {t.nav.opportunities}
            </Link>
            <Link href="/membri" onClick={() => setOpen(false)} className="text-sm font-medium text-white/80">
              {t.nav.members}
            </Link>
            <Link href="/stiri" onClick={() => setOpen(false)} className="text-sm font-medium text-white/80">
              {t.nav.news}
            </Link>
            <Link href="/evenimente" onClick={() => setOpen(false)} className="text-sm font-medium text-white/80">
              {t.nav.events}
            </Link>
            {userEmail ? (
              <>
                {(rol === "admin" || rol === "moderator") && (
                  <Link href="/admin" onClick={() => setOpen(false)} className="text-sm font-medium text-white/80">
                    {t.nav.admin}
                  </Link>
                )}
                <Link href="/cercuri" onClick={() => setOpen(false)} className="text-sm font-medium text-white/80">
                  {t.nav.circles}
                </Link>
                <Link href="/dashboard/calendar-fiscal" onClick={() => setOpen(false)} className="text-sm font-medium text-white/80">
                  {t.nav.fiscalCalendar}
                </Link>
                <Link href="/mesaje" onClick={() => setOpen(false)} className="text-sm font-medium text-white/80">
                  {t.nav.messages}
                  {unreadMesaje > 0 && <span className="ml-1 font-bold text-white">({unreadMesaje > 9 ? "9+" : unreadMesaje})</span>}
                </Link>
                <Link href="/dashboard" onClick={() => setOpen(false)} className="text-sm font-medium text-white/80">
                  {t.nav.dashboard}
                </Link>
                <button className="text-left text-sm font-medium text-white/80" onClick={handleLogout}>
                  {t.nav.logout}
                </button>
              </>
            ) : (
              <>
                <LinkButton href="/login" variant="gold" size="sm" className="w-fit">
                  {t.nav.signIn}
                </LinkButton>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
