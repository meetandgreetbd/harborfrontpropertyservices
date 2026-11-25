import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { getStaffOptions } from "@/lib/data/admin-requests";
import { AdminHeader, AdminLoading } from "@/components/admin/ui";
import { NewRequestForm } from "@/components/admin/NewRequestForm";

export const metadata = { title: "New request" };

export default function NewRequestPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <NewRequest />
    </Suspense>
  );
}

async function NewRequest() {
  await requirePermission("requests.manage");
  const [staff, services] = await Promise.all([
    getStaffOptions(),
    db.service.findMany({ where: { isPublished: true }, orderBy: { sortOrder: "asc" }, select: { name: true } }),
  ]);
  return (
    <>
      <AdminHeader
        title="New request"
        subtitle="For jobs that come in by phone, email or in person."
        actions={
          <Link href="/admin/leads" className="inline-flex items-center gap-1.5 text-[0.9rem] text-night hover:underline">
            <ArrowLeft size={16} /> All requests
          </Link>
        }
      />
      <div className="p-6 md:p-10">
        <NewRequestForm staff={staff} services={services.map((s) => s.name)} />
      </div>
    </>
  );
}
