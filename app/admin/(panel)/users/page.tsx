import { Suspense } from "react";
import Link from "next/link";
import { Eye, HardHat, Pencil } from "lucide-react";
import { Modal } from "@/components/admin/Modal";

const iconBtn = "inline-flex h-8 w-8 items-center justify-center rounded-[3px] text-muted transition-colors hover:bg-canvas hover:text-night";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { roleBadge, roleLabel, roles } from "@/lib/auth/roles";
import { deleteUser } from "@/app/admin/user-actions";
import { AdminHeader, AdminLoading, formatDate } from "@/components/admin/ui";
import { UserForm } from "@/components/admin/UserForm";
import { AddUserDialog } from "@/components/admin/AddUserDialog";
import { DeleteButton } from "@/components/admin/RowActions";

export const metadata = { title: "Users & roles" };

export default function UsersPage({ searchParams }: PageProps<"/admin/users">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Users searchParams={searchParams} />
    </Suspense>
  );
}

async function Users({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const me = await requirePermission("users.manage");
  const sp = await searchParams;
  const users = await db.user.findMany({
    orderBy: [{ isActive: "desc" }, { role: "asc" }, { name: "asc" }],
    include: { staff: { select: { id: true, name: true, color: true } } },
  });
  const activeAdmins = users.filter((u) => u.role === "admin" && u.isActive).length;

  return (
    <>
      <AdminHeader
        title="Users & roles"
        subtitle="Who can log in to the admin, and what each person can do."
        actions={<AddUserDialog key={typeof sp.created === "string" ? sp.created : "add"} />}
      />
      <div className="p-6 md:p-10">
        <div className="max-w-5xl space-y-4">
          {typeof sp.created === "string" && (
            <p role="status" className="border-l-2 border-emerald-600 bg-emerald-50 px-4 py-3 text-[0.9rem] text-emerald-900">
              User added. They can log in at /admin/login with the email and password you set. To assign jobs to them, add them under{" "}
              <Link href="/admin/staff" className="font-medium underline">
                Staff (crew) → Add staff member
              </Link>
              .
            </p>
          )}

          {/* Role legend */}
          <section className="grid gap-3 sm:grid-cols-3">
            {roles.map((r) => (
              <div key={r.value} className="border border-line bg-white p-4">
                <span className={`inline-block rounded-full border px-2 py-0.5 text-[0.72rem] font-medium ${roleBadge[r.value]}`}>{r.label}</span>
                <p className="mt-2 text-[0.82rem] leading-snug text-muted">{r.description}</p>
              </div>
            ))}
          </section>

          <div className="overflow-x-auto border border-line bg-white">
            <table className="w-full min-w-[46rem] text-left text-[0.9rem]">
              <thead className="border-b border-line bg-canvas/60 text-[0.76rem] uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Crew member</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Last login</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {users.map((u) => {
                  const isSelf = u.id === me.id;
                  const lastAdmin = u.role === "admin" && u.isActive && activeAdmins <= 1;
                  const roleChip = (
                    <span className={`inline-block rounded-full border px-2 py-0.5 text-[0.72rem] font-medium ${roleBadge[u.role] ?? ""}`}>{roleLabel(u.role)}</span>
                  );
                  const statusChip = u.isActive ? (
                    <span className="inline-block rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[0.72rem] text-emerald-800">Active</span>
                  ) : (
                    <span className="inline-block rounded-full border border-neutral-300 px-2 py-0.5 text-[0.72rem] text-neutral-600">Deactivated</span>
                  );
                  const lastLogin = u.lastLoginAt ? formatDate(u.lastLoginAt) : "Never";
                  return (
                    <tr key={u.id} className={u.isActive ? "hover:bg-canvas/50" : "bg-canvas/40 text-muted"}>
                      <td className="px-4 py-3">
                        <span className="block font-medium text-night">
                          {u.name} {isSelf && <span className="text-[0.75rem] font-normal text-muted">(you)</span>}
                        </span>
                        <span className="block text-[0.8rem] text-muted">{u.email}</span>
                      </td>
                      <td className="px-4 py-3">{roleChip}</td>
                      <td className="px-4 py-3">
                        {u.staff ? (
                          <Link href={`/admin/staff/${u.staff.id}`} className="inline-flex items-center gap-1.5 text-[0.85rem] text-night hover:underline">
                            <HardHat size={14} /> {u.staff.name}
                          </Link>
                        ) : (
                          <Link href="/admin/staff" className="text-[0.8rem] text-muted underline hover:text-night">
                            Not crew — add
                          </Link>
                        )}
                      </td>
                      <td className="px-4 py-3">{statusChip}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-[0.84rem] text-muted">{lastLogin}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-0.5">
                          {/* View */}
                          <Modal title={u.name} subtitle={u.email} triggerLabel={`View ${u.name}`} triggerClassName={iconBtn} trigger={<Eye size={16} strokeWidth={1.75} />}>
                            <dl className="divide-y divide-line text-[0.9rem]">
                              {(
                                [
                                  ["Name", u.name],
                                  ["Email (login)", u.email],
                                  ["Role", roleChip],
                                  ["Can do", roles.find((r) => r.value === u.role)?.description ?? ""],
                                  ["Crew member", u.staff?.name ?? "—"],
                                  ["Status", statusChip],
                                  ["Last login", lastLogin],
                                  ["Added", formatDate(u.createdAt)],
                                ] as [string, React.ReactNode][]
                              ).map(([k, v]) => (
                                <div key={k} className="grid grid-cols-3 gap-4 py-2.5">
                                  <dt className="text-muted">{k}</dt>
                                  <dd className="col-span-2 text-night">{v}</dd>
                                </div>
                              ))}
                            </dl>
                          </Modal>
                          {/* Edit */}
                          <Modal
                            title={`Edit ${u.name}`}
                            subtitle="Change details, role or password. Leave the password empty to keep it."
                            triggerLabel={`Edit ${u.name}`}
                            triggerClassName={iconBtn}
                            trigger={<Pencil size={16} strokeWidth={1.75} />}
                          >
                            <UserForm
                              user={{ id: u.id, name: u.name, email: u.email, role: u.role, isActive: u.isActive }}
                              isSelf={isSelf}
                            />
                          </Modal>
                          {/* Delete (two-step confirm, no browser popup) */}
                          <DeleteButton
                            id={u.id}
                            name={u.name}
                            action={deleteUser}
                            disabledReason={isSelf ? "You can't delete your own account" : lastAdmin ? "Can't delete the last active Admin" : undefined}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {users.length === 0 && <p className="px-4 py-12 text-center text-muted">No users yet. Click “Add user”.</p>}
          </div>
          <p className="text-[0.8rem] text-muted">Deleting a user removes their login only — their crew record and job history stay.</p>
        </div>
      </div>
    </>
  );
}
