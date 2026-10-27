import Link from "next/link";
import Image from "next/image";
import { CalendarDays, MapPin, Wifi, Users2 } from "lucide-react";
import { Badge } from "@/components/ui/Card";
import { formatData, formatOra } from "@/lib/evenimente-data";

export interface EventCardData {
  slug: string;
  titlu: string;
  imagine_url: string | null;
  tip: string;
  locatie: string | null;
  online: boolean;
  data_inceput: string;
  /** false = evenimentul are doar data (fara ora) */
  are_ora_inceput?: boolean;
  status: string;
  inscrisi?: number;
  capacitate?: number | null;
}

export interface EventCardLabels {
  conferinta: string;
  workshop: string;
  networking: string;
  altul: string;
  online: string;
  full: string;
  seatsSuffix: string;
  cancelled: string;
}

const LABELS_IMPLICITE: EventCardLabels = {
  conferinta: "Conferință",
  workshop: "Workshop",
  networking: "Networking",
  altul: "Eveniment",
  online: "Online",
  full: "Locuri epuizate",
  seatsSuffix: "locuri",
  cancelled: "Anulat",
};

// Ora Romaniei si format de 24h (serverul ruleaza in UTC).
function ziLuna(iso: string, locale: string, areOra: boolean): { zi: string; luna: string; ora: string } {
  return {
    zi: formatData(iso, locale, { day: "2-digit" }),
    luna: formatData(iso, locale, { month: "short" }).replace(".", ""),
    ora: areOra
      ? `${formatData(iso, locale, { weekday: "short" }).replace(".", "")}, ${formatOra(iso, locale)}`
      : formatData(iso, locale, { weekday: "long" }),
  };
}

export function EventCard({
  event,
  labels = LABELS_IMPLICITE,
  dateLocale = "ro-RO",
}: {
  event: EventCardData;
  labels?: EventCardLabels;
  dateLocale?: string;
}) {
  const { zi, luna, ora } = ziLuna(event.data_inceput, dateLocale, event.are_ora_inceput !== false);
  const plin = Boolean(event.capacitate && (event.inscrisi ?? 0) >= event.capacitate);
  const tipLabel = (labels as unknown as Record<string, string>)[event.tip] ?? labels.altul;

  return (
    <Link href={`/evenimente/${event.slug}`} className="group block h-full active:scale-[0.98] transition-transform duration-150">
      <article className="lift-on-hover block-base relative flex h-full flex-col overflow-hidden p-0">
        <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-navy">
          {event.imagine_url ? (
            <Image src={event.imagine_url} alt="" fill className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized />
          ) : (
            <div className="absolute inset-0 grid-registry opacity-40" />
          )}
          {/* bloc de data, stil "carnet de bilet" */}
          <div className="absolute left-3 top-3 flex w-14 flex-col items-center rounded-xl bg-white/95 py-1.5 shadow-[var(--shadow-md)] backdrop-blur-sm">
            <span className="font-mono-num text-lg font-bold leading-none text-navy">{zi}</span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-seal">{luna}</span>
          </div>
          {event.status === "anulat" && (
            <span className="absolute right-3 top-3 rounded-full bg-rust px-2.5 py-1 text-xs font-bold text-white shadow-md">
              {labels.cancelled}
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col p-5">
          <p className="stamp-label text-seal">{tipLabel}</p>
          <h3 className="mt-1.5 text-base font-semibold leading-snug text-ink">{event.titlu}</h3>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <Badge tone="neutral">
              <CalendarDays className="h-3 w-3" /> {ora}
            </Badge>
            {event.online ? (
              <Badge tone="success">
                <Wifi className="h-3 w-3" /> {labels.online}
              </Badge>
            ) : event.locatie ? (
              <Badge tone="neutral">
                <MapPin className="h-3 w-3" /> {event.locatie}
              </Badge>
            ) : null}
            {typeof event.capacitate === "number" && (
              <Badge tone={plin ? "danger" : "warning"}>
                <Users2 className="h-3 w-3" />
                {plin ? labels.full : `${event.inscrisi ?? 0}/${event.capacitate} ${labels.seatsSuffix}`}
              </Badge>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
