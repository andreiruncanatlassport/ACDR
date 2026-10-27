import Link from "next/link";
import Image from "next/image";
import { Newspaper, ArrowUpRight } from "lucide-react";

export interface NewsCardData {
  slug: string;
  titlu: string;
  rezumat: string | null;
  imagine_url: string | null;
  published_at: string | null;
}

function dataScurta(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("ro-RO", { day: "2-digit", month: "short", year: "numeric" });
}

export function NewsCard({
  article,
  compact,
  readMoreLabel = "Citește știrea",
}: {
  article: NewsCardData;
  compact?: boolean;
  readMoreLabel?: string;
}) {
  return (
    <Link href={`/stiri/${article.slug}`} className="group block h-full active:scale-[0.98] transition-transform duration-150">
      <article className="lift-on-hover block-base flex h-full flex-col overflow-hidden p-0">
        <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-ink/5">
          {article.imagine_url ? (
            <Image
              src={article.imagine_url}
              alt=""
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-ink-soft/30">
              <Newspaper className="h-8 w-8" strokeWidth={1.4} />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-5">
          <p className="stamp-label text-seal">{dataScurta(article.published_at)}</p>
          <h3 className={`mt-1.5 font-semibold leading-snug text-ink ${compact ? "text-base" : "text-lg"}`}>
            {article.titlu}
          </h3>
          {article.rezumat && (
            <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-ink-soft">{article.rezumat}</p>
          )}
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-seal">
            {readMoreLabel}
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </div>
      </article>
    </Link>
  );
}
