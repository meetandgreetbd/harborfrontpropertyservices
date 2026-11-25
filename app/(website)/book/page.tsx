import { Suspense } from "react";
import { connection } from "next/server";
import { getBookableServices } from "@/lib/booking";
import { seoFor } from "@/lib/seo";
import { site } from "@/lib/site";
import { PageHeader } from "@/components/sections/PageHeader";
import { BookingWizard } from "@/components/booking/BookingWizard";

export function generateMetadata() {
  return seoFor("/book");
}

export default function BookPage({ searchParams }: PageProps<"/book">) {
  return (
    <>
      <PageHeader
        crumbs={[{ name: "Book online", path: "/book" }]}
        eyebrow="Online booking"
        title="Book a visit in under a minute."
        lead={<p>Choose a service, pick a free time, and you&apos;re done. Prefer to talk? Call {site.phone}.</p>}
      />
      <section className="bg-canvas-2 py-12 md:py-16">
        <div className="container-x">
          <Suspense fallback={<p className="text-muted">Loading booking…</p>}>
            <Booking searchParams={searchParams} />
          </Suspense>
        </div>
      </section>
    </>
  );
}

async function Booking({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection(); // always live: availability changes every minute
  const [sp, services] = await Promise.all([searchParams, getBookableServices()]);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone; // business (server) time zone
  return <BookingWizard services={services} initialSlug={typeof sp.service === "string" ? sp.service : undefined} timeZone={timeZone} />;
}
