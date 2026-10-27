"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

/**
 * Banner de instalare "Adaugă pe ecranul principal", vizibil doar pe mobil.
 *
 * De ce arata diferit pe Android/Chrome fata de iOS/Safari:
 * - Android/Chrome/Edge expun evenimentul `beforeinstallprompt`, care ne lasa
 *   sa declansam noi, programatic, promptul nativ de instalare (buton
 *   "Instalează" care chiar face treaba).
 * - iOS Safari NU expune acest API deloc (limitare Apple) — singura cale de
 *   instalare acolo e manual, prin Distribuire -> "Adaugă pe ecranul
 *   principal", asa ca ii aratam userului exact pasii, fara buton magic.
 *
 * Daca aplicatia ruleaza deja instalata (standalone), bannerul nu apare deloc.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const CHEIE_ASCUNS = "acdr_install_banner_ascuns_la";
const ZILE_PANA_REAPARE = 14;

function ruleazaInstalata(): boolean {
  const standalone = window.matchMedia?.("(display-mode: standalone)").matches;
  const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone;
  return Boolean(standalone || iosStandalone);
}

function esteIOS(): boolean {
  const ua = window.navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) && !("MSStream" in window);
}

/** Stare initiala calculata sincron, o singura data, la prima randare pe
    client — evitam sa apelam setState dintr-un efect (anti-pattern React). */
function calculeazaStareaInitiala(): { vizibil: boolean; iOS: boolean } {
  if (typeof window === "undefined") return { vizibil: false, iOS: false };
  if (ruleazaInstalata()) return { vizibil: false, iOS: false };

  try {
    const ascunsLa = window.localStorage.getItem(CHEIE_ASCUNS);
    if (ascunsLa) {
      const zilePasate = (Date.now() - Number(ascunsLa)) / (1000 * 60 * 60 * 24);
      if (zilePasate < ZILE_PANA_REAPARE) return { vizibil: false, iOS: false };
    }
  } catch {
    // fara localStorage (mod privat etc.) — aratam bannerul oricum
  }

  if (esteIOS()) return { vizibil: true, iOS: true };
  return { vizibil: false, iOS: false }; // pe Android/Chrome asteptam beforeinstallprompt
}

export function InstallAppBanner() {
  const [{ vizibil, iOS }, setStare] = useState(calculeazaStareaInitiala);
  const [promptEveniment, setPromptEveniment] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setPromptEveniment(e as BeforeInstallPromptEvent);
      setStare({ vizibil: true, iOS: false });
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  function ascunde() {
    setStare((s) => ({ ...s, vizibil: false }));
    try {
      window.localStorage.setItem(CHEIE_ASCUNS, String(Date.now()));
    } catch {
      // ignoram — nu e critic daca nu persista
    }
  }

  async function instaleaza() {
    if (!promptEveniment) return;
    await promptEveniment.prompt();
    const alegere = await promptEveniment.userChoice;
    setPromptEveniment(null);
    if (alegere.outcome === "accepted") setStare((s) => ({ ...s, vizibil: false }));
  }

  if (!vizibil) return null;

  return (
    <div className="border-b border-line bg-surface md:hidden">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element -- iconita mica, statica, nu justifica next/image aici */}
        <img
          src="/icon-192.png"
          alt=""
          className="h-9 w-9 shrink-0 rounded-xl shadow-[var(--shadow-sm)]"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">Adaugă ACDR pe ecranul principal</p>
          <p className="truncate text-xs text-ink-soft">
            {iOS
              ? "Apasă Distribuire, apoi „Adaugă pe ecranul principal”."
              : "Acces rapid, ca o aplicație — fără browser."}
          </p>
        </div>
        {!iOS && (
          <button
            type="button"
            onClick={instaleaza}
            className="shrink-0 rounded-full gradient-seal px-3.5 py-1.5 text-xs font-semibold text-primary-content shadow-[var(--shadow-sm)]"
          >
            Instalează
          </button>
        )}
        <button
          type="button"
          onClick={ascunde}
          aria-label="Închide"
          className="shrink-0 rounded-full p-1.5 text-ink-soft/60 transition hover:bg-ink/6 hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
