"use client";

import Link from "next/link";
import { BrandMark } from "@/components/ui/BrandMark";
import { useSettings } from "@/lib/settings/context";

const LINKURI = [
  { href: "/catalog", label: "Catalog firme" },
  { href: "/inregistrare", label: "Înregistrare" },
  { href: "/termeni", label: "Termeni & Condiții" },
  { href: "/regulament", label: "Regulament" },
  { href: "/confidentialitate", label: "Confidențialitate" },
];

export function Footer() {
  const { t } = useSettings();

  return (
    <footer className="relative mt-auto overflow-hidden border-t border-white/10 bg-navy">
      <BrandMark
        variant="white"
        className="pointer-events-none absolute -left-10 -top-10 h-52 w-52 opacity-[0.05]"
      />
      <div className="relative mx-auto max-w-6xl px-5 py-14">
        <div className="flex flex-col justify-between gap-10 sm:flex-row">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5">
              <BrandMark variant="white" className="h-9 w-9 shrink-0" />
              <span className="font-display text-base font-black leading-tight tracking-tight text-white">
                ACDR
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white/60">{t.footer.tagline}</p>
          </div>

          <nav className="grid grid-cols-2 gap-x-10 gap-y-2.5 sm:flex sm:flex-col">
            {LINKURI.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-white/60 transition-all duration-200 hover:translate-x-0.5 hover:text-white"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-12 flex flex-col justify-between gap-2 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-white/40">{t.footer.dataSource}</p>
          <p className="font-mono-num text-xs text-white/40">
            © {new Date().getFullYear()} ACDR
          </p>
        </div>
      </div>
    </footer>
  );
}
