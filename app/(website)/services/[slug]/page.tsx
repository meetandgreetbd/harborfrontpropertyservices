import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Check, Clock } from "lucide-react";
import type { BookableService } from "@/lib/booking";
import { BookOrQuote } from "@/components/booking/BookOrQuote";
import { QuickBook } from "@/components/booking/QuickBook";
import { getServiceBySlug, getServiceSlugs } from "@/lib/data/catalog";
import { bookingModeLabel, formatPrice, priceTypeLabel } from "@/lib/catalog";
import { site } from "@/lib/site";
import { pageMeta } from "@/lib/seo";
import { serviceSchema } from "@/lib/schema";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageHeader } from "@/components/sections/PageHeader";
import { PageSkeleton } from "@/components/sections/PageSkeleton";
import { FaqList } from "@/components/sections/FaqList";
import { CtaBand } from "@/components/sections/CtaBand";
import { Reviews } from "@/components/sections/Reviews";
import { Photo } from "@/components/ui/Photo";
import { QuoteForm } from "@/components/forms/QuoteForm";

export async function generateStaticParams() {
  const slugs = await getServiceSlugs();
  // Cache Components needs at least one param; an empty catalogue renders a 404 for the placeholder.
  return slugs.length ? slugs.map((slug) => ({ slug })) : [{ slug: "__none__" }];
}

export async function generateMetadata({ params }: PageProps<"/services/[slug]">) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) return {};
  return pageMeta({
    title: service.metaTitle,
    description: service.metaDescription,
    path: `/services/${service.slug}`,
    noindex: service.noIndex,
  });
}

export default function ServicePage({ params }: PageProps<"/services/[slug]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ServiceContent params={params} />
    </Suspense>
  );
}

const minutes = (m: number) => (m % 60 === 0 ? `${m / 60} hr${m > 60 ? "s" : ""}` : m > 60 ? `${Math.floor(m / 60)} hr ${m % 60} min` : `${m} min`);

async function ServiceContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) notFound();

  const cover = service.images.find((i) => i.isCover) ?? service.images[0];
  const gallery = service.images.filter((i) => i !== cover);

  // Services that take online bookings get the live date/time picker in the sidebar.
  const bookable: BookableService | null =
    service.bookingMode === "QUOTE"
      ? null
      : {
          id: service.id,
          slug: service.slug,
          name: service.name,
          icon: service.icon,
          shortDescription: service.shortDescription,
          bookingMode: service.bookingMode as BookableService["bookingMode"],
          priceType: service.priceType,
          basePrice: service.basePrice,
          durationMin: service.durationMin,
          options: service.options.map((o) => ({ id: o.id, name: o.name, description: o.description, price: o.price, durationMin: o.durationMin })),
        };

  return (
    <>
      <PageHeader
        crumbs={[
          { name: "Services", path: "/services" },
          { name: service.name, path: `/services/${service.slug}` },
        ]}
        eyebrow={service.category}
        title={
          <>
            {service.name} <span className="text-brand-700">in {site.primaryCity}</span>
          </>
        }
        lead={<p>{service.shortDescription}</p>}
      />

      <section className="py-20 md:py-24">
        <div className="container-x grid gap-14 md:grid-cols-12">
          <div className="md:col-span-7">
            <div className="prose-body text-[1.1rem]">
              {service.intro.map((p) => (
                <p key={p.slice(0, 40)}>{p}</p>
              ))}
            </div>

            {service.included.length > 0 && (
              <>
                <h2 className="h-card mt-14 text-night">What&apos;s included</h2>
                <ul className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  {service.included.map((item) => (
                    <li key={item} className="flex gap-3 text-[1rem] leading-snug">
                      <Check size={18} strokeWidth={1.75} className="mt-0.5 shrink-0 text-brand-700" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {service.options.length > 0 && (
              <>
                <h2 className="h-card mt-14 text-night">Options</h2>
                <ul className="mt-6 divide-y divide-line border-y border-line">
                  {service.options.map((o) => (
                    <li key={o.id} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4">
                      <div>
                        <p className="font-medium text-ink">{o.name}</p>
                        {o.description && <p className="mt-0.5 text-[0.92rem] text-muted">{o.description}</p>}
                      </div>
                      <div className="flex items-baseline gap-4 text-[0.92rem]">
                        {o.durationMin && (
                          <span className="inline-flex items-center gap-1.5 text-muted">
                            <Clock size={14} strokeWidth={1.75} aria-hidden="true" /> {minutes(o.durationMin)}
                          </span>
                        )}
                        <span className="tabular font-medium text-night">
                          {/* an option's own price is the package total; otherwise fall back to the service rate */}
                          {o.price != null ? formatPrice("FIXED", o.price) : formatPrice(service.priceType, service.basePrice)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div className="mt-14 grid gap-10 sm:grid-cols-2">
              {service.goodFor.length > 0 && (
                <div>
                  <h2 className="h-card text-night">Good fit for</h2>
                  <ul className="mt-4 space-y-2 text-[1rem] text-ink/85">
                    {service.goodFor.map((g) => (
                      <li key={g}>— {g}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <h2 className="h-card text-night">Pricing</h2>
                <p className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="inline-block border border-brand/60 px-2.5 py-1 text-[0.8rem] uppercase tracking-[0.12em] text-brand-700">
                    {priceTypeLabel(service.priceType)}
                  </span>
                  {service.basePrice != null && service.priceType !== "QUOTE" && (
                    <span className="tabular font-display text-2xl text-night">
                      {formatPrice(service.priceType, service.basePrice)}
                    </span>
                  )}
                </p>
                {service.priceNote && <p className="mt-3 text-[1rem] leading-relaxed text-ink/85">{service.priceNote}</p>}
                <p className="mt-3 text-[0.9rem] text-muted">Booking: {bookingModeLabel(service.bookingMode)}</p>
              </div>
            </div>

            {cover ? (
              <figure className="mt-14">
                <Image
                  src={cover.url}
                  alt={cover.alt}
                  width={1200}
                  height={675}
                  unoptimized
                  className="aspect-video w-full object-cover"
                />
                {cover.caption && <figcaption className="mt-2 text-[0.85rem] text-muted">{cover.caption}</figcaption>}
              </figure>
            ) : (
              <Photo slot={`service-${service.slug}`} caption={`${service.name} — job photo`} className="mt-14 aspect-video w-full" />
            )}
            {gallery.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {gallery.map((img) => (
                  <Image
                    key={img.url}
                    src={img.url}
                    alt={img.alt}
                    width={600}
                    height={450}
                    unoptimized
                    className="aspect-[4/3] w-full object-cover"
                  />
                ))}
              </div>
            )}
          </div>

          <aside className="md:col-span-5" aria-labelledby="quote-heading">
            <div className="card p-6 sm:p-8 md:sticky md:top-28">
              <h2 id="quote-heading" className="h-card text-night">
                {bookable ? `Book ${service.name.toLowerCase()}` : `Get a price for ${service.name.toLowerCase()}`}
              </h2>
              <p className="mt-2 text-[0.95rem] text-muted">
                {bookable ? "Pick a free time below, or ask for a quote. " : ""}Prefer to talk? Call{" "}
                <a href={site.phoneHref} className="tabular font-semibold text-night underline">
                  {site.phone}
                </a>
              </p>
              <div className="mt-6">
                {bookable ? (
                  <BookOrQuote
                    booking={<QuickBook service={bookable} timeZone={Intl.DateTimeFormat().resolvedOptions().timeZone} />}
                    quote={<QuoteForm defaultService={service.name} compact />}
                  />
                ) : (
                  <QuoteForm defaultService={service.name} compact />
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <Reviews />

      {service.faqs.length > 0 && (
        <section className="border-t border-line py-20 md:py-24">
          <div className="container-x grid gap-12 md:grid-cols-12">
            <div className="md:col-span-4">
              <h2 className="h-section text-night">{service.name}: common questions</h2>
            </div>
            <div className="md:col-span-8">
              <FaqList faqs={service.faqs} />
            </div>
          </div>
        </section>
      )}

      {service.related.length > 0 && (
        <section className="border-t border-line bg-canvas-2/60 py-16">
          <div className="container-x">
            <h2 className="eyebrow">Often booked together</h2>
            <ul className="mt-6 flex flex-wrap gap-3">
              {service.related.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/services/${r.slug}`}
                    className="inline-block border border-night/30 px-4 py-2.5 text-[0.95rem] text-night transition-colors hover:border-night hover:bg-night hover:text-canvas"
                  >
                    {r.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <CtaBand />
      <JsonLd data={serviceSchema(service)} />
    </>
  );
}
