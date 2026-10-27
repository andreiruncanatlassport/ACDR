import { CalendarDays, PenLine } from "lucide-react";
import { inceputulZileiDeAzi } from "@/lib/evenimente-data";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { EventCard, type EventCardData } from "@/components/EventCard";
import { LinkButton } from "@/components/ui/Button";

export const metadata = { title: "Evenimente — ACDR" };

interface EventRow extends EventCardData {
  id: string;
}

/** Evenimentele de azi raman la „viitoare” toata ziua (inclusiv cele fara ora). */
function acumIso(): number {
  return new Date(inceputulZileiDeAzi()).getTime();
}

export default async function EvenimentePage() {
  const supabase = await createClient();
  const { t, locale } = await getT();
  const dateLocale = locale === "en" ? "en-US" : "ro-RO";
  const labels = {
    conferinta: t.events.typeConference,
    workshop: t.events.typeWorkshop,
    networking: t.events.typeNetworking,
    altul: t.events.typeOther,
    online: t.events.online,
    full: t.events.full,
    seatsSuffix: t.events.seatsLeft,
    cancelled: t.events.cancelled,
  };

  const { data } = await supabase
    .from("events")
    .select("id, slug, titlu, imagine_url, tip, locatie, online, data_inceput, are_ora_inceput, status, capacitate")
    .in("status", ["publicat", "anulat"])
    .order("data_inceput", { ascending: true })
    .limit(100);

  const evenimente = (data as EventRow[]) ?? [];
  const acum = acumIso();
  const viitoare = evenimente.filter((e) => new Date(e.data_inceput).getTime() >= acum);
  const trecute = evenimente.filter((e) => new Date(e.data_inceput).getTime() < acum);

  let inscrieriMap = new Map<string, number>();
  if (evenimente.length > 0) {
    const { data: inscrieriData } = await supabase
      .from("event_registrations")
      .select("event_id")
      .in("event_id", evenimente.map((e) => e.id));
    const rows = (inscrieriData as { event_id: string }[]) ?? [];
    inscrieriMap = rows.reduce((m, r) => m.set(r.event_id, (m.get(r.event_id) ?? 0) + 1), new Map<string, number>());
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          <p className="stamp-label text-seal">{t.events.eyebrow}</p>
          <h1 className="mt-2 flex items-center gap-2.5 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            <CalendarDays className="h-7 w-7 text-seal" strokeWidth={1.8} />
            {t.events.title}
          </h1>
          <p className="mt-3 text-base text-ink-soft">{t.events.subtitle}</p>
        </div>
        <LinkButton href="/evenimente/propune" variant="secondary" size="sm" className="shrink-0">
          <PenLine className="h-4 w-4" />
          Propune un eveniment
        </LinkButton>
      </div>

      <section className="mt-10">
        {viitoare.length === 0 ? (
          <p className="text-sm text-ink-soft">{t.events.empty}</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {viitoare.map((e) => (
              <EventCard key={e.id} event={{ ...e, inscrisi: inscrieriMap.get(e.id) ?? 0 }} labels={labels} dateLocale={dateLocale} />
            ))}
          </div>
        )}
      </section>

      {trecute.length > 0 && (
        <section className="mt-14">
          <p className="stamp-label text-ink-soft">{t.events.pastEvents}</p>
          <div className="mt-4 grid gap-5 opacity-70 sm:grid-cols-2 lg:grid-cols-3">
            {trecute.slice(0, 6).map((e) => (
              <EventCard key={e.id} event={{ ...e, inscrisi: inscrieriMap.get(e.id) ?? 0 }} labels={labels} dateLocale={dateLocale} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
