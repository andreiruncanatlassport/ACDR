"use client";

import Link from "next/link";
import { clsx } from "clsx";
import { useSettings } from "@/lib/settings/context";

/**
 * Cele două taburi din pagina de cont: „Autentificare" (/login) și
 * „Cont nou" (/inregistrare). În header există un singur buton, „Intră în
 * cont", care duce aici; utilizatorul alege apoi tabul potrivit.
 * Sunt linkuri (nu taburi ARIA), pentru că fiecare are adresa lui și
 * butonul Înapoi din browser trebuie să funcționeze normal.
 */
export function AuthTabs({ activ }: { activ: "login" | "register" }) {
  const { t } = useSettings();
  const taburi = [
    { id: "login" as const, href: "/login", label: t.nav.login },
    { id: "register" as const, href: "/inregistrare", label: t.nav.registerTab },
  ];

  return (
    <nav aria-label={t.nav.signIn} className="grid grid-cols-2 gap-1 rounded-2xl border border-line bg-paper p-1">
      {taburi.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          aria-current={activ === tab.id ? "page" : undefined}
          className={clsx(
            "flex min-h-11 items-center justify-center rounded-xl px-3 text-sm font-bold transition-colors",
            activ === tab.id
              ? "bg-primary text-primary-content shadow-[var(--shadow-sm)]"
              : "text-ink-soft hover:bg-surface hover:text-ink"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
