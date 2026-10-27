import { clsx } from "clsx";

interface BrandMarkProps {
  className?: string;
  /**
   * "auto"  — implicit: blocuri măslin pe tema deschisă, albe pe tema întunecată.
   * "white" — forțat alb (benzi măslin: header, footer, secțiuni închise).
   * "color" — forțat măslin (doar pe fundaluri garantat deschise).
   */
  variant?: "auto" | "color" | "white";
}

/**
 * Semnul ACDR: patru blocuri cu colțuri rotunjite, așezate 2×2. Crucea nu e
 * desenată — apare din spațiul gol dintre blocuri. Blocul din dreapta-sus e
 * întotdeauna auriu (talantul pus la lucru), indiferent de variantă.
 *
 * SVG inline, nu imagine: e clar la orice mărime și comută culoarea prin CSS
 * (dark:), deci e corect din primul cadru, fără pâlpâire.
 */
export function BrandMark({ className, variant = "auto" }: BrandMarkProps) {
  const blocuri =
    variant === "white"
      ? "fill-white"
      : variant === "color"
        ? "fill-[#1F3A2E]"
        : "fill-[#1F3A2E] dark:fill-white";

  return (
    <svg
      viewBox="0 0 52 62"
      role="img"
      aria-label="ACDR"
      className={clsx("shrink-0", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="0" y="0" width="23" height="18" rx="5" className={blocuri} />
      <rect x="29" y="0" width="23" height="18" rx="5" fill="#C8963E" />
      <rect x="0" y="24" width="23" height="38" rx="5" className={blocuri} />
      <rect x="29" y="24" width="23" height="38" rx="5" className={blocuri} />
    </svg>
  );
}
