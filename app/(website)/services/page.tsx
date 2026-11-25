import { seoFor } from "@/lib/seo";
import { getServicesByCategory } from "@/lib/data/catalog";
import { PageHeader } from "@/components/sections/PageHeader";
import { ServiceCards } from "@/components/services/ServiceCards";
import { Reveal } from "@/components/ui/Reveal";
import { CtaBand } from "@/components/sections/CtaBand";

export function generateMetadata() {
  return seoFor("/services");
}

export default async function ServicesPage() {
  const groups = await getServicesByCategory();
  return (
    <>
      <PageHeader
        crumbs={[{ name: "Services", path: "/services" }]}
        eyebrow="Services"
        title="Everything we do, in one place."
        lead={
          <p>
            If what you need isn&apos;t listed, ask anyway. If it&apos;s not something we do well, we&apos;ll tell you and
            point you to someone who does.
          </p>
        }
      />

      <div className="bg-canvas-2">
        <div className="container-x space-y-16 py-20 md:py-24">
          {groups.map(({ category, services }) => (
            <section key={category} aria-label={category}>
              <Reveal className="mb-7 flex items-center gap-4">
                <h2 className="font-display text-[1.5rem] font-extrabold text-night">{category}</h2>
                <span className="h-px flex-1 bg-gradient-to-r from-brand-100 to-transparent" aria-hidden="true" />
                <span className="rounded-full bg-brand-50 px-3 py-1 text-[0.8rem] font-semibold text-brand">{services.length}</span>
              </Reveal>
              <ServiceCards items={services} />
            </section>
          ))}
        </div>
      </div>

      <CtaBand />
    </>
  );
}
