import { Suspense } from "react";
import Link from "next/link";
import { Wrench } from "lucide-react";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { AdminHeader, AdminLoading } from "@/components/admin/ui";
import { AddCategoryForm, CategoryRow } from "@/components/admin/CategoryForm";

export const metadata = { title: "Service categories" };

export default function CategoriesPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Categories />
    </Suspense>
  );
}

async function Categories() {
  await requirePermission("catalog.manage");
  const [categories, published] = await Promise.all([
    db.serviceCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { _count: { select: { services: true } } } }),
    db.service.groupBy({ by: ["categoryId"], where: { isPublished: true }, _count: { _all: true } }),
  ]);
  const publishedIn = (id: string) => published.find((p) => p.categoryId === id)?._count._all ?? 0;

  return (
    <>
      <AdminHeader
        title="Service categories"
        subtitle="Groups on the /services page. Lower sort order shows first."
        actions={
          <Link href="/admin/services" className="inline-flex items-center gap-1.5 rounded-[3px] border border-line bg-white px-3.5 py-2 text-[0.88rem] text-night hover:border-night">
            <Wrench size={16} /> All services
          </Link>
        }
      />
      <div className="max-w-5xl space-y-6 p-6 md:p-10">
        <section className="border border-line bg-white px-5 py-4">
          <AddCategoryForm nextSort={categories.length} />
        </section>

        <div className="overflow-x-auto border border-line bg-white">
          <table className="w-full min-w-[40rem] text-left text-[0.9rem]">
            <thead className="border-b border-line bg-canvas/60 text-[0.76rem] uppercase tracking-wide text-muted">
              <tr>
                <th className="w-16 px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Services</th>
                <th className="px-4 py-3" />
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {categories.map((c) => (
                <CategoryRow
                  key={c.id}
                  id={c.id}
                  name={c.name}
                  slug={c.slug}
                  sortOrder={c.sortOrder}
                  serviceCount={c._count.services}
                  publishedCount={publishedIn(c.id)}
                />
              ))}
            </tbody>
          </table>
          {categories.length === 0 && <p className="px-4 py-12 text-center text-muted">No categories yet. Add one above.</p>}
        </div>
      </div>
    </>
  );
}
