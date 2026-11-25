import { Suspense } from "react";
import Link from "next/link";
import { HardHat } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { roleBadge, roleLabel, roles } from "@/lib/auth/roles";
import { AdminHeader, AdminLoading, formatDate } from "@/components/admin/ui";
import { ProfileForm } from "@/components/admin/ProfileForm";

export const metadata = { title: "My profile" };

export default function ProfilePage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Profile />
    </Suspense>
  );
}

async function Profile() {
  const me = await requireAdmin();
  const user = await db.user.findUniqueOrThrow({
    where: { id: me.id },
    include: { staff: { select: { id: true, name: true, color: true } } },
  });

  return (
    <>
      <AdminHeader title="My profile" subtitle="Your login details and password." />
      <div className="grid gap-6 p-6 md:p-10 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ProfileForm name={user.name} email={user.email} />
        </div>
        <aside className="space-y-4">
          <section className="border border-line bg-white p-5 text-[0.9rem]">
            <h2 className="font-sans text-[1rem] font-semibold text-night">Access</h2>
            <p className="mt-3">
              <span className={`rounded-full border px-2 py-0.5 text-[0.75rem] font-medium ${roleBadge[user.role] ?? ""}`}>{roleLabel(user.role)}</span>
            </p>
            <p className="mt-2 text-[0.84rem] text-muted">{roles.find((r) => r.value === user.role)?.description}</p>
            <p className="mt-3 text-[0.8rem] text-muted">Account created {formatDate(user.createdAt)}</p>
            <p className="text-[0.8rem] text-muted">Roles are changed by an Admin under Users &amp; roles.</p>
          </section>
          {user.staff && (
            <section className="border border-line bg-white p-5 text-[0.9rem]">
              <h2 className="font-sans text-[1rem] font-semibold text-night">Crew profile</h2>
              <Link href={`/admin/staff/${user.staff.id}`} className="mt-3 inline-flex items-center gap-2 text-night hover:underline">
                <HardHat size={15} /> {user.staff.name} — view jobs &amp; stats
              </Link>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
