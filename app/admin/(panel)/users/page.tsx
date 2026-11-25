import { Suspense } from "react";
import Link from "next/link";
import { HardHat } from "lucide-react";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { roleBadge, roleLabel, roles } from "@/lib/auth/roles";
import { deleteUser } from "@/app/admin/user-actions";
import { AdminHeader, AdminLoading, formatDate } from "@/components/admin/ui";
import { UserForm } from "@/components/admin/UserForm";
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
  const [users, staff] = await Promise.all([
    db.user.findMany({
      orderBy: [{ isActive: "desc" }, { role: "asc" }, { name: "asc" }],
      include: { staff: { select: { id: true, name: true, color: true } } },
    }),
    db.staff.findMany({ orderBy: [{ isActive: "desc" }, { name: "asc" }], select: { id: true, name: true, user: { select: { name: true } } } }),
  ]);
  const staffOptions = staff.map((s) => ({ id: s.id, name: s.name, takenBy: s.user?.name ?? null }));
  const activeAdmins = users.filter((u) => u.role === "admin" && u.isActive).length;

  return (
    <>
      <AdminHeader title="Users & roles" subtitle="Who can log in to the admin, and what each person can do." />
      <div className="grid gap-6 p-6 md:p-10 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          {typeof sp.created === "string" && (
            <p role="status" className="border-l-2 border-emerald-600 bg-emerald-50 px-4 py-3 text-[0.9rem] text-emerald-900">
              User added. They can log in at /admin/login with the email and password you set.
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

          {users.map((u) => {
            const isSelf = u.id === me.id;
            const lastAdmin = u.role === "admin" && u.isActive && activeAdmins <= 1;
            return (
              <details key={u.id} className={`group border bg-white ${u.isActive ? "border-line" : "border-dashed border-line opacity-70"}`}>
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 [&::-webkit-details-marker]:hidden">
                  <span className="min-w-[12rem]">
                    <span className="block font-medium text-night">
                      {u.name} {isSelf && <span className="text-[0.75rem] font-normal text-muted">(you)</span>}
                    </span>
                    <span className="block text-[0.8rem] text-muted">{u.email}</span>
                  </span>
                  <span className={`rounded-full border px-2 py-0.5 text-[0.72rem] font-medium ${roleBadge[u.role] ?? ""}`}>{roleLabel(u.role)}</span>
                  {u.staff && (
                    <Link href={`/admin/staff/${u.staff.id}`} className="inline-flex items-center gap-1.5 text-[0.82rem] text-night hover:underline">
                      <HardHat size={14} /> {u.staff.name}
                    </Link>
                  )}
                  {!u.isActive && <span className="rounded-full border border-neutral-300 px-2 py-0.5 text-[0.72rem] text-neutral-600">Deactivated</span>}
                  <span className="ml-auto text-[0.78rem] text-muted">{u.lastLoginAt ? `Last login ${formatDate(u.lastLoginAt)}` : "Never logged in"}</span>
                </summary>
                <div className="border-t border-line px-5 py-5">
                  <UserForm
                    user={{ id: u.id, name: u.name, email: u.email, role: u.role, staffId: u.staffId ?? "", isActive: u.isActive }}
                    staffOptions={staffOptions}
                    isSelf={isSelf}
                  />
                  <div className="mt-4 flex items-center gap-2 border-t border-line pt-4 text-[0.82rem] text-muted">
                    <DeleteButton
                      id={u.id}
                      name={u.name}
                      action={deleteUser}
                      disabledReason={isSelf ? "You can't delete your own account" : lastAdmin ? "Can't delete the last active Admin" : undefined}
                    />
                    Delete user (their job history stays)
                  </div>
                </div>
              </details>
            );
          })}
        </div>

        <section className="h-fit border border-line bg-white p-5">
          <h2 className="font-sans text-[1rem] font-semibold text-night">Add user</h2>
          <p className="mt-1 text-[0.82rem] text-muted">For crew logins, add them under Staff first, then link them here with the Staff role.</p>
          <div className="mt-4">
            <UserForm user={{ id: "", name: "", email: "", role: "staff", staffId: "", isActive: true }} staffOptions={staffOptions} />
          </div>
        </section>
      </div>
    </>
  );
}
