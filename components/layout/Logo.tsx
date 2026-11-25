import Link from "next/link";
import clsx from "clsx";

/** Wordmark: HARBORFRONT with a smaller PROPERTY SERVICES line. Swap for the real logo file later. */
export function Logo({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <Link
      href="/"
      aria-label="Harborfront Property Services, home"
      className={clsx("group inline-flex items-center gap-3", tone === "dark" ? "text-night" : "text-canvas")}
    >
      {/* Simple mark: a roofline over a waterline */}
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
        <path d="M4 15 15 6l11 9" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
        <path d="M8 13.5V22h14v-8.5" stroke="currentColor" strokeWidth="2" />
        <path
          d="M3 26.5c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5"
          stroke="var(--color-brand)"
          strokeWidth="1.6"
        />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.15rem] font-semibold tracking-[0.06em]">HARBORFRONT</span>
        <span className="mt-1 text-[0.6rem] font-medium tracking-[0.28em] opacity-75">PROPERTY SERVICES</span>
      </span>
    </Link>
  );
}
