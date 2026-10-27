"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, UserRound, Loader2, Download, Trash2 } from "lucide-react";
import { clsx } from "clsx";
import { useSettings } from "@/lib/settings/context";

interface MesajRow {
  id: string;
  sender_id: string;
  continut: string;
  created_at: string;
}

export function MessageThread({ conversationId, myProfileId }: { conversationId: string; myProfileId: string }) {
  const router = useRouter();
  const { t, locale } = useSettings();
  const dateLocale = locale === "en" ? "en-US" : "ro-RO";
  const [mesaje, setMesaje] = useState<MesajRow[] | null>(null);
  const [celalaltNume, setCelalaltNume] = useState<string>("");
  const [celalaltAvatar, setCelalaltAvatar] = useState<string | null>(null);
  const [celalaltProfileId, setCelalaltProfileId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [trimit, setTrimit] = useState(false);
  const [seSterge, setSeSterge] = useState(false);
  const [eroare, setEroare] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let anulat = false;
    async function incarca() {
      try {
        const res = await fetch(`/api/messages/${conversationId}`);
        const json = await res.json();
        if (anulat) return;
        if (!res.ok) {
          setEroare(json?.error ?? "Nu am putut încărca conversația.");
          return;
        }
        setMesaje(json.data.mesaje);
        setCelalaltNume(json.data.celalalt_nume);
        setCelalaltAvatar(json.data.celalalt_avatar);
        setCelalaltProfileId(json.data.celalalt_profile_id);
      } catch {
        // reincercam la urmatorul interval
      }
    }
    incarca();
    const interval = setInterval(incarca, 6000);
    return () => {
      anulat = true;
      clearInterval(interval);
    };
  }, [conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [mesaje]);

  async function trimite() {
    const continut = text.trim();
    if (!continut || trimit) return;
    setTrimit(true);
    setEroare(null);
    // optimist: adaugam mesajul local imediat
    const provizoriu: MesajRow = {
      id: `temp-${Date.now()}`,
      sender_id: myProfileId,
      continut,
      created_at: new Date().toISOString(),
    };
    setMesaje((prev) => [...(prev ?? []), provizoriu]);
    setText("");
    try {
      const res = await fetch(`/api/messages/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ continut }),
      });
      const json = await res.json();
      if (!res.ok) {
        setEroare(json?.error ?? "Mesajul nu a putut fi trimis.");
        return;
      }
      setMesaje((prev) => (prev ?? []).map((m) => (m.id === provizoriu.id ? json.data : m)));
    } finally {
      setTrimit(false);
    }
  }

  function exporta() {
    if (!mesaje || mesaje.length === 0) return;
    const eu = locale === "en" ? "Me" : "Eu";
    const celalalt = locale === "en" ? "The other person" : "Celălalt";
    const linii = mesaje.map((m) => {
      const cine = m.sender_id === myProfileId ? eu : celalaltNume || celalalt;
      const cand = new Date(m.created_at).toLocaleString(dateLocale);
      return `[${cand}] ${cine}: ${m.continut}`;
    });
    const antet =
      locale === "en"
        ? `Conversation with ${celalaltNume || "member"} — exported on ${new Date().toLocaleString(dateLocale)}`
        : `Conversație cu ${celalaltNume || "membru"} — exportat la ${new Date().toLocaleString(dateLocale)}`;
    const continutFisier = `${antet}\n\n${linii.join("\n")}\n`;
    const blob = new Blob([continutFisier], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${locale === "en" ? "conversation" : "conversatie"}-${(celalaltNume || "membru").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function sterge() {
    if (!confirm(t.messages.deleteConfirm)) return;
    setSeSterge(true);
    try {
      await fetch(`/api/messages/${conversationId}`, { method: "DELETE" });
      router.push("/mesaje");
      router.refresh();
    } finally {
      setSeSterge(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
        <Link href="/mesaje" className="rounded-lg p-1.5 text-ink-soft hover:bg-ink/5 hover:text-ink md:hidden">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-ink/5 ring-1 ring-inset ring-line">
          {celalaltAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={celalaltAvatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-ink-soft/40">
              <UserRound className="h-4 w-4" strokeWidth={1.5} />
            </div>
          )}
        </div>
        {celalaltProfileId ? (
          <Link href={`/membri/${celalaltProfileId}`} className="truncate text-sm font-semibold text-ink hover:text-seal">
            {celalaltNume || "..."}
          </Link>
        ) : (
          <p className="truncate text-sm font-semibold text-ink">{celalaltNume || "..."}</p>
        )}

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={exporta}
            disabled={!mesaje || mesaje.length === 0}
            title={t.messages.export}
            className="rounded-lg p-1.5 text-ink-soft/70 transition hover:bg-ink/6 hover:text-ink disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={sterge}
            disabled={seSterge}
            title={t.messages.delete}
            className="rounded-lg p-1.5 text-ink-soft/70 transition hover:bg-rust/10 hover:text-rust disabled:opacity-40"
          >
            {seSterge ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-2.5 overflow-y-auto px-4 py-4">
        {mesaje === null ? (
          <div className="space-y-2.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={clsx("h-9 w-2/5 animate-pulse rounded-2xl bg-ink/5", i % 2 === 0 ? "ml-auto" : "")} />
            ))}
          </div>
        ) : mesaje.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-soft">{t.messages.startConversation}</p>
        ) : (
          mesaje.map((m) => {
            const eSauMeu = m.sender_id === myProfileId;
            return (
              <div key={m.id} className={clsx("flex", eSauMeu ? "justify-end" : "justify-start")}>
                <div
                  className={clsx(
                    "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-[var(--shadow-sm)]",
                    eSauMeu ? "gradient-seal rounded-br-md text-primary-content" : "bg-surface text-ink border border-line rounded-bl-md"
                  )}
                >
                  {m.continut}
                </div>
              </div>
            );
          })
        )}
      </div>

      {eroare && <p className="px-4 pb-1 text-xs font-medium text-rust">{eroare}</p>}

      <div className="flex items-end gap-2 border-t border-line p-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              trimite();
            }
          }}
          placeholder={t.messages.typePlaceholder}
          rows={1}
          className="max-h-32 min-h-[42px] flex-1 resize-none rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-ink shadow-[inset_0_1px_2px_rgba(16,24,40,0.04)] outline-none transition-all duration-200 placeholder:text-ink-soft/60 focus:border-seal focus:ring-3 focus:ring-seal/12"
        />
        <button
          onClick={trimite}
          disabled={!text.trim() || trimit}
          className="press-on-click flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl gradient-seal text-primary-content shadow-[var(--shadow-md)] transition hover:shadow-[var(--shadow-lg)] disabled:cursor-not-allowed disabled:opacity-45"
          aria-label={t.messages.send}
        >
          {trimit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
