import { reviews } from "@/lib/reviews";

/** Renders nothing until real reviews exist in lib/reviews.ts. */
export function Reviews({ limit = 3 }: { limit?: number }) {
  if (reviews.length === 0) return null;
  return (
    <section className="py-24">
      <div className="container-x">
        <p className="eyebrow">What clients say</p>
        <div className="mt-10 grid gap-10 md:grid-cols-3">
          {reviews.slice(0, limit).map((r) => (
            <figure key={r.name + r.text.slice(0, 20)} className="border-t border-night pt-6">
              <blockquote className="font-display text-[1.25rem] leading-snug text-night">“{r.text}”</blockquote>
              <figcaption className="mt-5 text-[0.9rem] text-muted">
                {r.name} · {r.location}
                {r.service && ` · ${r.service}`}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
