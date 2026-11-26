import { Suspense } from "react";
import Link from "next/link";
import { Eye, Pencil, UserPlus, UserRound } from "lucide-react";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { roleLabel } from "@/lib/auth/roles";
import { openStatuses } from "@/lib/leads";
import { deleteStaff } from "@/app/admin/request-actions";
import { AdminHeader, AdminLoading, StatusBadge, formatDateTime } from "@/components/admin/ui";
import { AddStaffForm, StaffForm } from "@/components/admin/StaffForm";
import { Modal } from "@/components/admin/Modal";
import { DeleteButton } from "@/components/admin/RowActions";

export const metadata = { title: "Staff" };

const iconBtn = "inline-flex h-8 w-8 items-center justify-center rounded-[3px] text-muted transition-colors hover:bg-canvas hover:text-night";

export default function StaffPage({ searchParams }: PageProps<"/admin/staff">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <StaffList searchParams={searchParams} />
    </Suspense>
  );
}

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

async function StaffList({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requirePermission("staff.manage");
  const sp = await searchParams;
  const added = typeof sp.added === "string" ? sp.added : "";

  const [freeUsers, staff] = await Promise.all([
    // Logins that aren't crew yet — offered in the "Add staff member" user select.
    db.user.findMany({
      where: { staffId: null, isActive: true },
      orderBy: [{ role: "desc" }, { name: "asc" }], // Staff role first
      select: { id: true, name: true, email: true, role: true },
    }),
    db.staff.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      include: {
        leads: {
          where: { status: { in: openStatuses } },
          orderBy: [{ scheduledFor: "asc" }, { createdAt: "asc" }],
          select: { id: true, name: true, service: true, address: true, status: true, scheduledFor: true },
        },
        _count: { select: { leads: true } },
        user: { select: { name: true, email: true, role: true } },
      },
    }),
  ]);

  return (
    <>
      <AdminHeader
        title="Staff (crew)"
        subtitle="The people you assign jobs to. Each crew member has a user login."
        actions={
          <Modal
            key={added || "add"} // remount (close) after a successful add
            title="Add staff member"
            subtitle="Pick an existing user, or create a new user with the Staff role."
            width="42rem"
            triggerClassName="inline-flex items-center gap-1.5 rounded-[3px] bg-night px-4 py-2.5 text-[0.9rem] font-medium text-canvas hover:bg-night-600"
            trigger={
              <>
                <UserPlus size={16} /> Add staff member
              </>
            }
          >
            <AddStaffForm users={freeUsers} />
          </Modal>
        }
      />
      <div className="space-y-4 p-6 md:p-10">
        {added && (
          <p role="status" className="max-w-5xl border-l-2 border-emerald-600 bg-emerald-50 px-4 py-3 text-[0.9rem] text-emerald-900">
            {added} added to the crew. You can now assign jobs to them.
          </p>
        )}

        <div className="max-w-6xl overflow-x-auto border border-line bg-white">
          <table className="w-full min-w-[52rem] text-left text-[0.9rem]">
            <thead className="border-b border-line bg-canvas/60 text-[0.76rem] uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Crew member</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Login</th>
                <th className="px-4 py-3 font-medium">Jobs</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {staff.map((s) => {
                const statusChip = s.isActive ? (
                  <span className="inline-block rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[0.72rem] text-emerald-800">Active</span>
                ) : (
                  <span className="inline-block rounded-full border border-neutral-300 px-2 py-0.5 text-[0.72rem] text-neutral-600">Inactive</span>
                );
                const login = s.user ? `${s.user.email} (${roleLabel(s.user.role)})` : "No login";
                return (
                  <tr key={s.id} className={s.isActive ? "hover:bg-canvas/50" : "bg-canvas/40 text-muted"}>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[0.82rem] font-semibold text-white" style={{ background: s.color }}>
                          {initials(s.name)}
                        </span>
                        <span>
                          <span className="block font-medium text-night">{s.name}</span>
                          <span className="block text-[0.8rem] text-muted">{s.role || "—"}</span>
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[0.84rem]">
                      <span className="block">{s.phone || <span className="text-muted">—</span>}</span>
                      <span className="block text-muted">{s.email}</span>
                    </td>
                    <td className="px-4 py-3 text-[0.84rem]">{s.user ? s.user.email : <span className="text-amber-700">No login</span>}</td>
                    <td className="px-4 py-3 text-[0.84rem]">
                      <Link href={`/admin/leads?staff=${s.id}`} className="text-night underline">
                        {s.leads.length} open
                      </Link>
                      <span className="text-muted"> · {s._count.leads} total</span>
                    </td>
                    <td className="px-4 py-3">{statusChip}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        {/* View */}
                        <Modal title={s.name} subtitle={s.role || "Crew member"} triggerLabel={`View ${s.name}`} triggerClassName={iconBtn} trigger={<Eye size={16} strokeWidth={1.75} />} width="44rem">
                          <dl className="divide-y divide-line text-[0.9rem]">
                            {(
                              [
                                ["Phone", s.phone || "—"],
                                ["Email", s.email || "—"],
                                ["Login", login],
                                ["Status", statusChip],
                                ["Notes", s.notes || "—"],
                                ["Jobs", `${s.leads.length} open · ${s._count.leads} total`],
                              ] as [string, React.ReactNode][]
                            ).map(([k, v]) => (
                              <div key={k} className="grid grid-cols-3 gap-4 py-2.5">
                                <dt className="text-muted">{k}</dt>
                                <dd className="col-span-2 whitespace-pre-line text-night">{v}</dd>
                              </div>
                            ))}
                          </dl>
                          <p className="mt-5 text-[0.78rem] font-medium uppercase tracking-wide text-muted">Open jobs</p>
                          <ul className="mt-2 divide-y divide-line border-y border-line">
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
                          <Link href={`/admin/staff/${s.id}`} className="mt-4 inline-flex items-center gap-1.5 text-[0.86rem] text-night underline">
                            <UserRound size={15} /> Open full profile
                          </Link>
                        </Modal>
                        {/* Edit */}
                        <Modal title={`Edit ${s.name}`} triggerLabel={`Edit ${s.name}`} triggerClassName={iconBtn} trigger={<Pencil size={16} strokeWidth={1.75} />}>
                          <StaffForm
                            staff={{ id: s.id, name: s.name, role: s.role, phone: s.phone, email: s.email, color: s.color, notes: s.notes ?? "", isActive: s.isActive }}
                          />
                        </Modal>
                        {/* Delete — crew with job history are deactivated instead, to keep the history */}
                        <DeleteButton id={s.id} name={s.name} action={deleteStaff} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {staff.length === 0 && <p className="px-4 py-12 text-center text-muted">No crew yet. Click “Add staff member”.</p>}
        </div>
        <p className="max-w-6xl text-[0.8rem] text-muted">
          Deleting a crew member who has jobs marks them <em>Inactive</em> instead, so their job history stays. Their user login is not deleted — manage
          logins in Users &amp; roles.
        </p>
      </div>
    </>
  );
}
