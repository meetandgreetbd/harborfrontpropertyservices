import { Suspense } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Plus, Search, FolderTree, Star } from "lucide-react";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { bookingModeLabel, formatPrice } from "@/lib/catalog";
import { deleteService, toggleServicePublished } from "@/app/admin/catalog-actions";
import type { Prisma } from "@/lib/generated/prisma/client";
import { AdminHeader, AdminLoading } from "@/components/admin/ui";
import { DeleteButton, EditLink, ToggleButton, ViewLink } from "@/components/admin/RowActions";

export const metadata = { title: "Services" };

export default function ServicesAdminPage({ searchParams }: PageProps<"/admin/services">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <ServicesList searchParams={searchParams} />
    </Suspense>
  );
}

const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

async function ServicesList({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requirePermission("catalog.manage");
  const sp = await searchParams;
  const category = one(sp.category);
  const status = ["published", "draft"].includes(one(sp.status)) ? one(sp.status) : "";
  const q = one(sp.q).trim().slice(0, 100);

  const where: Prisma.ServiceWhereInput = {
    ...(category && { categoryId: category }),
    ...(status && { isPublished: status === "published" }),
    ...(q && { OR: [{ name: { contains: q } }, { slug: { contains: q } }, { shortDescription: { contains: q } }] }),
  };

  const [services, categories, totals] = await Promise.all([
    db.service.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { category: { select: { id: true, name: true } }, _count: { select: { options: true, faqs: true, images: true } } },
    }),
    db.serviceCategory.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { services: true } } } }),
    db.service.groupBy({ by: ["isPublished"], _count: { _all: true } }),
  ]);
  const total = totals.reduce((n, t) => n + t._count._all, 0);

  const href = (o: Record<string, string>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ category, status, q, ...o })) if (v) p.set(k, v);
    return `/admin/services${p.size ? `?${p}` : ""}`;
  };

  return (
    <>
      <AdminHeader
        title="All services"
        subtitle={`${total} services · changes go live on the website as soon as you save.`}
        actions={
          <div className="flex gap-2">
            <Link href="/admin/categories" className="inline-flex items-center gap-1.5 rounded-[3px] border border-line bg-white px-3.5 py-2 text-[0.88rem] text-night hover:border-night">
              <FolderTree size={16} /> Categories
            </Link>
            <Link href="/admin/services/new" className="inline-flex items-center gap-1.5 rounded-[3px] bg-night px-3.5 py-2 text-[0.88rem] text-canvas hover:bg-night-600">
              <Plus size={16} /> Add service
            </Link>
          </div>
        }
      />

      <div className="p-6 md:p-10">
        {/* Category tabs */}
        <nav aria-label="Filter by category" className="flex gap-5 overflow-x-auto border-b border-line">
          {[{ id: "", name: "All categories", _count: { services: total } }, ...categories].map((c) => (
            <Link
              key={c.id || "all"}
              href={href({ category: c.id })}
              className={clsx(
                "whitespace-nowrap border-b-2 px-1 pb-2.5 text-[0.88rem]",
                category === c.id ? "border-night font-medium text-night" : "border-transparent text-muted hover:text-night",
              )}
            >
              {c.name} <span className="tabular text-[0.78rem] opacity-70">{c._count.services}</span>
            </Link>
          ))}
        </nav>

        <form action="/admin/services" className="mt-4 flex flex-wrap items-center gap-2">
          {category && <input type="hidden" name="category" value={category} />}
          <select name="status" defaultValue={status} aria-label="Status" className="rounded-[3px] border border-line bg-white px-2.5 py-2 text-[0.86rem]">
            <option value="">Published &amp; drafts</option>
            <option value="published">Published only</option>
            <option value="draft">Drafts only</option>
          </select>
          <label className="relative">
            <span className="sr-only">Search services</span>
            <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <input name="q" defaultValue={q} placeholder="Search services…" className="w-60 rounded-[3px] border border-line bg-white py-2 pl-8 pr-3 text-[0.86rem]" />
          </label>
          <button className="rounded-[3px] bg-night px-3.5 py-2 text-[0.86rem] text-canvas hover:bg-night-600">Filter</button>
          {(status || q) && (
            <Link href={href({ status: "", q: "" })} className="text-[0.84rem] text-night underline">
              Clear
            </Link>
          )}
        </form>

        <div className="mt-5 overflow-x-auto border border-line bg-white">
          <table className="w-full min-w-[60rem] text-left text-[0.9rem]">
            <thead className="border-b border-line bg-canvas/60 text-[0.76rem] uppercase tracking-wide text-muted">
              <tr>
                <th className="w-12 px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Booking</th>
                <th className="px-4 py-3 font-medium">Content</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {services.map((s) => (
                <tr key={s.id} className="hover:bg-canvas/50">
                  <td className="tabular px-4 py-3 text-muted">{s.sortOrder}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/services/${s.id}`} className="inline-flex items-center gap-1.5 font-medium text-night hover:underline">
                      {s.name}
                      {s.isFeatured && <Star size={13} className="fill-amber-400 text-amber-500" aria-label="Featured on homepage" />}
                    </Link>
                    <div className="text-[0.78rem] text-muted">/services/{s.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={href({ category: s.category.id })} className="text-ink/80 hover:text-night hover:underline">
                      {s.category.name}
                    </Link>
                  </td>
                  <td className="tabular px-4 py-3 text-ink/80">{formatPrice(s.priceType, s.basePrice == null ? null : Number(s.basePrice))}</td>
                  <td className="px-4 py-3 text-ink/80">{bookingModeLabel(s.bookingMode)}</td>
                  <td className="px-4 py-3 text-[0.8rem] text-muted">
                    {s._count.options} options · {s._count.faqs} FAQs · {s._count.images} photos
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[0.72rem] font-medium ${s.isPublished ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-neutral-200 bg-neutral-100 text-neutral-600"}`}
                      >
                        {s.isPublished ? "Published" : "Draft"}
                      </span>
                      {s.noIndex && <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[0.72rem] text-amber-900">noindex</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-0.5">
                      <EditLink href={`/admin/services/${s.id}`} label={`Edit ${s.name}`} />
                      {s.isPublished && <ViewLink href={`/services/${s.slug}`} />}
                      <ToggleButton id={s.id} on={s.isPublished} action={toggleServicePublished} />
                      <DeleteButton id={s.id} name={s.name} action={deleteService} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {services.length === 0 && (
            <p className="px-4 py-12 text-center text-muted">
              {total === 0 ? "No services yet. Click “Add service” to create one." : "No services match this filter."}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
