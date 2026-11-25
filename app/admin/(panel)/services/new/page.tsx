import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { emptyService, getEditorLookups } from "@/lib/data/admin-catalog";
import { AdminHeader, AdminLoading } from "@/components/admin/ui";
import { ServiceEditor } from "@/components/admin/ServiceEditor";

export const metadata = { title: "New service" };

export default function NewServicePage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <NewService />
    </Suspense>
  );
}

async function NewService() {
  await requirePermission("catalog.manage");
  const { categories, allServices } = await getEditorLookups();
  return (
    <>
      <AdminHeader
        title="New service"
        subtitle="Use “Save as draft” while you work on it, then “Publish” when it's ready."
        actions={
          <Link href="/admin/services" className="inline-flex items-center gap-1.5 text-[0.9rem] text-night hover:underline">
            <ArrowLeft size={16} /> All services
          </Link>
        }
      />
      <div className="p-6 md:p-10">
        <ServiceEditor service={emptyService(categories[0]?.id)} categories={categories} allServices={allServices} />
      </div>
    </>
  );
}
