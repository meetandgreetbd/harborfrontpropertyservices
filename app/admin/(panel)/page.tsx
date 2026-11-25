import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { can, requireAdmin } from "@/lib/auth";
import { leadStatuses, openStatuses } from "@/lib/leads";
import type { Prisma } from "@/lib/generated/prisma/client";
import { AdminHeader, AdminLoading, AssigneeBadge, KindBadge, StatusBadge, formatDate } from "@/components/admin/ui";

export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  const user = await requireAdmin();
  const weekAgo = daysAgo(7);

  const [dayStart, dayEnd] = todayRange();

  // Staff logins see only their own jobs; admins and managers see everything.
  const seesAll = can(user.role, "requests.viewAll");
  const scope: Prisma.LeadWhereInput = seesAll ? {} : { assignedToId: user.staffId ?? "__no_staff__" };

  const [byStatus, thisWeek, unassigned, recent, today] = await Promise.all([
    db.lead.groupBy({ by: ["status"], where: scope, _count: { _all: true } }),
    db.lead.count({ where: { ...scope, createdAt: { gte: weekAgo } } }),
    seesAll ? db.lead.count({ where: { assignedToId: null, status: { in: openStatuses } } }) : Promise.resolve(0),
    db.lead.findMany({ where: scope, orderBy: { createdAt: "desc" }, take: 8, include: { assignedTo: { select: { name: true, color: true } } } }),
    db.lead.findMany({
      where: { ...scope, scheduledFor: { gte: dayStart, lt: dayEnd }, status: { not: "cancelled" } },
      orderBy: { scheduledFor: "asc" },
      include: { assignedTo: { select: { name: true, color: true } } },
    }),
  ]);
  const count = (s: string) => byStatus.find((b) => b.status === s)?._count._all ?? 0;
  const open = openStatuses.reduce((n, s) => n + count(s), 0);

  return (
    <>
      <AdminHeader
        title={`Hello, ${user.name.split(" ")[0]}`}
        subtitle={seesAll ? "Service requests at a glance." : "Your assigned jobs at a glance."}
      />

      <div className="space-y-8 p-6 md:p-10">
        {seesAll ? (
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="New — needs a reply" value={count("new")} href="/admin/leads?status=new" highlight={count("new") > 0} />
            <Stat label="Unassigned open jobs" value={unassigned} href="/admin/leads?staff=none" highlight={unassigned > 0} />
            <Stat label="Open requests" value={open} href="/admin/leads" />
            <Stat label="Received this week" value={thisWeek} href="/admin/leads?status=all" />
          </section>
        ) : (
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="My open jobs" value={open} href="/admin/leads" highlight={open > 0} />
            <Stat label="Scheduled" value={count("scheduled")} href="/admin/leads?status=scheduled" />
            <Stat label="In progress" value={count("in_progress")} href="/admin/leads?status=in_progress" />
            <Stat label="Completed" value={count("completed")} href="/admin/leads?status=completed" />
          </section>
        )}

        <section className="border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-sans text-[1rem] font-semibold text-night">Today&apos;s schedule</h2>
            <span className="text-[0.85rem] text-muted">{today.length} job{today.length === 1 ? "" : "s"}</span>
          </div>
          {today.length === 0 ? (
            <p className="px-5 py-6 text-[0.92rem] text-muted">Nothing scheduled for today.</p>
          ) : (
            <ul className="divide-y divide-line">
              {today.map((l) => (
                <li key={l.id}>
                  <Link href={`/admin/leads/${l.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 hover:bg-canvas/60">
                    <span className="tabular w-20 font-medium text-night">{timeOnly(l.scheduledFor!)}</span>
                    <StatusBadge status={l.status} />
                    <span className="font-medium">{l.name}</span>
                    <span className="flex-1 truncate text-[0.88rem] text-muted">
                      {l.service || "General"} · {l.address}
                    </span>
                    <AssigneeBadge staff={l.assignedTo} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="border border-line bg-white">
          <div className="flex flex-wrap gap-x-6 gap-y-2 border-b border-line px-5 py-4 text-[0.88rem]">
            <span className="font-medium text-night">Pipeline</span>
            {leadStatuses.map((s) => (
              <Link key={s.value} href={`/admin/leads?status=${s.value}`} className="text-muted hover:text-night">
                {s.label} <span className="tabular font-semibold text-ink">{count(s.value)}</span>
              </Link>
            ))}
          </div>

          <div className="flex items-center justify-between px-5 pt-5">
            <h2 className="font-sans text-[1rem] font-semibold text-night">Latest requests</h2>
            <Link href="/admin/leads" className="inline-flex items-center gap-1 text-[0.88rem] text-night hover:underline">
              View all <ArrowRight size={15} />
            </Link>
          </div>

          {recent.length === 0 ? (
            <p className="px-5 py-10 text-[0.95rem] text-muted">
              No leads yet. When someone sends the quote or work-order form on the website, it appears here.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {recent.map((l) => (
                <li key={l.id}>
                  <Link href={`/admin/leads/${l.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5 hover:bg-canvas/60">
                    <StatusBadge status={l.status} />
                    <span className="min-w-[10rem] font-medium">{l.name}</span>
                    <span className="flex-1 truncate text-[0.9rem] text-muted">
                      {l.service || "General"} · {l.address}
                    </span>
                    <AssigneeBadge staff={l.assignedTo} />
                    <KindBadge kind={l.kind} />
                    <span className="tabular text-[0.82rem] text-muted">{formatDate(l.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

/** Start and end of today in server local time. */
function todayRange(): [Date, Date] {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return [start, end];
}

function timeOnly(d: Date) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(d);
}

function Stat({ label, value, href, highlight }: { label: string; value: number; href: string; highlight?: boolean }) {
  return (
    <Link
      href={href}
      className={`block border bg-white p-5 transition-colors hover:border-night ${highlight ? "border-amber-400" : "border-line"}`}
    >
      <p className="text-[0.82rem] text-muted">{label}</p>
      <p className="tabular mt-2 font-display text-[2.2rem] leading-none text-night">{value}</p>
    </Link>
  );
}
