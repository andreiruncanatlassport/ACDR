import Link from "next/link";
import Image from "next/image";
import { MapPin, Users, Star, Zap, Building2, ArrowUpRight, Tag, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Card";
import { etichetaTimpRaspuns, esteFirmaNoua } from "@/lib/company-attrs";

export interface CompanyCardData {
  id: string;
  denumire: string;
  logo_url?: string | null;
  judet_nume: string | null;
  localitate: string | null;
  dimensiune_echipa: string | null;
  descriere: string | null;
  domeniu_principal: string | null;
  distanta_km?: number;
  rating_mediu?: number;
  rating_numar?: number;
  timp_raspuns?: string | null;
  slug?: string | null;
  discount_procent?: number | null;
  created_at?: string | null;
}

const ACCENTS = [
  "bg-gradient-to-r from-seal to-seal-light",
  "bg-gradient-to-r from-teal to-teal-light",
  "bg-gradient-to-r from-navy to-navy",
];

function accentFor(key: string) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return ACCENTS[hash % ACCENTS.length];
}

export function CompanyCard({ company }: { company: CompanyCardData }) {
  const areRating = (company.rating_numar ?? 0) > 0;
  const accent = accentFor(company.domeniu_principal ?? company.denumire);

  return (
    <Link href={`/firma/${company.slug ?? company.id}`} className="group block h-full active:scale-[0.98] transition-transform duration-150">
      <article className="lift-on-hover block-base relative flex h-full flex-col overflow-hidden p-0">
        {/* banda de accent, pe domeniu — se intensifica la hover */}
        <span className={`absolute inset-x-0 top-0 h-1 opacity-70 transition-opacity duration-300 group-hover:opacity-100 ${accent}`} />

        {/* Reducere pentru membri — cel mai puternic motiv de click, deci cel
            mai vizibil element de pe card. */}
        {company.discount_procent ? (
          <span className="absolute right-4 top-4 z-10 inline-flex items-center gap-1 rounded-full gradient-seal px-2.5 py-1 text-xs font-bold text-primary-content shadow-[var(--shadow-md)]">
            <Tag className="h-3 w-3" />-{company.discount_procent}%
          </span>
        ) : null}

        <div className="flex items-start gap-3.5 p-5 pb-4">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-ink/5 ring-1 ring-inset ring-line">
            {company.logo_url ? (
              <Image src={company.logo_url} alt="" fill className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full items-center justify-center text-ink-soft/40">
                <Building2 className="h-5 w-5" strokeWidth={1.6} />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            {company.domeniu_principal && (
              <p className="stamp-label truncate text-seal">{company.domeniu_principal}</p>
            )}
            <h3 className="mt-1 truncate font-display text-base font-semibold leading-snug text-ink">
              {company.denumire}
            </h3>
          </div>

          {!company.discount_procent && (
            <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-soft/30 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-seal" />
          )}
        </div>

        {company.descriere && (
          <p className="line-clamp-2 px-5 text-sm leading-relaxed text-ink-soft">
            {company.descriere}
          </p>
        )}

        {/* zona de semnale — separata vizual de continut */}
        <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-line bg-ink/2 px-5 py-3">
          {areRating && (
            <Badge tone="warning">
              <Star className="h-3 w-3 fill-current" />
              <span className="font-mono-num">{company.rating_mediu?.toFixed(1)}</span>
              <span className="opacity-60">({company.rating_numar})</span>
            </Badge>
          )}
          {esteFirmaNoua(company.created_at) && (
            <Badge tone="violet">
              <Sparkles className="h-3 w-3" /> nou
            </Badge>
          )}
          {company.timp_raspuns && (
            <Badge tone="success">
              <Zap className="h-3 w-3" /> {etichetaTimpRaspuns(company.timp_raspuns)}
            </Badge>
          )}
          {(company.judet_nume || company.localitate) && (
            <Badge tone="neutral">
              <MapPin className="h-3 w-3" />
              {[company.localitate, company.judet_nume].filter(Boolean).join(", ")}
            </Badge>
          )}
          {company.dimensiune_echipa && (
            <Badge tone="neutral">
              <Users className="h-3 w-3" /> {company.dimensiune_echipa}
            </Badge>
          )}
          {typeof company.distanta_km === "number" && (
            <Badge tone="violet">{company.distanta_km.toFixed(0)} km</Badge>
          )}
        </div>
      </article>
    </Link>
  );
}
