import { Suspense } from "react";
import Link from "next/link";
import { CalendarX2, ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { deleteBlockedTime } from "@/app/admin/availability-actions";
import { AdminHeader, AdminLoading } from "@/components/admin/ui";
import { Card } from "@/components/admin/form";
import { BlockTimeForm, WorkingHoursForm } from "@/components/admin/AvailabilityForms";
import { DeleteButton } from "@/components/admin/RowActions";

export const metadata = { title: "Availability" };

export default function AvailabilityPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Availability />
    </Suspense>
  );
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function Availability() {
  await requirePermission("requests.manage");
  const [hours, blocks, upcoming, bookable] = await Promise.all([
    db.workingHours.findMany({ orderBy: { weekday: "asc" } }),
    db.blockedTime.findMany({ where: { endsAt: { gte: startOfToday() } }, orderBy: { startsAt: "asc" } }),
    db.lead.count({ where: { kind: "booking", scheduledFor: { gte: startOfToday() }, status: { not: "cancelled" } } }),
    db.service.findMany({
      where: { isPublished: true, bookingMode: { in: ["INSTANT", "REQUEST", "APPOINTMENT"] } },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, bookingMode: true, durationMin: true, bufferMin: true, slotIntervalMin: true, minNoticeHours: true },
    }),
  ]);
  const fmt = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <>
      <AdminHeader
        title="Availability"
        subtitle={`Working hours and blocked dates for online booking. Times are in ${tz}.`}
        actions={
          <a href="/book" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[0.9rem] text-night hover:underline">
            <ExternalLink size={16} /> Open booking page
          </a>
        }
      />
      <div className="grid gap-6 p-6 md:p-10 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title="Weekly working hours" description="Customers can only book start times inside these hours.">
            <WorkingHoursForm hours={hours} />
          </Card>

          <Card title="Bookable services" description="Visit length, buffer and start-time steps are set per service.">
            <ul className="divide-y divide-line text-[0.9rem]">
              {bookable.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <Link href={`/admin/services/${s.id}`} className="font-medium text-night hover:underline">
                    {s.name}
                  </Link>
                  <span className="text-[0.82rem] text-muted">
                    {s.bookingMode === "INSTANT" ? "Instant" : s.bookingMode === "APPOINTMENT" ? "Assessment" : "Request"} · {s.durationMin} min visit · {s.bufferMin} min
                    buffer · every {s.slotIntervalMin} min · {s.minNoticeHours} h notice
                  </span>
                </li>
              ))}
              {bookable.length === 0 && <li className="py-3 text-muted">No services are bookable online. Set a service&apos;s booking mode to Instant, Request or Assessment.</li>}
            </ul>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Block time off" description="Holidays, days off, crew training…">
            <BlockTimeForm />
          </Card>
          <Card title="Upcoming blocked time">
            <ul className="divide-y divide-line">
              {blocks.map((b) => (
                <li key={b.id} className="flex items-start justify-between gap-3 py-2.5 text-[0.88rem]">
                  <span>
                    <span className="flex items-center gap-1.5 font-medium text-night">
                      <CalendarX2 size={15} className="text-red-600" /> {b.reason || "Blocked"}
                    </span>
                    <span className="text-[0.8rem] text-muted">
                      {fmt.format(b.startsAt)} → {fmt.format(b.endsAt)}
                    </span>
                  </span>
                  <DeleteButton id={b.id} name={b.reason || "blocked time"} action={deleteBlockedTime} />
                </li>
              ))}
              {blocks.length === 0 && <li className="py-2 text-[0.88rem] text-muted">Nothing blocked.</li>}
            </ul>
          </Card>
          <p className="px-1 text-[0.82rem] text-muted">
            {upcoming} upcoming online booking{upcoming === 1 ? "" : "s"}.{" "}
            <Link href="/admin/leads?kind=booking" className="text-night underline">
              View bookings
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
