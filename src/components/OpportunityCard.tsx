import Link from "next/link";
import Image from "next/image";
import { MapPin, MessageSquare, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/Card";
import type { OpportunityTip } from "@/types/database";

export interface OpportunityCardData {
  id: string;
  titlu: string;
  tip: OpportunityTip;
  imagine_url: string | null;
  judet_nume: string | null;
  buget_min: number | null;
  buget_max: number | null;
  termen_limita: string | null;
  status: "deschisa" | "inchisa";
  created_at: string;
  company_denumire: string | null;
  company_slug: string | null;
  company_logo_url: string | null;
  raspunsuri?: number;
}

export interface OpportunityCardLabels {
  proiect: string;
  achizitie: string;
  colaborare: string;
  cerere_servicii: string;
  closed: string;
  responseSingular: string;
  responses: string;
  companyFallback: string;
  until: string;
}

function bugetText(min: number | null, max: number | null): string | null {
  if (min && max) return `${min.toLocaleString("ro-RO")}–${max.toLocaleString("ro-RO")} €`;
  if (min) return `de la ${min.toLocaleString("ro-RO")} €`;
  if (max) return `până la ${max.toLocaleString("ro-RO")} €`;
  return null;
}

export function OpportunityCard({
  opportunity,
  labels,
  dateLocale = "ro-RO",
}: {
  opportunity: OpportunityCardData;
  labels: OpportunityCardLabels;
  dateLocale?: string;
}) {
  const tipLabel = (labels as unknown as Record<string, string>)[opportunity.tip] ?? opportunity.tip;
  const buget = bugetText(opportunity.buget_min, opportunity.buget_max);
  const raspunsuri = opportunity.raspunsuri ?? 0;

  return (
    <Link href={`/oportunitati/${opportunity.id}`} className="group block h-full active:scale-[0.98] transition-transform duration-150">
      <article className="lift-on-hover block-base relative flex h-full flex-col overflow-hidden p-0">
        <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-navy">
          {opportunity.imagine_url ? (
            <Image src={opportunity.imagine_url} alt="" fill className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized />
          ) : (
            <div className="absolute inset-0 grid-registry opacity-40" />
          )}
          {opportunity.status === "inchisa" && (
            <span className="absolute right-3 top-3 rounded-full bg-ink/70 px-2.5 py-1 text-xs font-bold text-white shadow-md backdrop-blur-sm">
              {labels.closed}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <p className="stamp-label text-seal">{tipLabel}</p>
          <h3 className="mt-1.5 text-base font-semibold leading-snug text-ink line-clamp-2">
            {opportunity.titlu}
          </h3>

          <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-ink-soft">
            <div className="relative h-4 w-4 shrink-0 overflow-hidden rounded-full bg-ink/5">
              {opportunity.company_logo_url ? (
                <Image src={opportunity.company_logo_url} alt="" fill className="object-cover" unoptimized />
              ) : (
                <Building2 className="h-4 w-4 text-ink-soft/40" strokeWidth={1.6} />
              )}
            </div>
            <span className="truncate">{opportunity.company_denumire ?? labels.companyFallback}</span>
          </div>

          <div className="mt-3 flex flex-1 flex-wrap items-end justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {opportunity.judet_nume && (
                <Badge tone="neutral">
                  <MapPin className="h-3 w-3" /> {opportunity.judet_nume}
                </Badge>
              )}
              {buget && <Badge tone="success">{buget}</Badge>}
              {opportunity.termen_limita && (
                <Badge tone="warning">
                  {labels.until} {new Date(opportunity.termen_limita).toLocaleDateString(dateLocale, { day: "2-digit", month: "short" })}
                </Badge>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1.5 border-t border-line pt-3 text-xs font-semibold text-ink-soft">
            <MessageSquare className="h-3.5 w-3.5" />
            {raspunsuri} {raspunsuri === 1 ? labels.responseSingular : labels.responses}
          </div>
        </div>
      </article>
    </Link>
  );
}

