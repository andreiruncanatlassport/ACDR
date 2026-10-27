"use client";

import Link from "next/link";
import { BrandMark } from "@/components/ui/BrandMark";
import { useSettings } from "@/lib/settings/context";
import { OPERATOR, esteDeCompletat } from "@/lib/legal";

const PLATFORMA = [
  { href: "/catalog", label: "Catalog firme" },
  { href: "/membri", label: "Membri" },
  { href: "/oportunitati", label: "Proiecte" },
  { href: "/evenimente", label: "Evenimente" },
  { href: "/stiri", label: "Știri" },
];

const LEGAL = [
  { href: "/termeni", label: "Termeni și condiții" },
  { href: "/confidentialitate", label: "Politica de confidențialitate" },
  { href: "/cookies", label: "Politica de cookie-uri" },
  { href: "/regulament", label: "Regulamentul comunității" },
];

/** Datele operatorului: ascundem campurile inca necompletate, ca subsolul sa nu arate „[CUI]”. */
function identificare(): string {
  return [
    OPERATOR.denumire,
    !esteDeCompletat(OPERATOR.cui) && `CUI ${OPERATOR.cui}`,
    !esteDeCompletat(OPERATOR.nrRegistru) && OPERATOR.nrRegistru,
    !esteDeCompletat(OPERATOR.sediu) && OPERATOR.sediu,
  ]
    .filter((x): x is string => Boolean(x) && !esteDeCompletat(x as string))
    .join(" · ");
}

export function Footer() {
  const { t } = useSettings();
  const operator = identificare();

  return (
    <footer className="relative mt-auto overflow-hidden border-t border-white/10 bg-navy">
      <BrandMark
        variant="white"
        className="pointer-events-none absolute -left-10 -top-10 h-52 w-52 opacity-[0.05]"
      />
      <div className="relative mx-auto max-w-6xl px-5 py-12 md:py-14">
        <div className="grid gap-10 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5">
              <BrandMark variant="white" className="h-9 w-9 shrink-0" />
              <span className="font-sans text-base font-extrabold leading-tight tracking-tight text-white">ACDR</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white/70">{t.footer.tagline}</p>
            {!esteDeCompletat(OPERATOR.email) && (
              <a href={`mailto:${OPERATOR.email}`} className="mt-4 inline-block text-sm font-semibold text-white hover:underline">
                {OPERATOR.email}
              </a>
            )}
          </div>

          <nav aria-label="Platforma">
            <p className="stamp-label text-white/60">Platforma</p>
            <ul className="mt-3 space-y-1">
              {PLATFORMA.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="inline-flex min-h-9 items-center text-sm text-white/75 hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Informații legale">
            <p className="stamp-label text-white/60">Legal</p>
            <ul className="mt-3 space-y-1">
              {LEGAL.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="inline-flex min-h-9 items-center text-sm text-white/75 hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href="https://anpc.ro"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-9 items-center text-sm text-white/75 hover:text-white"
                >
                  ANPC
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col justify-between gap-2 border-t border-white/10 pt-6 text-xs text-white/55 sm:flex-row">
          <p>{t.footer.dataSource}</p>
          <p className="tabular-nums">
            © {new Date().getFullYear()} {operator && !esteDeCompletat(OPERATOR.denumire) ? operator : "ACDR"}
          </p>
        </div>
      </div>
    </footer>
  );
}
