import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { getEditorLookups, getServiceForEditor } from "@/lib/data/admin-catalog";
import { deleteService } from "@/app/admin/catalog-actions";
import { AdminHeader, AdminLoading } from "@/components/admin/ui";
import { ServiceEditor } from "@/components/admin/ServiceEditor";

export const metadata = { title: "Edit service" };

export default function EditServicePage({ params, searchParams }: PageProps<"/admin/services/[id]">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <EditService params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function EditService({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("catalog.manage");
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [service, { categories, allServices }] = await Promise.all([getServiceForEditor(id), getEditorLookups()]);
  if (!service) notFound();

  return (
    <>
      <AdminHeader
        title={service.name}
        subtitle={`/services/${service.slug}`}
        actions={
          <div className="flex items-center gap-4 text-[0.9rem]">
            {service.isPublished && (
              <a href={`/services/${service.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-night hover:underline">
                <ExternalLink size={16} /> View page
              </a>
            )}
            <Link href="/admin/services" className="inline-flex items-center gap-1.5 text-night hover:underline">
              <ArrowLeft size={16} /> All services
            </Link>
          </div>
        }
      />
      <div className="p-6 md:p-10">
        {sp.created && (
          <p role="status" className="mb-6 border-l-2 border-emerald-600 bg-emerald-50 px-4 py-3 text-[0.9rem] text-emerald-900">
            Service created{service.isPublished ? " and published" : " as a draft"}.
          </p>
        )}
        <ServiceEditor service={service} categories={categories} allServices={allServices} />

        <form action={deleteService} className="mt-10 border border-red-200 bg-white p-5">
          <input type="hidden" name="id" value={service.id} />
          <p className="text-[0.95rem] font-semibold text-red-800">Delete this service</p>
          <p className="mt-1 text-[0.85rem] text-muted">
            Removes the page, its options, FAQs and photos. To hide it temporarily, switch off “Published” instead.
          </p>
          <button className="mt-3 rounded-[3px] border border-red-300 px-3.5 py-2 text-[0.88rem] text-red-800 hover:bg-red-50">
            Delete permanently
          </button>
        </form>
      </div>
    </>
  );
}
