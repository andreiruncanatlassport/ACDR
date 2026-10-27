import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Wifi, CalendarDays, Users2, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { Badge } from "@/components/ui/Card";
import { EventRsvpButton } from "@/components/EventRsvpButton";
import type { EventItem } from "@/types/database";
import { formatData, formatOra } from "@/lib/evenimente-data";

/** „14 noiembrie 2026 · 18:30–21:00”, „14–15 noiembrie 2026”, „14 noiembrie 2026” — ora Romaniei, 24h. */
function intervalEveniment(e: EventItem, locale: string): string {
  const optiuniData: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
  const dataStart = formatData(e.data_inceput, locale, optiuniData);
  const oraStart = e.are_ora_inceput !== false ? formatOra(e.data_inceput, locale) : null;
  if (!e.data_sfarsit) return oraStart ? `${dataStart} · ${oraStart}` : dataStart;
  const dataSf = formatData(e.data_sfarsit, locale, optiuniData);
  const oraSf = e.are_ora_sfarsit !== false ? formatOra(e.data_sfarsit, locale) : null;
  if (dataSf === dataStart) {
    if (oraStart && oraSf) return `${dataStart} · ${oraStart}–${oraSf}`;
    return oraStart ? `${dataStart} · ${oraStart}` : dataStart;
  }
  const st = oraStart ? `${dataStart}, ${oraStart}` : dataStart;
  const sf = oraSf ? `${dataSf}, ${oraSf}` : dataSf;
  return `${st} – ${sf}`;
}

export default async function EvenimentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { t, locale } = await getT();
  const dateLocale = locale === "en" ? "en-US" : "ro-RO";

  const TIP_LABEL: Record<string, string> = {
    conferinta: t.events.typeConference,
    workshop: t.events.typeWorkshop,
    networking: t.events.typeNetworking,
    altul: t.events.typeOther,
  };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .in("status", ["publicat", "anulat"])
    .maybeSingle();

  const eveniment = data as EventItem | null;
  if (!eveniment) notFound();

  const { count: inscrisiCount } = await supabase
    .from("event_registrations")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eveniment.id);

  let inscrisEu = false;
  if (user) {
    const { data: mine } = await supabase
      .from("event_registrations")
      .select("id")
      .eq("event_id", eveniment.id)
      .eq("profile_id", user.id)
      .maybeSingle();
    inscrisEu = Boolean(mine);
  }

  const plin = Boolean(eveniment.capacitate && (inscrisiCount ?? 0) >= eveniment.capacitate && !inscrisEu);
  const paragrafe = eveniment.descriere.split(/\n{2,}/).filter(Boolean);

  return (
    <article className="mx-auto max-w-3xl px-5 py-12">
      <Link href="/evenimente" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-seal">
        <ArrowLeft className="h-4 w-4" /> {t.events.allEvents}
      </Link>

      {eveniment.imagine_url && (
        <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-2xl bg-navy">
          <Image src={eveniment.imagine_url} alt="" fill className="object-cover" unoptimized />
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-1.5">
        <Badge tone="seal">{TIP_LABEL[eveniment.tip] ?? t.events.typeOther}</Badge>
        {eveniment.status === "anulat" && <Badge tone="danger">{t.events.cancelled}</Badge>}
      </div>

      <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">{eveniment.titlu}</h1>

      <div className="mt-5 flex flex-wrap items-center gap-1.5">
        <Badge tone="neutral">
          <CalendarDays className="h-3 w-3" />
          {intervalEveniment(eveniment, dateLocale)}
        </Badge>
        {eveniment.online ? (
          <Badge tone="success">
            <Wifi className="h-3 w-3" /> {t.events.online}
          </Badge>
        ) : eveniment.locatie ? (
          <Badge tone="neutral">
            <MapPin className="h-3 w-3" /> {eveniment.locatie}
          </Badge>
        ) : null}
        {typeof eveniment.capacitate === "number" && (
          <Badge tone={plin ? "danger" : "warning"}>
            <Users2 className="h-3 w-3" /> {inscrisiCount ?? 0}/{eveniment.capacitate} {t.events.seatsLeft}
          </Badge>
        )}
      </div>

      <div className="mt-8 space-y-4 text-[15px] leading-relaxed text-ink">
        {paragrafe.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {eveniment.link_extern && (
        <a
          href={eveniment.link_extern}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-seal hover:underline"
        >
          {t.events.externalLink} <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}

      {eveniment.status !== "anulat" && (
        <div className="mt-10 border-t border-line pt-8">
          <EventRsvpButton eventId={eveniment.id} initialInscris={inscrisEu} plin={plin} autentificat={Boolean(user)} />
        </div>
      )}
    </article>
  );
}
