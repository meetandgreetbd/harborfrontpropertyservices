import Link from "next/link";
import clsx from "clsx";
import type { ComponentProps } from "react";

type Variant = "primary" | "dark" | "secondary" | "ghost" | "light" | "outline-light";

const base =
  "group/btn inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[0.95rem] font-semibold transition-all duration-200 disabled:opacity-60 active:scale-[0.98]";

const variants: Record<Variant, string> = {
  // Blue gradient with glow — the main call to action
  primary:
    "bg-brand-gradient text-white shadow-[0_10px_30px_-10px_rgb(37_99_235/0.7)] hover:shadow-[0_14px_36px_-10px_rgb(37_99_235/0.9)] hover:-translate-y-0.5",
  dark: "bg-night text-white hover:bg-night-600",
  secondary: "border border-line bg-white text-night hover:border-brand hover:text-brand",
  ghost: "px-0 py-1 text-brand hover:text-brand-700 rounded-none",
  light: "bg-white text-night hover:bg-brand-50",
  "outline-light": "border border-white/25 text-white hover:border-white hover:bg-white/10",
};

export function buttonClass(variant: Variant = "primary", className?: string) {
  return clsx(base, variants[variant], className);
}

export function ButtonLink({
  variant = "primary",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={buttonClass(variant, className)} {...props} />;
}
