import { clsx } from "clsx";
import type { HTMLAttributes, ReactNode } from "react";

type CardVariant = "base" | "raised" | "inset" | "glass" | "accent";

const variantClasses: Record<CardVariant, string> = {
  base: "block-base",
  raised: "block-raised",
  inset: "block-inset",
  glass: "glass",
  accent: "block-base block-accent",
};

export function Card({
  variant = "base",
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { variant?: CardVariant }) {
  return (
    <div className={clsx(variantClasses[variant], "p-6", className)} {...rest}>
      {children}
    </div>
  );
}

/** Titlu de sectiune, in stil "eticheta de dosar" — delimiteaza clar blocurile. */
export function SectionLabel({
  children,
  icon,
  className,
}: {
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("flex items-center gap-2", className)}>
      {icon && <span className="text-seal">{icon}</span>}
      <h2 className="stamp-label text-ink-soft">{children}</h2>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "violet" | "seal";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-ink/8 text-ink-soft ring-1 ring-inset ring-ink/10",
  success: "bg-teal/12 text-teal ring-1 ring-inset ring-teal/25",
  warning: "bg-gold-pale text-gold-ink ring-1 ring-inset ring-gold/40",
  danger: "bg-rust/12 text-rust ring-1 ring-inset ring-rust/25",
  violet: "bg-violet/12 text-violet ring-1 ring-inset ring-violet/25",
  seal: "gradient-seal text-primary-content shadow-sm",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/** Statistica evidentiata — pentru numere care merita atentie. */
export function StatBlock({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className={clsx("block-base p-5", accent && "block-accent")}>
      <p className="stamp-label text-ink-soft">{label}</p>
      <p
        className={clsx(
          "mt-1.5 font-mono-num text-2xl font-semibold",
          accent ? "text-gradient-seal" : "text-ink"
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}
