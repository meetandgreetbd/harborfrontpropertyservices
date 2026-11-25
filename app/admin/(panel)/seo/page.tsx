import { Suspense } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { staticPages } from "@/lib/seo";
import { AdminHeader, AdminLoading } from "@/components/admin/ui";
import { PageSeoForm } from "@/components/admin/PageSeoForm";

export const metadata = { title: "SEO" };

export default function SeoAdminPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <SeoOverview />
    </Suspense>
  );
}

function Status({ title, description, noIndex, published = true }: { title: string; description: string; noIndex: boolean; published?: boolean }) {
  const issues: string[] = [];
  if (!title) issues.push("default title");
  if (!description) issues.push("default description");
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {!published && <span className="rounded-full border border-neutral-200 bg-neutral-100 px-2 py-0.5 text-[0.72rem] text-neutral-600">Draft</span>}
      {noIndex ? (
        <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[0.72rem] text-amber-900">noindex</span>
      ) : (
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[0.72rem] text-emerald-900">index</span>
      )}
      {issues.length > 0 && <span className="text-[0.75rem] text-muted">{issues.join(" · ")}</span>}
    </span>
  );
}

async function SeoOverview() {
  await requirePermission("seo.manage");
  const [overrides, services, areas] = await Promise.all([
    db.pageSeo.findMany(),
    db.service.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true, metaTitle: true, metaDescription: true, noIndex: true, isPublished: true },
    }),
    db.serviceArea.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, city: true, region: true, slug: true, metaTitle: true, metaDescription: true, noIndex: true, isPublished: true },
    }),
  ]);
  const byPath = new Map(overrides.map((o) => [o.path, o]));

  return (
    <>
      <AdminHeader title="SEO" subtitle="Meta title, meta description and index / noindex for every page on the site." />
      <div className="space-y-8 p-6 md:p-10">
        <section className="border border-line bg-white">
          <header className="border-b border-line px-5 py-4">
            <h2 className="font-sans text-[1rem] font-semibold text-night">Main pages</h2>
            <p className="mt-0.5 text-[0.85rem] text-muted">Click a page to edit. Empty fields use the default shown in grey.</p>
          </header>
          {staticPages.map((p) => {
            const o = byPath.get(p.path);
            return (
              <PageSeoForm
                key={p.path}
                path={p.path}
                label={p.label}
                defaultTitle={p.title}
                defaultDescription={p.description}
                title={o?.title ?? ""}
                description={o?.description ?? ""}
                noIndex={o?.noIndex ?? false}
              />
            );
          })}
        </section>

        <section className="border border-line bg-white">
          <header className="border-b border-line px-5 py-4">
            <h2 className="font-sans text-[1rem] font-semibold text-night">Service pages</h2>
            <p className="mt-0.5 text-[0.85rem] text-muted">Edit SEO in each service&apos;s editor (SEO panel).</p>
          </header>
          <ul className="divide-y divide-line">
            {services.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3">
                <Link href={`/admin/services/${s.id}`} className="min-w-[14rem] font-medium text-night hover:underline">
                  {s.name}
                </Link>
                <span className="text-[0.82rem] text-muted">/services/{s.slug}</span>
                <span className="ml-auto">
                  <Status title={s.metaTitle} description={s.metaDescription} noIndex={s.noIndex} published={s.isPublished} />
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="border border-line bg-white">
          <header className="border-b border-line px-5 py-4">
            <h2 className="font-sans text-[1rem] font-semibold text-night">City pages</h2>
            <p className="mt-0.5 text-[0.85rem] text-muted">Edit SEO in each city page&apos;s editor. Drafts are always noindex.</p>
          </header>
          <ul className="divide-y divide-line">
            {areas.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3">
                <Link href={`/admin/areas/${a.id}`} className="min-w-[14rem] font-medium text-night hover:underline">
                  {a.city}, {a.region}
                </Link>
                <span className="text-[0.82rem] text-muted">/service-areas/{a.slug}</span>
                <span className="ml-auto">
                  <Status title={a.metaTitle} description={a.metaDescription} noIndex={a.noIndex || !a.isPublished} published={a.isPublished} />
                </span>
              </li>
            ))}
            {areas.length === 0 && <li className="px-5 py-6 text-[0.9rem] text-muted">No city pages yet.</li>}
          </ul>
        </section>
      </div>
    </>
  );
}
