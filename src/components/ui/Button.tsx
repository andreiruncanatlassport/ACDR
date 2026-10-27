import { clsx } from "clsx";
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "seal" | "gold" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface BaseProps {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-content shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:brightness-110",
  seal:
    "gradient-seal text-primary-content shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] hover:brightness-110",
  // Aur cu text inchis — doar pentru actiunea principala de pe benzile masline
  // (ex: "Creeaza cont" in header). Aurul nu se foloseste niciodata ca text pe alb.
  gold: "bg-gold text-[#121614] shadow-[var(--shadow-sm)] hover:brightness-105",
  secondary:
    "bg-surface text-ink border-[1.5px] border-primary shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]",
  ghost: "bg-transparent text-ink-soft hover:bg-ink/6 hover:text-ink",
  danger: "bg-rust text-white shadow-[var(--shadow-sm)] hover:brightness-110",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
  md: "px-4.5 py-2.5 text-sm rounded-xl gap-2",
  lg: "px-6 py-3.5 text-base rounded-xl gap-2",
};

const shared =
  "press-on-click inline-flex items-center justify-center font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none disabled:hover:translate-y-0";

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: BaseProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(shared, variantClasses[variant], sizeClasses[size], className)}
      {...rest}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  target,
}: BaseProps & { href: string; target?: string }) {
  return (
    <Link
      href={href}
      target={target}
      className={clsx(shared, variantClasses[variant], sizeClasses[size], className)}
    >
      {children}
    </Link>
  );
}
