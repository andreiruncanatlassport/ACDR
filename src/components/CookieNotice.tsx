"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Mesaj de informare despre cookie-uri, la prima vizita.
 *
 * ACDR foloseste DOAR cookie-uri strict necesare (autentificare, limba, anti-spam),
 * pentru care Legea 506/2004 art. 4 alin. (5) nu cere acord prealabil, doar
 * informare. De aceea aici e un mesaj cu „Am inteles”, nu un panou de acord.
 *
 * Daca se adauga vreodata analytics sau alte cookie-uri ne-necesare, acesta
 * trebuie inlocuit cu un panou de acord (Accept / Refuz, la fel de vizibile),
 * iar scripturile respective incarcate doar dupa acord.
 */
const CHEIE = "acdr-cookie-info-v1";

export function CookieNotice() {
  const [vizibil, setVizibil] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(CHEIE)) setVizibil(true);
    } catch {
      // localStorage indisponibil (mod privat): aratam mesajul o data pe sesiune
      setVizibil(true);
    }
  }, []);

  function inchide() {
    try {
      window.localStorage.setItem(CHEIE, new Date().toISOString());
    } catch {
      /* ignoram: mesajul dispare oricum pentru sesiunea curenta */
    }
    setVizibil(false);
  }

  if (!vizibil) return null;

  return (
    <div
      role="region"
      aria-label="Informare despre cookie-uri"
      className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-xl rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-xl)] md:inset-x-auto md:bottom-6 md:left-6 md:mx-0 md:max-w-md"
    >
      <p className="text-sm leading-relaxed text-ink">
        Folosim doar cookie-uri strict necesare: ca să rămâi autentificat, să ținem minte limba aleasă și să oprim
        conturile false. Fără reclame și fără urmărire.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={inchide}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-content transition hover:brightness-110"
        >
          Am înțeles
        </button>
        <Link
          href="/cookies"
          className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-bold text-seal hover:underline"
        >
          Detalii
        </Link>
      </div>
    </div>
  );
}
