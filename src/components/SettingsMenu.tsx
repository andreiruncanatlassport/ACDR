"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Settings, Sun, Moon, Check } from "lucide-react";
import { useSettings, type FontChoice, type FontSize } from "@/lib/settings/context";

const FONTURI: { id: FontChoice; label_ro: string; label_en: string }[] = [
  { id: "sistem", label_ro: "Modern (implicit)", label_en: "Modern (default)" },
  { id: "clasic", label_ro: "Clasic (serif)", label_en: "Classic (serif)" },
  { id: "rotunjit", label_ro: "Rotunjit", label_en: "Rounded" },
];

const MARIMI: { id: FontSize; label_ro: string; label_en: string }[] = [
  { id: "mic", label_ro: "Mic", label_en: "Small" },
  { id: "normal", label_ro: "Normal", label_en: "Normal" },
  { id: "mare", label_ro: "Mare", label_en: "Large" },
];

export function SettingsMenu() {
  const { locale, setLocale, theme, setTheme, font, setFont, fontSize, setFontSize } = useSettings();
  const [deschis, setDeschis] = useState(false);
  const [pozitie, setPozitie] = useState<{ top: number; right: number } | null>(null);
  const butonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Nu e nevoie de un state separat de "montat pe client" pentru portal:
  // `deschis` porneste mereu `false` si devine `true` DOAR printr-un click de
  // mouse (in `comuta`), ceea ce nu se poate intampla in timpul randarii pe
  // server — deci createPortal nu ajunge niciodata sa ruleze inainte de a
  // exista `document` in browser.

  useEffect(() => {
    function onClickInAfara(e: MouseEvent) {
      const tinta = e.target as Node;
      if (panelRef.current?.contains(tinta) || butonRef.current?.contains(tinta)) return;
      setDeschis(false);
    }
    function onScrollSauResize() {
      // Header-ul e sticky — la scroll pozitia butonului se poate schimba;
      // cel mai simplu si mai predictibil e sa inchidem panoul, nu sa
      // recalculam pozitia in continuu.
      setDeschis(false);
    }
    document.addEventListener("mousedown", onClickInAfara);
    window.addEventListener("scroll", onScrollSauResize, { passive: true, capture: true });
    window.addEventListener("resize", onScrollSauResize);
    return () => {
      document.removeEventListener("mousedown", onClickInAfara);
      window.removeEventListener("scroll", onScrollSauResize, true);
      window.removeEventListener("resize", onScrollSauResize);
    };
  }, []);

  function comuta() {
    if (!deschis && butonRef.current) {
      const rect = butonRef.current.getBoundingClientRect();
      setPozitie({ top: rect.bottom + 10, right: Math.max(12, window.innerWidth - rect.right) });
    }
    setDeschis((v) => !v);
  }

  const ro = locale === "ro";

  const panou = (
    <div
      ref={panelRef}
      // Randat prin portal direct in <body>, NU ca descendent al header-ului
      // (care are backdrop-blur + transparenta pe fundalul sau) — asa evitam
      // definitiv orice "sangerare" vizuala a blur-ului prin panou pe mobil,
      // indiferent de browser sau tema (light/dark). Fundalul e fortat opac
      // dublu: si prin clasa bg-surface, si explicit prin style, ca sa nu
      // depinda de nicio motenire/compunere CSS din alta parte a paginii.
      className="fixed z-[100] w-72 rounded-2xl border border-line bg-surface p-5 text-ink shadow-[var(--shadow-xl)]"
      style={{
        top: pozitie?.top ?? 0,
        right: pozitie?.right ?? 0,
        backgroundColor: "var(--surface)",
        opacity: 1,
        backdropFilter: "none",
        WebkitBackdropFilter: "none",
      }}
    >
      {/* Limba */}
      <div>
        <p className="stamp-label text-ink-soft">
          {ro ? "Limbă" : "Language"}
        </p>
        <div className="mt-2 flex rounded-xl border border-line bg-ink/4 p-1">
          <button
            onClick={() => setLocale("ro")}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              ro ? "gradient-seal text-primary-content shadow-[var(--shadow-sm)]" : "text-ink-soft hover:text-ink"
            }`}
          >
            Română
          </button>
          <button
            onClick={() => setLocale("en")}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              !ro ? "gradient-seal text-primary-content shadow-[var(--shadow-sm)]" : "text-ink-soft hover:text-ink"
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* Tema */}
      <div className="mt-4">
        <p className="stamp-label text-ink-soft">
          {ro ? "Temă" : "Theme"}
        </p>
        <div className="mt-2 flex rounded-xl border border-line bg-ink/4 p-1">
          <button
            onClick={() => setTheme("light")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              theme === "light" ? "gradient-seal text-primary-content shadow-[var(--shadow-sm)]" : "text-ink-soft hover:text-ink"
            }`}
          >
            <Sun className="h-3.5 w-3.5" /> {ro ? "Luminos" : "Light"}
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              theme === "dark" ? "gradient-seal text-primary-content shadow-[var(--shadow-sm)]" : "text-ink-soft hover:text-ink"
            }`}
          >
            <Moon className="h-3.5 w-3.5" /> {ro ? "Întunecat" : "Dark"}
          </button>
        </div>
      </div>

      {/* Font */}
      <div className="mt-4">
        <p className="stamp-label text-ink-soft">
          {ro ? "Font" : "Font"}
        </p>
        <div className="mt-2 space-y-1">
          {FONTURI.map((f) => (
            <button
              key={f.id}
              onClick={() => setFont(f.id)}
              className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm text-ink-soft transition hover:bg-ink/5 hover:text-ink"
            >
              {ro ? f.label_ro : f.label_en}
              {font === f.id && <Check className="h-3.5 w-3.5 text-seal" />}
            </button>
          ))}
        </div>
      </div>

      {/* Marime font */}
      <div className="mt-4">
        <p className="stamp-label text-ink-soft">
          {ro ? "Mărime text" : "Text size"}
        </p>
        <div className="mt-2 flex rounded-xl border border-line bg-ink/4 p-1">
          {MARIMI.map((m) => (
            <button
              key={m.id}
              onClick={() => setFontSize(m.id)}
              className={`flex-1 rounded-md px-2 py-1.5 text-sm font-medium transition ${
                fontSize === m.id ? "gradient-seal text-primary-content shadow-[var(--shadow-sm)]" : "text-ink-soft hover:text-ink"
              }`}
            >
              {ro ? m.label_ro : m.label_en}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative">
      <button
        ref={butonRef}
        onClick={comuta}
        className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
        aria-label={ro ? "Setări" : "Settings"}
      >
        <Settings className="h-[18px] w-[18px]" />
      </button>

      {deschis && pozitie && createPortal(panou, document.body)}
    </div>
  );
}
