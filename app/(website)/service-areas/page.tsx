import Link from "next/link";
import { getPublishedAreas } from "@/lib/data/catalog";
import { site } from "@/lib/site";
import { seoFor } from "@/lib/seo";
import { PageHeader } from "@/components/sections/PageHeader";
import { CtaBand } from "@/components/sections/CtaBand";
import { Photo } from "@/components/ui/Photo";

export function generateMetadata() {
  return seoFor("/service-areas");
}

export default async function ServiceAreasPage() {
  const publishedAreas = await getPublishedAreas();
  return (
    <>
      <PageHeader
        crumbs={[{ name: "Service areas", path: "/service-areas" }]}
        eyebrow="Service areas"
        title={`Where we work around ${site.primaryCity}`}
        lead={
          <p>
            Our crew is based in {site.primaryCity}. If your property isn&apos;t listed, call — we often cover nearby
            towns for regular clients.
          </p>
        }
      />

      <section className="py-20 md:py-24">
        <div className="container-x grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            {publishedAreas.length > 0 ? (
              <ul className="divide-y divide-line border-y border-line">
                {publishedAreas.map((a) => (
                  <li key={a.slug}>
                    <Link href={`/service-areas/${a.slug}`} className="flex items-baseline justify-between py-4 hover:text-brand-700">
                      <span className="font-display text-xl text-night">{a.city}</span>
                      <span className="tabular text-[0.85rem] text-muted">{a.zipCodes.slice(0, 3).join(", ")}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="prose-body">
                City pages are being written. In the meantime, call {site.phone} to check if your property is in range.
              </p>
            )}
          </div>
          <div className="md:col-span-7">
            <Photo slot="areas-map" caption="Service-area map" className="aspect-[4/3] w-full" />
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
