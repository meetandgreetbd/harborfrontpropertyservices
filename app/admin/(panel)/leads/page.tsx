import { Suspense } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Plus, Search } from "lucide-react";
import { db } from "@/lib/db";
import { can, requireAdmin } from "@/lib/auth";
import {
  leadStatuses,
  openStatuses,
  priorities,
  priorityValues,
  statusValues,
  type LeadStatus,
} from "@/lib/leads";
import type { Prisma } from "@/lib/generated/prisma/client";
import {
  AdminHeader,
  AdminLoading,
  AssigneeBadge,
  KindBadge,
  PriorityLabel,
  formatDate,
  formatDateTime,
} from "@/components/admin/ui";
import { QuickStatus } from "@/components/admin/QuickStatus";

export const metadata = { title: "Service requests" };

export default function LeadsPage({ searchParams }: PageProps<"/admin/leads">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Leads searchParams={searchParams} />
    </Suspense>
  );
}

const one = (v: string | string[] | undefined) =>
  typeof v === "string" ? v : "";

async function Leads({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireAdmin();
  // Staff logins only ever see requests assigned to them.
  const seesAll = can(user.role, "requests.viewAll");
  const scope: Prisma.LeadWhereInput = seesAll
    ? {}
    : { assignedToId: user.staffId ?? "__no_staff__" };
  const sp = await searchParams;
  // status: "" = open (default), "all", or one status
  const statusParam = one(sp.status);
  const status =
    statusParam === "all" || statusValues.includes(statusParam as LeadStatus)
      ? statusParam
      : "";
  const kind = ["work-order", "estimate", "booking"].includes(one(sp.kind)) ? one(sp.kind) : "";
  const staffParam = one(sp.staff); // staff id, "none" (unassigned) or ""
  const priority = priorityValues.includes(one(sp.priority) as never)
    ? one(sp.priority)
    : "";
  const q = one(sp.q).trim().slice(0, 100);

  const where: Prisma.LeadWhereInput = {
    ...scope,
    ...(status === ""
      ? { status: { in: openStatuses } }
      : status === "all"
        ? {}
        : { status }),
    ...(kind && { kind }),
    ...(priority && { priority }),
    ...(staffParam === "none"
      ? { assignedToId: null }
      : staffParam
        ? { assignedToId: staffParam }
        : {}),
    ...(q && {
      OR: [
        { name: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
        { address: { contains: q } },
        { company: { contains: q } },
        { reference: { contains: q } },
      ],
    }),
  };

  const [leads, staff, counts] = await Promise.all([
    db.lead.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      take: 300,
      include: { assignedTo: { select: { name: true, color: true } } },
    }),
    db.staff.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: { id: true, name: true, isActive: true },
    }),
    db.lead.groupBy({ by: ["status"], where: scope, _count: { _all: true } }),
  ]);
  const count = (s: string) =>
    counts.find((c) => c.status === s)?._count._all ?? 0;
  const openCount = openStatuses.reduce((n, s) => n + count(s), 0);
  const allCount = counts.reduce((n, c) => n + c._count._all, 0);

  const href = (overrides: Record<string, string>) => {
    const p = new URLSearchParams();
    const merged = {
      status,
      kind,
      staff: staffParam,
      priority,
      q,
      ...overrides,
    };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    return `/admin/leads${p.size ? `?${p}` : ""}`;
  };

  const tab = (value: string, label: string, n: number) => (
    <Link
      key={value || "open"}
      href={href({ status: value })}
      className={clsx(
        "whitespace-nowrap border-b-2 px-1 pb-2.5 text-[0.88rem]",
        status === value
          ? "border-night font-medium text-night"
          : "border-transparent text-muted hover:text-night",
      )}
    >
      {label} <span className="tabular text-[0.78rem] opacity-70">{n}</span>
    </Link>
  );

  return (
    <>
      <AdminHeader
        title="Service requests"
        subtitle="Quote requests and work orders — assign them, schedule them and track each one to completion."
        actions={
          can(user.role, "requests.manage") && (
            <Link
              href="/admin/leads/new"
              className="inline-flex items-center gap-1.5 rounded-[3px] bg-night px-3.5 py-2 text-[0.88rem] text-canvas hover:bg-night-600"
            >
              <Plus size={16} /> New request
            </Link>
          )
        }
      />

      <div className="p-6 md:p-10">
        <nav
          aria-label="Filter by status"
          className="flex gap-5 overflow-x-auto border-b border-line"
        >
          {tab("", "Open", openCount)}
          {leadStatuses.map((s) => tab(s.value, s.label, count(s.value)))}
          {tab("all", "All", allCount)}
        </nav>

        <form
          action="/admin/leads"
          className="mt-4 flex flex-wrap items-center gap-2"
        >
          {status && <input type="hidden" name="status" value={status} />}
          {seesAll && (
            <select
              name="staff"
              defaultValue={staffParam}
              aria-label="Assigned to"
              className="rounded-[3px] border border-line bg-white px-2.5 py-2 text-[0.86rem]"
            >
              <option value="">Anyone</option>
              <option value="none">Unassigned</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {!s.isActive ? " (inactive)" : ""}
                </option>
              ))}
            </select>
          )}
          <select
            name="priority"
            defaultValue={priority}
            aria-label="Priority"
            className="rounded-[3px] border border-line bg-white px-2.5 py-2 text-[0.86rem]"
          >
            <option value="">Any priority</option>
            {priorities.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <select
            name="kind"
            defaultValue={kind}
            aria-label="Type"
            className="rounded-[3px] border border-line bg-white px-2.5 py-2 text-[0.86rem]"
          >
            <option value="">All types</option>
            <option value="estimate">Quote requests</option>
            <option value="work-order">Work orders</option>
            <option value="booking">Online bookings</option>
          </select>
          <label className="relative">
            <span className="sr-only">Search</span>
            <Search
              size={15}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              name="q"
              defaultValue={q}
              placeholder="Name, phone, address, PO…"
              className="w-60 rounded-[3px] border border-line bg-white py-2 pl-8 pr-3 text-[0.86rem]"
            />
          </label>
          <button className="rounded-[3px] bg-night px-3.5 py-2 text-[0.86rem] text-canvas hover:bg-night-600">
            Filter
          </button>
          {(staffParam || priority || kind || q) && (
            <Link
              href={href({ staff: "", priority: "", kind: "", q: "" })}
              className="text-[0.84rem] text-night underline"
            >
              Clear filters
            </Link>
          )}
        </form>

        <div className="mt-5 overflow-x-auto border border-line bg-white">
          <table className="w-full min-w-[64rem] text-left text-[0.9rem]">
            <thead className="border-b border-line bg-canvas/60 text-[0.76rem] uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Service · property</th>
                <th className="px-4 py-3 font-medium">Assigned to</th>
                <th className="px-4 py-3 font-medium">Scheduled</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {leads.map((l) => (
                <tr key={l.id} className="group hover:bg-canvas/50">
                  <td className="px-4 py-3">
                    <QuickStatus id={l.id} status={l.status} />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/leads/${l.id}`}
                      className="font-medium text-night group-hover:underline"
                    >
                      {l.name}
                    </Link>
                    <div className="mt-0.5 flex items-center gap-2 text-[0.78rem] text-muted">
                      <KindBadge kind={l.kind} /> {l.company || l.phone}
                    </div>
                  </td>
                  <td className="max-w-[18rem] px-4 py-3">
                    <div className="truncate text-ink/85">
                      {l.service || "General"}
                    </div>
                    <div className="truncate text-[0.8rem] text-muted">
                      {l.address}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <AssigneeBadge staff={l.assignedTo} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[0.84rem] text-ink/80">
                    {l.scheduledFor ? (
                      formatDateTime(l.scheduledFor)
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <PriorityLabel priority={l.priority} />
                  </td>
                  <td className="tabular whitespace-nowrap px-4 py-3 text-[0.84rem] text-muted">
                    {formatDate(l.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {leads.length === 0 && (
            <p className="px-4 py-12 text-center text-muted">
              No requests match this view.
            </p>
          )}
        </div>
        <p className="mt-3 text-[0.8rem] text-muted">
          {leads.length} shown{leads.length === 300 && " (latest 300)"}. Change
          a status straight from the table, or open a request to assign and
          schedule it.
        </p>
      </div>
    </>
  );
}
