import Image from "next/image";
import clsx from "clsx";
import { ImageIcon } from "lucide-react";
import demoPhotos from "@/lib/demo-photos.json";

type Demo = { src: string; alt: string; credit: string; creditUrl: string; source: string };
const photos = demoPhotos as Record<string, Demo>;

/**
 * A photo slot. Uses the DEMO photo for `slot` if one was downloaded (npm run photos:demo),
 * otherwise a styled blue illustration — never a broken image.
 * TODO(owner): replace demo photos with real job photos before launch.
 */
export function Photo({
  slot,
  caption,
  className,
  priority = false,
  sizes = "(min-width: 1024px) 50vw, 100vw",
  rounded = true,
}: {
  slot?: string;
  caption: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  rounded?: boolean;
}) {
  const demo = slot ? photos[slot] : undefined;

  if (demo) {
    return (
      <figure className={clsx("group/photo relative overflow-hidden bg-canvas-2", rounded && "rounded-[var(--radius-md)]", className)}>
        <Image
          src={demo.src}
          alt={demo.alt || caption}
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover transition-transform duration-[1.2s] ease-out group-hover/photo:scale-[1.04]"
        />
        <figcaption className="sr-only">{caption}</figcaption>
      </figure>
    );
  }

  // Fallback: on-brand illustration (blue gradient + grid), clearly not a real photo.
  return (
    <figure
      className={clsx(
        "relative flex items-end overflow-hidden bg-gradient-to-br from-brand-50 via-white to-brand-100",
        rounded && "rounded-[var(--radius-md)]",
        className,
      )}
      role="img"
      aria-label={caption}
    >
      <div aria-hidden="true" className="bg-grid-light absolute inset-0" />
      <div aria-hidden="true" className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-brand/15 blur-2xl" />
      <ImageIcon aria-hidden="true" size={40} strokeWidth={1.25} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-brand/35" />
      <figcaption className="relative m-3 rounded-full bg-white/90 px-3 py-1 text-[0.72rem] font-medium text-muted shadow-sm">{caption}</figcaption>
    </figure>
  );
}

/** Small "Photo: Name / Unsplash" credit line, shown in the footer for demo photos. */
export function demoPhotoCredits() {
  return Object.values(photos);
}
