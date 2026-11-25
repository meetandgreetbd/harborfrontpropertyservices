import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { emptyArea, getEditorLookups } from "@/lib/data/admin-catalog";
import { AdminHeader, AdminLoading } from "@/components/admin/ui";
import { AreaEditor } from "@/components/admin/AreaEditor";

export const metadata = { title: "New service area" };

export default function NewAreaPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <NewArea />
    </Suspense>
  );
}

async function NewArea() {
  await requirePermission("catalog.manage");
  const { allServices } = await getEditorLookups();
  return (
    <>
      <AdminHeader
        title="New service area"
        subtitle="Starts as a draft — hidden from Google until you publish it."
        actions={
          <Link href="/admin/areas" className="inline-flex items-center gap-1.5 text-[0.9rem] text-night hover:underline">
            <ArrowLeft size={16} /> All areas
          </Link>
        }
      />
      <div className="p-6 md:p-10">
        <AreaEditor area={emptyArea()} allServices={allServices} />
      </div>
    </>
  );
}
