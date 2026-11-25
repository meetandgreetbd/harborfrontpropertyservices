import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PageSkeleton } from "@/components/sections/PageSkeleton";
import { getIndustry, industries } from "@/lib/industries";
import { getServicesBySlugs } from "@/lib/data/catalog";
import { seoFor } from "@/lib/seo";
import { PageHeader } from "@/components/sections/PageHeader";
import { ServiceCards } from "@/components/services/ServiceCards";
import { CtaBand } from "@/components/sections/CtaBand";
import { ButtonLink } from "@/components/ui/Button";

export function generateStaticParams() {
  return industries.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: PageProps<"/industries/[slug]">) {
  const { slug } = await params;
  if (!getIndustry(slug)) return {};
  return seoFor(`/industries/${slug}`);
}

export default function IndustryPage({ params }: PageProps<"/industries/[slug]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <IndustryContent params={params} />
    </Suspense>
  );
}

async function IndustryContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ind = getIndustry(slug);
  if (!ind) notFound();
  const items = await getServicesBySlugs(ind.services);
  const isB2B = ind.slug === "lenders-reo" || ind.slug === "property-managers";

  return (
    <>
      <PageHeader
        crumbs={[{ name: `For ${ind.name}`, path: `/industries/${ind.slug}` }]}
        eyebrow={`For ${ind.name.toLowerCase()}`}
        title={ind.headline}
        lead={<p>{ind.intro}</p>}
      >
        <div className="mt-10 flex flex-wrap gap-4">
          <ButtonLink href={isB2B ? "/work-order" : "/request-estimate"}>
            {isB2B ? "Submit a work order" : "Request a quote"}
          </ButtonLink>
          <ButtonLink href="/contact" variant="secondary">
            Set up an account
          </ButtonLink>
        </div>
      </PageHeader>

      <section className="py-20 md:py-24">
        <div className="container-x grid gap-14 md:grid-cols-12">
          <div className="md:col-span-4">
            <h2 className="h-card text-night">Sound familiar?</h2>
            <ul className="mt-6 space-y-4 border-l border-brand pl-5 text-[1.02rem] text-ink/85">
              {ind.pains.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-8">
            <h2 className="h-section text-night">How we work with {ind.name.toLowerCase()}</h2>
            <div className="mt-10 grid gap-10 sm:grid-cols-3">
              {ind.howWeHelp.map((h, i) => (
                <div key={h.title} className="border-t border-night pt-5">
                  <span className="tabular text-[0.8rem] text-muted">0{i + 1}</span>
                  <h3 className="mt-2 font-sans text-[1.05rem] font-semibold text-night">{h.title}</h3>
                  <p className="mt-2 text-[0.98rem] leading-relaxed text-muted">{h.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-line py-20 md:py-24">
        <div className="container-x grid gap-10 md:grid-cols-12">
          <h2 className="h-section text-night md:col-span-4">Services {ind.name.toLowerCase()} use most</h2>
          <div className="md:col-span-8">
            <ServiceCards items={items} columns={2} />
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
