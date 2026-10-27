import Link from "next/link";
import Image from "next/image";
import { UserRound, Building2, HelpingHand } from "lucide-react";
import { VerifiedBadge } from "@/components/VerifiedBadge";

export interface MemberCardData {
  id: string;
  nume_complet: string;
  avatar_url: string | null;
  titlu: string | null;
  oras: string | null;
  judet_nume?: string | null;
  firma_declarata?: string | null;
  cauta_suport?: string | null;
  cauta_suport_category_ids?: string[];
  verificat?: boolean;
  nr_recomandari?: number;
  company_denumire: string | null;
  company_slug: string | null;
}

export function MemberCard({ member }: { member: MemberCardData }) {
  const firmaAfisata = member.company_denumire ?? member.firma_declarata;
  const cautaAjutor = Boolean(member.cauta_suport?.trim()) || Boolean(member.cauta_suport_category_ids?.length);

  return (
    <Link href={`/membri/${member.id}`} className="group block h-full active:scale-[0.98] transition-transform duration-150">
      <article className="lift-on-hover block-base flex h-full flex-col items-center p-6 text-center">
        <div className="relative h-20 w-20 overflow-hidden rounded-full bg-ink/5 ring-1 ring-inset ring-line">
          {member.avatar_url ? (
            <Image src={member.avatar_url} alt="" fill className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full items-center justify-center text-ink-soft/40">
              <UserRound className="h-8 w-8" strokeWidth={1.5} />
            </div>
          )}
        </div>
        <div className="mt-3.5 flex items-center gap-1.5">
          <h3 className="text-base font-semibold text-ink">{member.nume_complet}</h3>
        </div>
        {member.verificat && (
          <div className="mt-1">
            <VerifiedBadge nrRecomandari={member.nr_recomandari} size="sm" />
          </div>
        )}
        {member.titlu && <p className="mt-1 text-xs font-medium text-seal">{member.titlu}</p>}
        {firmaAfisata && (
          <p className="mt-2 flex items-center gap-1 text-xs text-ink-soft">
            <Building2 className="h-3 w-3 shrink-0" />
            <span className="truncate">{firmaAfisata}</span>
          </p>
        )}
        {member.oras && <p className="mt-1 text-xs text-ink-soft/70">{member.oras}</p>}
        {cautaAjutor && (
          <p className="mt-2.5 inline-flex items-center gap-1 rounded-full bg-seal/10 px-2 py-0.5 text-[10px] font-semibold text-seal">
            <HelpingHand className="h-2.5 w-2.5" /> caută ajutor
          </p>
        )}
      </article>
    </Link>
  );
}
