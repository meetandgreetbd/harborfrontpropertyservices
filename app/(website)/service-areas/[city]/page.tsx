import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getAllAreaSlugs, getAreaBySlug } from "@/lib/data/catalog";
import { pageMeta } from "@/lib/seo";
import { PageHeader } from "@/components/sections/PageHeader";
import { PageSkeleton } from "@/components/sections/PageSkeleton";
import { ServiceCards } from "@/components/services/ServiceCards";
import { CtaBand } from "@/components/sections/CtaBand";
import { Reviews } from "@/components/sections/Reviews";
import { Photo } from "@/components/ui/Photo";

export async function generateStaticParams() {
  const slugs = await getAllAreaSlugs();
  return slugs.length ? slugs.map((city) => ({ city })) : [{ city: "__none__" }];
}

export async function generateMetadata({ params }: PageProps<"/service-areas/[city]">) {
  const { city } = await params;
  const area = await getAreaBySlug(city);
  if (!area) return {};
  return pageMeta({
    title: area.metaTitle || `Property Maintenance in ${area.city}, ${area.region}`,
    description:
      area.metaDescription ||
      `Property maintenance, repairs, turnovers and inspections in ${area.city}, ${area.region}. Local crew, free quotes and photo reports on every job.`,
    path: `/service-areas/${area.slug}`,
    // Drafts (unpublished) and pages switched to noindex in admin stay out of Google.
    noindex: !area.isPublished || area.noIndex,
  });
}

export default function CityPage({ params }: PageProps<"/service-areas/[city]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CityContent params={params} />
    </Suspense>
  );
}

async function CityContent({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const area = await getAreaBySlug(city);
  if (!area) notFound();

  return (
    <>
      <PageHeader
        crumbs={[
          { name: "Service areas", path: "/service-areas" },
          { name: area.city, path: `/service-areas/${area.slug}` },
        ]}
        eyebrow={`${area.city}, ${area.region}`}
        title={`Property maintenance in ${area.city}, ${area.region}`}
        lead={<p>{area.intro}</p>}
      />

      <section className="py-20 md:py-24">
        <div className="container-x grid gap-14 md:grid-cols-12">
          <div className="md:col-span-5">
            {area.localNotes.length > 0 && (
              <>
                <h2 className="h-card text-night">Working in {area.city}</h2>
                <ul className="mt-6 space-y-4 border-l border-brand pl-5 text-[1.02rem] text-ink/85">
                  {area.localNotes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </>
            )}
            {area.neighborhoods.length > 0 && (
              <>
                <h2 className="h-card mt-12 text-night">Neighborhoods we cover</h2>
                <p className="mt-4 text-[1rem] leading-relaxed text-ink/85">{area.neighborhoods.join(" · ")}</p>
              </>
            )}
            {area.zipCodes.length > 0 && (
              <p className="tabular mt-3 text-[0.9rem] text-muted">ZIP codes: {area.zipCodes.join(", ")}</p>
            )}
          </div>
          <div className="md:col-span-7">
            <Photo slot="areas-map" caption={`Job in ${area.city}`} className="aspect-[4/3] w-full" />
          </div>
        </div>
      </section>

      {area.services.length > 0 && (
        <section className="border-t border-line py-20 md:py-24">
          <div className="container-x grid gap-10 md:grid-cols-12">
            <h2 className="h-section text-night md:col-span-4">Services in {area.city}</h2>
            <div className="md:col-span-8">
              <ServiceCards items={area.services} columns={2} />
            </div>
          </div>
        </section>
      )}

      <Reviews />
      <CtaBand title={`Need something done in ${area.city}?`} />
    </>
  );
}
