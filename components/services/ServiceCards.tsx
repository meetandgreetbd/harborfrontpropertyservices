import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import clsx from "clsx";
import type { ServiceSummary } from "@/lib/data/catalog";
import { ServiceIcon } from "@/lib/service-icons";
import { Reveal } from "@/components/ui/Reveal";
import { Photo } from "@/components/ui/Photo";

/**
 * Service cards with photo. Hover: card lifts with a blue glow + ring, photo zooms under a blue tint,
 * a blue→cyan bar sweeps across the bottom, and the arrow button fills and slides.
 */
export function ServiceCards({ items, columns = 3 }: { items: ServiceSummary[]; columns?: 2 | 3 | 4 }) {
  return (
    <ul className={clsx("grid gap-6 sm:grid-cols-2", columns === 3 && "lg:grid-cols-3", columns === 4 && "lg:grid-cols-4")}>
      {items.map((s, i) => (
        <Reveal as="li" key={s.slug} delay={(i % 6) * 70}>
          <Link
            href={`/services/${s.slug}`}
            className="group relative flex h-full flex-col overflow-hidden rounded-[20px] border border-line bg-white shadow-[var(--shadow-card)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-2 hover:border-transparent hover:shadow-[0_30px_60px_-25px_rgb(37_99_235/0.55)] hover:ring-2 hover:ring-brand/60"
          >
            {/* Photo + tint */}
            <div className="relative aspect-[16/10] overflow-hidden">
              <Photo
                slot={`service-${s.slug}`}
                caption={s.name}
                rounded={false}
                className="absolute inset-0 h-full w-full [&_img]:transition-transform [&_img]:duration-[1.1s] [&_img]:ease-out group-hover:[&_img]:scale-110"
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-night/70 via-night/10 to-transparent transition-opacity duration-500 group-hover:opacity-0"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-tr from-brand/55 via-brand/15 to-cyan/30 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              />
              <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[0.72rem] font-semibold text-night backdrop-blur">
                {s.category}
              </span>
            </div>

            {/* Icon badge overlapping the photo */}
            <div className="relative flex flex-1 flex-col px-6 pb-6 pt-9">
              <span className="bg-brand-gradient absolute -top-7 left-6 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-[0_12px_28px_-8px_rgb(37_99_235/0.8)] ring-4 ring-white transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-[-6deg]">
                <ServiceIcon name={s.icon} size={24} />
              </span>
              <h3 className="font-display text-[1.2rem] font-bold leading-snug text-night transition-colors duration-300 group-hover:text-brand">
                {s.name}
              </h3>
              <p className="mt-2 flex-1 text-[0.95rem] leading-relaxed text-muted">{s.shortDescription}</p>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-[0.9rem] font-semibold text-night">View service</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-night transition-all duration-300 group-hover:translate-x-1 group-hover:border-transparent group-hover:bg-brand group-hover:text-white">
                  <ArrowUpRight size={18} className="transition-transform duration-300 group-hover:rotate-45" />
                </span>
              </div>
            </div>

            {/* Bottom accent bar sweeps in on hover */}
            <span
              aria-hidden="true"
              className="bg-brand-gradient absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100"
            />
          </Link>
        </Reveal>
      ))}
    </ul>
  );
}
