"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Minus, Plus, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

/**
 * Editor simplu de poză: încadrare la un raport fix (implicit 16:9) și zoom.
 * - mutare: tragi cu mouse-ul sau cu degetul;
 * - zoom: slider, rotița mouse-ului sau ciupire cu două degete;
 * - rezultat: JPEG la `latimeIesire` px (implicit 1600 × 900), gata de încărcat.
 *
 * Fără biblioteci externe: totul e pe <canvas>.
 */

const ZOOM_MAX = 4;

interface Props {
  src: string;
  raport?: number;
  latimeIesire?: number;
  titlu?: string;
  onRenunta: () => void;
  onGata: (fisier: File) => void | Promise<void>;
}

export function ImageCropper({
  src,
  raport = 16 / 9,
  latimeIesire = 1600,
  titlu = "Încadrează poza",
  onRenunta,
  onGata,
}: Props) {
  const cadruRef = useRef<HTMLDivElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [eroare, setEroare] = useState<string | null>(null);
  const [cadru, setCadru] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [poz, setPoz] = useState({ x: 0, y: 0 });
  const [seSalveaza, setSeSalveaza] = useState(false);
  const pointeri = useRef(new Map<number, { x: number; y: number }>());
  const ciupireStart = useRef<{ dist: number; zoom: number } | null>(null);

  // Incarcam imaginea. crossOrigin e necesar ca sa putem citi pixelii din
  // canvas si pentru pozele deja salvate in Supabase Storage.
  useEffect(() => {
    const i = new window.Image();
    i.crossOrigin = "anonymous";
    i.onload = () => setImg(i);
    i.onerror = () => setEroare("Nu am putut deschide poza. Încarcă din nou fișierul.");
    i.src = src;
  }, [src]);

  // Masuram cadrul (se adapteaza la latimea ecranului).
  useEffect(() => {
    const el = cadruRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setCadru({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scaraBaza = img && cadru.w ? Math.max(cadru.w / img.naturalWidth, cadru.h / img.naturalHeight) : 1;
  const scara = scaraBaza * zoom;
  const lat = img ? img.naturalWidth * scara : 0;
  const ina = img ? img.naturalHeight * scara : 0;

  const limiteaza = useCallback(
    (x: number, y: number, l = lat, h = ina) => ({
      x: Math.min(0, Math.max(cadru.w - l, x)),
      y: Math.min(0, Math.max(cadru.h - h, y)),
    }),
    [cadru.w, cadru.h, lat, ina]
  );

  // La prima incarcare (sau cand se schimba cadrul), centram imaginea.
  useEffect(() => {
    if (!img || !cadru.w) return;
    const l = img.naturalWidth * scaraBaza;
    const h = img.naturalHeight * scaraBaza;
    setZoom(1);
    setPoz({ x: (cadru.w - l) / 2, y: (cadru.h - h) / 2 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [img, cadru.w, cadru.h]);

  /** Zoom pastrand fix punctul (px, py) din cadru (implicit centrul). */
  const aplicaZoom = useCallback(
    (z: number, px = cadru.w / 2, py = cadru.h / 2) => {
      if (!img) return;
      const nou = Math.min(ZOOM_MAX, Math.max(1, z));
      const factor = nou / zoom;
      const l = img.naturalWidth * scaraBaza * nou;
      const h = img.naturalHeight * scaraBaza * nou;
      const x = px - (px - poz.x) * factor;
      const y = py - (py - poz.y) * factor;
      setZoom(nou);
      setPoz(limiteaza(x, y, l, h));
    },
    [img, zoom, poz, scaraBaza, cadru.w, cadru.h, limiteaza]
  );

  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointeri.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointeri.current.size === 2) {
      const [a, b] = [...pointeri.current.values()];
      ciupireStart.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom };
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    const prev = pointeri.current.get(e.pointerId);
    if (!prev) return;
    pointeri.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointeri.current.size === 2 && ciupireStart.current) {
      const [a, b] = [...pointeri.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const r = cadruRef.current!.getBoundingClientRect();
      aplicaZoom(ciupireStart.current.zoom * (dist / ciupireStart.current.dist), (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
      return;
    }
    if (pointeri.current.size === 1) {
      setPoz((p) => limiteaza(p.x + e.clientX - prev.x, p.y + e.clientY - prev.y));
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    pointeri.current.delete(e.pointerId);
    if (pointeri.current.size < 2) ciupireStart.current = null;
  }

  function onWheel(e: React.WheelEvent) {
    const r = cadruRef.current!.getBoundingClientRect();
    aplicaZoom(zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08), e.clientX - r.left, e.clientY - r.top);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const pas = 10;
    if (e.key === "ArrowLeft") setPoz((p) => limiteaza(p.x + pas, p.y));
    else if (e.key === "ArrowRight") setPoz((p) => limiteaza(p.x - pas, p.y));
    else if (e.key === "ArrowUp") setPoz((p) => limiteaza(p.x, p.y + pas));
    else if (e.key === "ArrowDown") setPoz((p) => limiteaza(p.x, p.y - pas));
    else if (e.key === "+" || e.key === "=") aplicaZoom(zoom + 0.1);
    else if (e.key === "-") aplicaZoom(zoom - 0.1);
    else return;
    e.preventDefault();
  }

  async function salveaza() {
    if (!img || !cadru.w) return;
    setSeSalveaza(true);
    setEroare(null);
    try {
      // Zona aleasa, in pixelii imaginii originale.
      const sx = -poz.x / scara;
      const sy = -poz.y / scara;
      const sw = cadru.w / scara;
      const sh = cadru.h / scara;
      // Nu marim artificial o poza mica: iesirea e cel mult cat zona aleasa.
      const outW = Math.round(Math.min(latimeIesire, sw));
      const outH = Math.round(outW / raport);
      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.9));
      if (!blob) throw new Error("Nu am putut genera poza.");
      await onGata(new File([blob], `eveniment-${Date.now()}.jpg`, { type: "image/jpeg" }));
    } catch (e) {
      setEroare(
        e instanceof DOMException
          ? "Poza existentă nu poate fi editată direct. Alege din nou fișierul de pe calculator."
          : e instanceof Error
            ? e.message
            : "Eroare la salvarea pozei."
      );
    } finally {
      setSeSalveaza(false);
    }
  }

  // Esc inchide editorul.
  useEffect(() => {
    const f = (e: KeyboardEvent) => e.key === "Escape" && onRenunta();
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [onRenunta]);

  return (
    <div role="dialog" aria-modal="true" aria-label={titlu} className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 sm:items-center sm:p-6">
      <div className="flex max-h-full w-full max-w-2xl flex-col gap-4 overflow-y-auto rounded-t-3xl bg-surface p-5 shadow-[var(--shadow-xl)] sm:rounded-3xl">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-sans text-lg font-bold text-ink">{titlu}</h2>
          <button type="button" onClick={onRenunta} aria-label="Închide" className="flex h-11 w-11 items-center justify-center rounded-xl text-ink-soft hover:bg-ink/6">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          ref={cadruRef}
          tabIndex={0}
          aria-label="Zona de încadrare. Trage poza sau folosește săgețile; + și - pentru zoom."
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
          onKeyDown={onKeyDown}
          style={{ aspectRatio: String(raport) }}
          className="relative w-full cursor-grab touch-none select-none overflow-hidden rounded-2xl bg-[#13241C] outline-none focus-visible:ring-2 focus-visible:ring-seal active:cursor-grabbing"
        >
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt=""
              draggable={false}
              crossOrigin="anonymous"
              style={{ position: "absolute", left: 0, top: 0, width: lat, height: ina, transform: `translate(${poz.x}px, ${poz.y}px)`, maxWidth: "none" }}
            />
          ) : (
            !eroare && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-white/70" />
              </div>
            )
          )}
          {/* grila de treimi, ca ajutor la incadrare */}
          <div aria-hidden className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <span key={i} className="border-[0.5px] border-white/25" />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="button" onClick={() => aplicaZoom(zoom - 0.2)} aria-label="Micșorează" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line text-ink hover:bg-ink/6">
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="range"
            min={1}
            max={ZOOM_MAX}
            step={0.01}
            value={zoom}
            onChange={(e) => aplicaZoom(Number(e.target.value))}
            aria-label="Zoom"
            className="h-11 flex-1 accent-[var(--color-seal)]"
          />
          <button type="button" onClick={() => aplicaZoom(zoom + 0.2)} aria-label="Mărește" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line text-ink hover:bg-ink/6">
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (!img) return;
              setZoom(1);
              setPoz({ x: (cadru.w - img.naturalWidth * scaraBaza) / 2, y: (cadru.h - img.naturalHeight * scaraBaza) / 2 });
            }}
            aria-label="Resetează încadrarea"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line text-ink hover:bg-ink/6"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-ink-soft">
          Trage poza ca s-o muți; folosește bara, rotița sau două degete pentru zoom. Se salvează la format 16:9.
        </p>

        {eroare && <p className="text-sm font-semibold text-rust">{eroare}</p>}

        <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onRenunta} disabled={seSalveaza}>
            Renunță
          </Button>
          <Button variant="primary" onClick={salveaza} disabled={!img || seSalveaza}>
            {seSalveaza && <Loader2 className="h-4 w-4 animate-spin" />}
            Folosește poza
          </Button>
        </div>
      </div>
    </div>
  );
}
