import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { getAreaForEditor, getEditorLookups } from "@/lib/data/admin-catalog";
import { deleteArea } from "@/app/admin/catalog-actions";
import { AdminHeader, AdminLoading } from "@/components/admin/ui";
import { AreaEditor } from "@/components/admin/AreaEditor";

export const metadata = { title: "Edit city page" };

export default function EditAreaPage({ params, searchParams }: PageProps<"/admin/areas/[id]">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <EditArea params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function EditArea({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("catalog.manage");
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [area, { allServices }] = await Promise.all([getAreaForEditor(id), getEditorLookups()]);
  if (!area) notFound();

  return (
    <>
      <AdminHeader
        title={`${area.city}, ${area.region}`}
        subtitle={`/service-areas/${area.slug}`}
        actions={
          <div className="flex items-center gap-4 text-[0.9rem]">
            <a href={`/service-areas/${area.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-night hover:underline">
              <ExternalLink size={16} /> {area.isPublished ? "View page" : "Preview draft"}
            </a>
            <Link href="/admin/areas" className="inline-flex items-center gap-1.5 text-night hover:underline">
              <ArrowLeft size={16} /> All areas
            </Link>
          </div>
        }
      />
      <div className="p-6 md:p-10">
        {sp.created && (
          <p role="status" className="mb-6 border-l-2 border-emerald-600 bg-emerald-50 px-4 py-3 text-[0.9rem] text-emerald-900">
            City page created.
          </p>
        )}
        <AreaEditor area={area} allServices={allServices} />
        <form action={deleteArea} className="mt-10 border border-red-200 bg-white p-5">
          <input type="hidden" name="id" value={area.id} />
          <p className="text-[0.95rem] font-semibold text-red-800">Delete this city page</p>
          <p className="mt-1 text-[0.85rem] text-muted">To hide it temporarily, switch off “Published” instead.</p>
          <button className="mt-3 rounded-[3px] border border-red-300 px-3.5 py-2 text-[0.88rem] text-red-800 hover:bg-red-50">
            Delete permanently
          </button>
        </form>
      </div>
    </>
  );
}
