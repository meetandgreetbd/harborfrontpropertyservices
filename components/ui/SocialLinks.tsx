import clsx from "clsx";
import { House, MapPin, Star } from "lucide-react";
import { getSiteInfo, socialNetworks, type SocialKey } from "@/lib/data/settings";

/** Simple brand marks (lucide 1.x ships no brand icons). 24×24, currentColor. */
const paths: Partial<Record<SocialKey, React.ReactNode>> = {
  facebook: <path d="M14 8h3V4h-3c-2.8 0-4.5 1.8-4.5 4.6V11H7v4h2.5v9h4v-9h3l.5-4h-3.5V8.8c0-.5.3-.8.8-.8Z" />,
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1.2" />
    </>
  ),
  linkedin: <path d="M4 9h4v12H4zM6 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm4 6h3.8v1.7h.1c.5-1 1.8-2 3.7-2 4 0 4.4 2.6 4.4 6V21h-4v-5.6c0-1.3 0-3-1.9-3s-2.1 1.5-2.1 3V21h-4z" />,
  x: <path d="M4 3h4.5l4 5.6L17.3 3H20l-6.2 7.2L21 21h-4.5l-4.4-6.1L6.8 21H4l6.9-7.9z" />,
  youtube: (
    <path
      fillRule="evenodd"
      d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15V9l5.2 3z"
    />
  ),
  tiktok: <path d="M16.5 3c.4 2.3 1.8 3.8 4 4v3.2a7.4 7.4 0 0 1-4-1.2v6.3A5.8 5.8 0 1 1 10.7 9.6v3.3a2.5 2.5 0 1 0 2.5 2.5V3z" />,
};

const lucide: Partial<Record<SocialKey, typeof MapPin>> = { googleBusiness: MapPin, yelp: Star, nextdoor: House };

/** Social profile icons from Admin → Settings → Site info. Renders nothing if none are set. */
export async function SocialLinks({ tone = "light", className }: { tone?: "light" | "dark"; className?: string }) {
  const { social } = await getSiteInfo();
  const links = socialNetworks.filter((n) => social[n.key]);
  if (!links.length) return null;
  return (
    <ul className={clsx("flex flex-wrap gap-2", className)} aria-label="Social media">
      {links.map((n) => {
        const Icon = lucide[n.key];
        return (
          <li key={n.key}>
            <a
              href={social[n.key]}
              target="_blank"
              rel="noopener noreferrer me"
              aria-label={n.label}
              title={n.label}
              className={clsx(
                "flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 hover:-translate-y-0.5",
                tone === "light" ? "bg-white/10 text-white/80 hover:bg-brand hover:text-white" : "border border-line bg-white text-night hover:border-brand hover:bg-brand hover:text-white",
              )}
            >
              {Icon ? (
                <Icon size={16} aria-hidden="true" />
              ) : (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                  {paths[n.key]}
                </svg>
              )}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
