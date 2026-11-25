import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Phone, Mail, KeyRound, CalendarClock, CheckCircle2, Briefcase, Clock } from "lucide-react";
import { db } from "@/lib/db";
import { can, requireAdmin } from "@/lib/auth";
import { roleBadge, roleLabel } from "@/lib/auth/roles";
import { openStatuses } from "@/lib/leads";
import { AdminHeader, AdminLoading, StatusBadge, formatDate, formatDateTime } from "@/components/admin/ui";
import { StaffForm } from "@/components/admin/StaffForm";

export const metadata = { title: "Staff profile" };

export default function StaffProfilePage({ params }: PageProps<"/admin/staff/[id]">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <StaffProfile params={params} />
    </Suspense>
  );
}

function currentTime() {
  return new Date();
}

function monthStart() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

async function StaffProfile({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  const { id } = await params;
  const canManage = can(user.role, "staff.manage");
  // Managers can open any profile; a crew member can open only their own.
  if (!canManage && user.staffId !== id) redirect("/admin/no-access");

  const staff = await db.staff.findUnique({
    where: { id },
    include: { user: { select: { id: true, email: true, role: true, isActive: true, lastLoginAt: true } } },
  });
  if (!staff) notFound();

  const now = currentTime();
  const [open, completedThisMonth, completedTotal, upcoming, recent] = await Promise.all([
    db.lead.count({ where: { assignedToId: id, status: { in: openStatuses } } }),
    db.lead.count({ where: { assignedToId: id, status: "completed", updatedAt: { gte: monthStart() } } }),
    db.lead.count({ where: { assignedToId: id, status: "completed" } }),
    db.lead.findMany({
      where: { assignedToId: id, status: { in: openStatuses } },
      orderBy: [{ scheduledFor: "asc" }, { createdAt: "asc" }],
      take: 15,
      select: { id: true, name: true, service: true, address: true, status: true, scheduledFor: true, priority: true },
    }),
    db.lead.findMany({
      where: { assignedToId: id, status: { in: ["completed", "cancelled"] } },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: { id: true, name: true, service: true, status: true, updatedAt: true },
    }),
  ]);
  const overdue = upcoming.filter((l) => l.scheduledFor && l.scheduledFor < now && l.status !== "in_progress").length;
  const initials = staff.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <>
      <AdminHeader
        title={staff.name}
        subtitle={staff.role || "Crew member"}
        actions={
          canManage && (
            <Link href="/admin/staff" className="inline-flex items-center gap-1.5 text-[0.9rem] text-night hover:underline">
              <ArrowLeft size={16} /> All staff
            </Link>
          )
        }
      />

      <div className="grid gap-6 p-6 md:p-10 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {/* Profile card */}
          <section className="flex flex-wrap items-center gap-5 border border-line bg-white p-6">
            <span
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-semibold text-white"
              style={{ background: staff.color }}
              aria-hidden="true"
            >
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-2xl text-night">{staff.name}</p>
              <p className="text-[0.9rem] text-muted">
                {staff.role || "Crew member"} · {staff.isActive ? "Active" : "Inactive"} · since {formatDate(staff.createdAt)}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[0.9rem]">
                {staff.phone && (
                  <a href={`tel:${staff.phone}`} className="inline-flex items-center gap-1.5 text-night hover:underline">
                    <Phone size={14} /> {staff.phone}
                  </a>
                )}
                {staff.email && (
                  <a href={`mailto:${staff.email}`} className="inline-flex items-center gap-1.5 text-night hover:underline">
                    <Mail size={14} /> {staff.email}
                  </a>
                )}
              </div>
            </div>
          </section>

          {/* Stats */}
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat icon={Briefcase} label="Open jobs" value={open} />
            <Stat icon={Clock} label="Overdue" value={overdue} warn={overdue > 0} />
            <Stat icon={CheckCircle2} label="Completed this month" value={completedThisMonth} />
            <Stat icon={CheckCircle2} label="Completed all-time" value={completedTotal} />
          </section>

          {/* Upcoming / open jobs */}
          <section className="border border-line bg-white">
            <h2 className="flex items-center gap-2 border-b border-line px-5 py-4 font-sans text-[1rem] font-semibold text-night">
              <CalendarClock size={17} /> Open jobs
            </h2>
            <ul className="divide-y divide-line">
              {upcoming.map((l) => (
                <li key={l.id}>
                  <Link href={`/admin/leads/${l.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 hover:bg-canvas/50">
                    <span className={`tabular w-40 text-[0.86rem] ${l.scheduledFor && l.scheduledFor < now ? "text-red-700" : "text-ink/80"}`}>
                      {l.scheduledFor ? formatDateTime(l.scheduledFor) : "Not scheduled"}
                    </span>
                    <StatusBadge status={l.status} />
                    <span className="font-medium">{l.name}</span>
                    <span className="flex-1 truncate text-[0.86rem] text-muted">
                      {l.service || "General"} · {l.address}
                    </span>
                  </Link>
                </li>
              ))}
              {upcoming.length === 0 && <li className="px-5 py-6 text-[0.9rem] text-muted">No open jobs.</li>}
            </ul>
          </section>

          <section className="border border-line bg-white">
            <h2 className="border-b border-line px-5 py-4 font-sans text-[1rem] font-semibold text-night">Recently finished</h2>
            <ul className="divide-y divide-line">
              {recent.map((l) => (
                <li key={l.id}>
                  <Link href={`/admin/leads/${l.id}`} className="flex flex-wrap items-center gap-x-4 px-5 py-3 text-[0.9rem] hover:bg-canvas/50">
                    <StatusBadge status={l.status} />
                    <span className="font-medium">{l.name}</span>
                    <span className="flex-1 truncate text-muted">{l.service || "General"}</span>
                    <span className="text-[0.82rem] text-muted">{formatDate(l.updatedAt)}</span>
                  </Link>
                </li>
              ))}
              {recent.length === 0 && <li className="px-5 py-6 text-[0.9rem] text-muted">Nothing finished yet.</li>}
            </ul>
          </section>
        </div>

        <aside className="space-y-6">
          {/* Login account */}
          <section className="border border-line bg-white p-5">
            <h2 className="flex items-center gap-2 font-sans text-[1rem] font-semibold text-night">
              <KeyRound size={16} /> Login account
            </h2>
            {staff.user ? (
              <div className="mt-3 space-y-1.5 text-[0.88rem]">
                <p>{staff.user.email}</p>
                <p>
                  <span className={`rounded-full border px-2 py-0.5 text-[0.72rem] font-medium ${roleBadge[staff.user.role] ?? ""}`}>{roleLabel(staff.user.role)}</span>
                  {!staff.user.isActive && <span className="ml-2 text-[0.8rem] text-muted">Deactivated</span>}
                </p>
                <p className="text-[0.8rem] text-muted">{staff.user.lastLoginAt ? `Last login ${formatDate(staff.user.lastLoginAt)}` : "Never logged in"}</p>
                {can(user.role, "users.manage") && (
                  <Link href="/admin/users" className="inline-block pt-1 text-[0.85rem] text-night underline">
                    Manage login
                  </Link>
                )}
              </div>
            ) : (
              <div className="mt-3 text-[0.88rem] text-muted">
                No login yet — this person can be assigned jobs but can&apos;t sign in.
                {can(user.role, "users.manage") && (
                  <Link href="/admin/users" className="mt-2 block text-night underline">
                    Create a Staff login
                  </Link>
                )}
              </div>
            )}
          </section>

          {staff.notes && (
            <section className="border border-line bg-white p-5">
              <h2 className="font-sans text-[1rem] font-semibold text-night">Notes</h2>
              <p className="mt-2 whitespace-pre-wrap text-[0.9rem] text-ink/85">{staff.notes}</p>
            </section>
          )}

          {canManage && (
            <section className="border border-line bg-white p-5">
              <h2 className="mb-4 font-sans text-[1rem] font-semibold text-night">Edit profile</h2>
              <StaffForm
                staff={{
                  id: staff.id,
                  name: staff.name,
                  role: staff.role,
                  phone: staff.phone,
                  email: staff.email,
                  color: staff.color,
                  notes: staff.notes ?? "",
                  isActive: staff.isActive,
                }}
              />
            </section>
          )}
        </aside>
      </div>
    </>
  );
}

function Stat({ icon: Icon, label, value, warn }: { icon: typeof Briefcase; label: string; value: number; warn?: boolean }) {
  return (
    <div className={`border bg-white p-4 ${warn ? "border-red-300" : "border-line"}`}>
      <p className="flex items-center gap-1.5 text-[0.8rem] text-muted">
        <Icon size={14} /> {label}
      </p>
      <p className={`tabular mt-2 font-display text-[2rem] leading-none ${warn ? "text-red-700" : "text-night"}`}>{value}</p>
    </div>
  );
}
