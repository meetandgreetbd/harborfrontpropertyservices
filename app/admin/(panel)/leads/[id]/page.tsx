import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  CalendarClock,
  History,
} from "lucide-react";
import { db } from "@/lib/db";
import { can, requireAdmin } from "@/lib/auth";
import { kindLabel, sourceLabel } from "@/lib/leads";
import { deleteLead } from "@/app/admin/actions";
import { getStaffOptions, toDateTimeLocal } from "@/lib/data/admin-requests";
import { RequestManager } from "@/components/admin/RequestManager";
import {
  AdminHeader,
  AdminLoading,
  AssigneeBadge,
  KindBadge,
  PriorityLabel,
  StatusBadge,
  formatDate,
  formatDateTime,
} from "@/components/admin/ui";

export const metadata = { title: "Service request" };

export default function LeadPage({
  params,
  searchParams,
}: PageProps<"/admin/leads/[id]">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <LeadDetail params={params} searchParams={searchParams} />
    </Suspense>
  );
}

const activityDot: Record<string, string> = {
  created: "bg-night",
  status: "bg-sky-500",
  assigned: "bg-violet-500",
  scheduled: "bg-indigo-500",
  priority: "bg-orange-500",
  note: "bg-amber-500",
  edited: "bg-neutral-400",
};

async function LeadDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireAdmin();
  const canManage = can(user.role, "requests.manage");
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [lead, staff] = await Promise.all([
    db.lead.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { name: true, color: true, phone: true } },
        activities: { orderBy: { createdAt: "desc" } },
      },
    }),
    getStaffOptions(),
  ]);
  // Staff logins can only open jobs assigned to them. A login not yet linked to a crew record (staffId null)
  // must not match unassigned jobs (assignedToId null), so require a staffId.
  if (
    !lead ||
    (!can(user.role, "requests.viewAll") && (!user.staffId || lead.assignedToId !== user.staffId))
  )
    notFound();

  const details: [string, string][] = (
    [
      ["Booking ref", lead.bookingRef ?? ""],
      ["Service", lead.service],
      ["Option", lead.optionName],
      ["Visit ends", lead.scheduledEnd ? formatDateTime(lead.scheduledEnd) : ""],
      ["Property type", lead.propertyType],
      ["Company", lead.company],
      ["Loan / property / PO #", lead.reference],
      [lead.kind === "estimate" ? "Preferred date" : "Due date", lead.dueDate],
      ["Access", lead.access],
      ["Source", sourceLabel(lead.source)],
    ] as [string, string][]
  ).filter(([, v]) => v);

  return (
    <>
      <AdminHeader
        title={lead.name}
        subtitle={`${kindLabel(lead.kind)} · received ${formatDate(lead.createdAt)}`}
        actions={
          <Link
            href="/admin/leads"
            className="inline-flex items-center gap-1.5 text-[0.9rem] text-night hover:underline"
          >
            <ArrowLeft size={16} /> All requests
          </Link>
        }
      />

      <div className="grid gap-6 p-6 md:p-10 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {sp.created && (
            <p
              role="status"
              className="border-l-2 border-emerald-600 bg-emerald-50 px-4 py-3 text-[0.9rem] text-emerald-900"
            >
              Request added.
            </p>
          )}

          {/* At-a-glance strip */}
          <section className="grid grid-cols-2 gap-px overflow-hidden border border-line bg-line sm:grid-cols-4">
            <Glance label="Status">
              <StatusBadge status={lead.status} />
            </Glance>
            <Glance label="Assigned to">
              <AssigneeBadge staff={lead.assignedTo} />
            </Glance>
            <Glance label="Scheduled">
              {lead.scheduledFor ? (
                <span className="inline-flex items-center gap-1.5 text-[0.86rem]">
                  <CalendarClock size={14} className="text-brand-700" />{" "}
                  {formatDateTime(lead.scheduledFor)}
                </span>
              ) : (
                <span className="text-[0.82rem] text-muted">Not scheduled</span>
              )}
            </Glance>
            <Glance label="Priority">
              <PriorityLabel priority={lead.priority} />
            </Glance>
          </section>

          <section className="border border-line bg-white p-6">
            <div className="flex flex-wrap items-center gap-3">
              <KindBadge kind={lead.kind} />
            </div>
            <h2 className="mt-4 text-[0.78rem] font-medium uppercase tracking-wide text-muted">
              {lead.kind === "work-order"
                ? "Scope of work"
                : "What needs doing"}
            </h2>
            <p className="mt-2 whitespace-pre-wrap text-[1rem] leading-relaxed">
              {lead.message}
            </p>
            {details.length > 0 && (
              <dl className="mt-6 grid gap-x-8 gap-y-3 border-t border-line pt-5 sm:grid-cols-2">
                {details.map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[0.78rem] uppercase tracking-wide text-muted">
                      {k}
                    </dt>
                    <dd className="mt-0.5">{v}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>

          <section className="border border-line bg-white p-6">
            <h2 className="font-sans text-[1rem] font-semibold text-night">
              Manage request
            </h2>
            <div className="mt-5">
              <RequestManager
                lead={{
                  id: lead.id,
                  status: lead.status,
                  priority: lead.priority,
                  assignedToId: lead.assignedToId,
                  scheduledFor: toDateTimeLocal(lead.scheduledFor),
                  notes: lead.notes ?? "",
                }}
                staff={staff}
                limited={!canManage}
              />
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="border border-line bg-white p-6">
            <h2 className="font-sans text-[1rem] font-semibold text-night">
              Customer
            </h2>
            <ul className="mt-4 space-y-3 text-[0.95rem]">
              <li className="flex items-start gap-2.5">
                <Phone size={16} className="mt-0.5 shrink-0 text-brand-700" />
                <a
                  href={`tel:${lead.phone}`}
                  className="tabular text-night hover:underline"
                >
                  {lead.phone}
                </a>
              </li>
              {lead.email && (
                <li className="flex items-start gap-2.5">
                  <Mail size={16} className="mt-0.5 shrink-0 text-brand-700" />
                  <a
                    href={`mailto:${lead.email}`}
                    className="break-all text-night hover:underline"
                  >
                    {lead.email}
                  </a>
                </li>
              )}
              <li className="flex items-start gap-2.5">
                <MapPin size={16} className="mt-0.5 shrink-0 text-brand-700" />
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-night hover:underline"
                >
                  {lead.address}
                </a>
              </li>
            </ul>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <a
                href={`tel:${lead.phone}`}
                className="rounded-[3px] bg-night py-2 text-center text-[0.9rem] text-canvas hover:bg-night-600"
              >
                Call
              </a>
              {lead.email ? (
                <a
                  href={`mailto:${lead.email}?subject=${encodeURIComponent(`Your request — ${lead.service || "Harborfront"}`)}`}
                  className="rounded-[3px] border border-night py-2 text-center text-[0.9rem] text-night hover:bg-canvas"
                >
                  Email
                </a>
              ) : (
                <span className="rounded-[3px] border border-line py-2 text-center text-[0.9rem] text-muted">
                  No email
                </span>
              )}
            </div>
          </section>

          <section className="border border-line bg-white p-6">
            <h2 className="flex items-center gap-2 font-sans text-[1rem] font-semibold text-night">
              <History size={16} /> History
            </h2>
            <ol className="mt-4 space-y-4">
              {lead.activities.map((a) => (
                <li key={a.id} className="relative pl-5">
                  <span
                    className={`absolute left-0 top-1.5 h-2 w-2 rounded-full ${activityDot[a.type] ?? "bg-neutral-400"}`}
                    aria-hidden="true"
                  />
                  <p className="whitespace-pre-wrap text-[0.9rem] leading-snug">
                    {a.message}
                  </p>
                  <p className="mt-0.5 text-[0.75rem] text-muted">
                    {a.byName} · {formatDate(a.createdAt)}
                  </p>
                </li>
              ))}
              {lead.activities.length === 0 && (
                <li className="text-[0.88rem] text-muted">No history yet.</li>
              )}
            </ol>
          </section>

          {canManage && (
            <section className="border border-red-200 bg-white p-6">
              <h2 className="font-sans text-[0.95rem] font-semibold text-red-800">
                Delete request
              </h2>
              <p className="mt-1 text-[0.85rem] text-muted">
                For spam or duplicates. Otherwise set the status to Cancelled.
              </p>
              <form action={deleteLead} className="mt-3">
                <input type="hidden" name="id" value={lead.id} />
                <button className="rounded-[3px] border border-red-300 px-3.5 py-2 text-[0.88rem] text-red-800 hover:bg-red-50">
                  Delete permanently
                </button>
              </form>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}

function Glance({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white px-4 py-3">
      <p className="text-[0.72rem] uppercase tracking-wide text-muted">
        {label}
      </p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
