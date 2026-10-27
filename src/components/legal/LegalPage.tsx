import Link from "next/link";
import type { ReactNode } from "react";
import { DATA_DOCUMENTE_LEGALE, esteDeCompletat } from "@/lib/legal";

export interface SectiuneLegala {
  id: string;
  titlu: string;
  continut: ReactNode;
}

const DOCUMENTE = [
  { href: "/termeni", label: "Termeni și condiții" },
  { href: "/confidentialitate", label: "Politica de confidențialitate" },
  { href: "/cookies", label: "Politica de cookie-uri" },
  { href: "/regulament", label: "Regulamentul comunității" },
];

/**
 * Sablon comun pentru paginile legale: titlu, data actualizarii, cuprins
 * (lipit in stanga pe desktop) si sectiuni numerotate cu ancore (#id).
 */
export function LegalPage({
  titlu,
  intro,
  versiune,
  sectiuni,
  activ,
}: {
  titlu: string;
  intro: ReactNode;
  versiune?: string;
  sectiuni: SectiuneLegala[];
  activ: string;
}) {
  return (
    <div className="mx-auto max-w-6xl px-5 py-10 md:py-16">
      <nav aria-label="Documente legale" className="-mx-5 mb-8 overflow-x-auto px-5 [scrollbar-width:none]">
        <ul className="flex gap-2">
          {DOCUMENTE.map((d) => (
            <li key={d.href} className="shrink-0">
              <Link
                href={d.href}
                aria-current={d.href === activ ? "page" : undefined}
                className={`inline-flex min-h-10 items-center rounded-full px-4 text-sm font-semibold transition-colors ${
                  d.href === activ ? "bg-primary text-primary-content" : "border border-line bg-surface text-ink hover:border-seal"
                }`}
              >
                {d.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="grid gap-10 md:grid-cols-[15rem_1fr] md:gap-14">
        <aside className="hidden md:block">
          <div className="sticky top-24">
            <p className="stamp-label text-ink-soft">Cuprins</p>
            <ol className="mt-3 space-y-1.5 text-sm">
              {sectiuni.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="flex gap-2 text-ink-soft hover:text-seal">
                    <span className="tabular-nums text-ink-soft/70">{i + 1}.</span>
                    <span>{s.titlu}</span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </aside>

        <article className="min-w-0 max-w-3xl">
          <h1 className="text-[2.25rem] leading-tight text-ink md:text-5xl">{titlu}</h1>
          <p className="mt-3 text-sm text-ink-soft">
            Ultima actualizare: {DATA_DOCUMENTE_LEGALE}
            {versiune ? ` · Versiunea ${versiune}` : ""}
          </p>
          <div className="mt-6 text-base leading-relaxed text-ink-soft">{intro}</div>

          <div className="legal-prose mt-10 space-y-10">
            {sectiuni.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="text-2xl leading-tight text-ink">
                  <span className="mr-2 tabular-nums text-seal">{i + 1}.</span>
                  {s.titlu}
                </h2>
                <div className="mt-3 space-y-3 text-[0.9375rem] leading-relaxed text-ink">{s.continut}</div>
              </section>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}

/** Afiseaza o valoare din OPERATOR; daca e inca de completat, o evidentiaza. */
export function Val({ v }: { v: string }) {
  return esteDeCompletat(v) ? (
    <mark className="rounded bg-gold-pale px-1 font-semibold text-gold-ink">{v}</mark>
  ) : (
    <>{v}</>
  );
}

/** Tabel simplu, cu derulare orizontala pe telefon. */
export function TabelLegal({ cap, randuri }: { cap: string[]; randuri: ReactNode[][] }) {
  return (
    <div className="-mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">
      <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-line-strong">
            {cap.map((c) => (
              <th key={c} scope="col" className="py-2.5 pr-4 font-bold text-ink">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {randuri.map((r, i) => (
            <tr key={i} className="border-b border-line align-top">
              {r.map((c, j) => (
                <td key={j} className="py-2.5 pr-4 text-ink-soft">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
