import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { CalendarCheck, CheckCircle2, MapPin, Phone } from "lucide-react";
import { db } from "@/lib/db";
import { site } from "@/lib/site";
import { pageMeta } from "@/lib/seo";
import { ButtonLink } from "@/components/ui/Button";

export const metadata = pageMeta({ title: "Booking received", description: "Your booking with Harborfront Property Services.", path: "/booking-confirmation", noindex: true });

export default function BookingConfirmationPage({ searchParams }: PageProps<"/booking-confirmation">) {
  return (
    <section className="relative isolate overflow-hidden bg-canvas-2 py-16 md:py-24">
      <div aria-hidden="true" className="bg-grid-light absolute inset-0 -z-10" />
      <div aria-hidden="true" className="animate-glow absolute left-1/2 top-0 -z-10 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-brand/20 blur-3xl" />
      <div className="container-x max-w-2xl">
        <Suspense fallback={<p className="text-muted">Loading…</p>}>
          <Confirmation searchParams={searchParams} />
        </Suspense>
      </div>
    </section>
  );
}

async function Confirmation({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection(); // per-booking page: always rendered at request time
  const sp = await searchParams;
  const ref = typeof sp.ref === "string" ? sp.ref.slice(0, 20) : "";
  const booking = ref
    ? await db.lead.findUnique({
        where: { bookingRef: ref },
        select: { bookingRef: true, service: true, optionName: true, scheduledFor: true, address: true, status: true, serviceRef: { select: { bookingMode: true } } },
      })
    : null;

  if (!booking) {
    return (
      <div className="card p-8 text-center">
        <h1 className="font-display text-2xl font-extrabold text-night">Booking not found</h1>
        <p className="mt-2 text-muted">Check the link in your confirmation email, or call {site.phone}.</p>
        <ButtonLink href="/book" className="mt-6">
          Make a booking
        </ButtonLink>
      </div>
    );
  }

  const confirmed = booking.serviceRef?.bookingMode === "INSTANT" || booking.status === "scheduled";
  // Customers book a date only; the arrival time is agreed afterwards, so show the day.
  const when = booking.scheduledFor
    ? new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(booking.scheduledFor)
    : "";

  return (
    <div className="animate-fade-up card overflow-hidden">
      <div className="bg-brand-gradient px-8 py-10 text-center text-white">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20 ring-8 ring-white/10">
          <CheckCircle2 size={34} />
        </span>
        <h1 className="mt-5 font-display text-[1.9rem] font-extrabold">{confirmed ? "You're booked!" : "Request received!"}</h1>
        <p className="mt-2 text-white/85">
          {confirmed
            ? "Your date is confirmed — we'll contact you with the arrival time. A confirmation email is on its way."
            : "We'll confirm your date and arrival time shortly — usually the same business day."}
        </p>
      </div>
      <dl className="divide-y divide-line">
        <Row label="Reference">
          <span className="tabular rounded-lg bg-brand-50 px-2.5 py-1 font-bold tracking-wider text-brand">{booking.bookingRef}</span>
        </Row>
        <Row label="Service">
          {booking.service}
          {booking.optionName && ` — ${booking.optionName}`}
        </Row>
        <Row label="Date">
          <span className="inline-flex items-center gap-1.5">
            <CalendarCheck size={15} className="text-brand" /> {when}
          </span>
        </Row>
        <Row label="Address">
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={15} className="text-brand" /> {booking.address}
          </span>
        </Row>
      </dl>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-canvas-2 px-6 py-5">
        <a href={site.phoneHref} className="inline-flex items-center gap-2 font-semibold text-night hover:text-brand">
          <Phone size={16} /> Need to change it? {site.phone}
        </a>
        <Link href="/" className="inline-flex items-center gap-2 font-semibold text-brand hover:underline">
          <CalendarCheck size={16} /> Back to home
        </Link>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-4">
      <dt className="text-[0.9rem] text-muted">{label}</dt>
      <dd className="font-semibold text-night">{children}</dd>
    </div>
  );
}
