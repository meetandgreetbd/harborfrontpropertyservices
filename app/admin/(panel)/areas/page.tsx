import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { deleteArea, toggleAreaPublished } from "@/app/admin/catalog-actions";
import { AdminHeader, AdminLoading } from "@/components/admin/ui";
import { DeleteButton, EditLink, ToggleButton, ViewLink } from "@/components/admin/RowActions";

export const metadata = { title: "Service areas" };

export default function AreasAdminPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AreasList />
    </Suspense>
  );
}

async function AreasList() {
  await requirePermission("catalog.manage");
  const areas = await db.serviceArea.findMany({
    orderBy: [{ sortOrder: "asc" }, { city: "asc" }],
    include: { _count: { select: { services: true } } },
  });

  return (
    <>
      <AdminHeader
        title="Service areas"
        subtitle="City pages for local SEO. Each needs its own local copy."
        actions={
          <Link href="/admin/areas/new" className="inline-flex items-center gap-1.5 rounded-[3px] bg-night px-3.5 py-2 text-[0.88rem] text-canvas hover:bg-night-600">
            <Plus size={16} /> Add service area
          </Link>
        }
      />
      <div className="p-6 md:p-10">
        <div className="overflow-x-auto border border-line bg-white">
          <table className="w-full min-w-[48rem] text-left text-[0.9rem]">
            <thead className="border-b border-line bg-canvas/60 text-[0.76rem] uppercase tracking-wide text-muted">
              <tr>
                <th className="w-12 px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">City</th>
                <th className="px-4 py-3 font-medium">ZIP codes</th>
                <th className="px-4 py-3 font-medium">Services</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {areas.map((a) => {
                const zips = Array.isArray(a.zipCodes) ? (a.zipCodes as string[]) : [];
                const label = `${a.city}, ${a.region}`;
                return (
                  <tr key={a.id} className="hover:bg-canvas/50">
                    <td className="tabular px-4 py-3 text-muted">{a.sortOrder}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/areas/${a.id}`} className="font-medium text-night hover:underline">
                        {label}
                      </Link>
                      <div className="text-[0.78rem] text-muted">/service-areas/{a.slug}</div>
                    </td>
                    <td className="tabular px-4 py-3 text-ink/80">{zips.slice(0, 4).join(", ") || "—"}</td>
                    <td className="px-4 py-3 text-ink/80">{a._count.services}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[0.72rem] font-medium ${a.isPublished ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-neutral-200 bg-neutral-100 text-neutral-600"}`}
                        >
                          {a.isPublished ? "Published" : "Draft"}
                        </span>
                        {a.noIndex && <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[0.72rem] text-amber-900">noindex</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        <EditLink href={`/admin/areas/${a.id}`} label={`Edit ${label}`} />
                        <ViewLink href={`/service-areas/${a.slug}`} label={a.isPublished ? "View on website" : "Preview draft"} />
                        <ToggleButton id={a.id} on={a.isPublished} action={toggleAreaPublished} />
                        <DeleteButton id={a.id} name={label} action={deleteArea} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {areas.length === 0 && <p className="px-4 py-12 text-center text-muted">No service areas yet. Click “Add service area”.</p>}
        </div>
      </div>
    </>
  );
}
