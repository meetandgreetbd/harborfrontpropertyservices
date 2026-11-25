import { Suspense } from "react";
import Link from "next/link";
import { Phone, Mail, UserRound } from "lucide-react";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { openStatuses } from "@/lib/leads";
import { deleteStaff } from "@/app/admin/request-actions";
import { AdminHeader, AdminLoading, StatusBadge, formatDateTime } from "@/components/admin/ui";
import { StaffForm } from "@/components/admin/StaffForm";

export const metadata = { title: "Staff" };

export default function StaffPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <StaffList />
    </Suspense>
  );
}

async function StaffList() {
  await requirePermission("staff.manage");
  const staff = await db.staff.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    include: {
      leads: {
        where: { status: { in: openStatuses } },
        orderBy: [{ scheduledFor: "asc" }, { createdAt: "asc" }],
        select: { id: true, name: true, service: true, address: true, status: true, scheduledFor: true },
      },
      _count: { select: { leads: true } },
    },
  });

  return (
    <>
      <AdminHeader title="Staff" subtitle="Your crew. Assign service requests to them and see who has what." />
      <div className="grid gap-6 p-6 md:p-10 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          {staff.length === 0 && (
            <p className="border border-dashed border-line bg-white px-5 py-10 text-center text-muted">No staff yet. Add your first crew member on the right.</p>
          )}
          {staff.map((s) => (
            <details key={s.id} className={`group border bg-white ${s.isActive ? "border-line" : "border-dashed border-line opacity-70"}`}>
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 [&::-webkit-details-marker]:hidden">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[0.85rem] font-semibold text-white" style={{ background: s.color }}>
                  {s.name
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <span className="min-w-[10rem]">
                  <span className="block font-medium text-night">
                    {s.name} {!s.isActive && <span className="text-[0.75rem] font-normal text-muted">(inactive)</span>}
                  </span>
                  <span className="block text-[0.8rem] text-muted">{s.role || "—"}</span>
                </span>
                <span className="flex flex-wrap gap-x-4 text-[0.82rem] text-muted">
                  {s.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone size={13} /> {s.phone}
                    </span>
                  )}
                  {s.email && (
                    <span className="inline-flex items-center gap-1">
                      <Mail size={13} /> {s.email}
                    </span>
                  )}
                </span>
                <span className="ml-auto text-[0.82rem]">
                  <Link href={`/admin/leads?staff=${s.id}`} className="text-night underline">
                    {s.leads.length} open job{s.leads.length === 1 ? "" : "s"}
                  </Link>
                  <span className="text-muted"> · {s._count.leads} total</span>
                </span>
                <Link href={`/admin/staff/${s.id}`} title={`Open ${s.name}'s profile`} className="inline-flex items-center gap-1 rounded-[3px] border border-line px-2.5 py-1 text-[0.8rem] text-night hover:border-night">
                  <UserRound size={14} /> Profile
                </Link>
              </summary>

              <div className="grid gap-6 border-t border-line px-5 py-5 lg:grid-cols-2">
                <div>
                  <p className="text-[0.78rem] font-medium uppercase tracking-wide text-muted">Open jobs</p>
                  <ul className="mt-3 divide-y divide-line border-y border-line">
                    {s.leads.map((l) => (
                      <li key={l.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-[0.86rem]">
                        <StatusBadge status={l.status} />
                        <Link href={`/admin/leads/${l.id}`} className="font-medium text-night hover:underline">
                          {l.name}
                        </Link>
                        <span className="truncate text-muted">{l.service || l.address}</span>
                        <span className="ml-auto text-[0.8rem] text-muted">{l.scheduledFor ? formatDateTime(l.scheduledFor) : "not scheduled"}</span>
                      </li>
                    ))}
                    {s.leads.length === 0 && <li className="py-3 text-[0.86rem] text-muted">Nothing open.</li>}
                  </ul>
                </div>
                <div>
                  <p className="mb-3 text-[0.78rem] font-medium uppercase tracking-wide text-muted">Edit</p>
                  <StaffForm
                    staff={{ id: s.id, name: s.name, role: s.role, phone: s.phone, email: s.email, color: s.color, notes: s.notes ?? "", isActive: s.isActive }}
                  />
                  <form action={deleteStaff} className="mt-4 border-t border-line pt-4">
                    <input type="hidden" name="id" value={s.id} />
                    <button className="text-[0.82rem] text-red-700 underline">
                      {s._count.leads > 0 ? "Deactivate (has job history)" : "Delete staff member"}
                    </button>
                  </form>
                </div>
              </div>
            </details>
          ))}
        </div>

        <section className="h-fit border border-line bg-white p-5">
          <h2 className="font-sans text-[1rem] font-semibold text-night">Add staff member</h2>
          <div className="mt-4">
            <StaffForm staff={{ id: "", name: "", role: "", phone: "", email: "", color: "#56664b", notes: "", isActive: true }} />
          </div>
        </section>
      </div>
    </>
  );
}
