import { seoFor } from "@/lib/seo";
import { PageHeader } from "@/components/sections/PageHeader";

export function generateMetadata() {
  return seoFor("/terms");
}

export default function TermsPage() {
  return (
    <>
      <PageHeader crumbs={[{ name: "Terms", path: "/terms" }]} title="Terms of service" />
      {/* TODO(owner): replace with your real terms (cancellation window, payment terms, warranty) and have them reviewed. */}
      <div className="container-x py-16">
        <div className="prose-body space-y-4">
          <p>Quotes are valid for 30 days unless stated otherwise. Work begins only after you approve the quote.</p>
          <p>If something on site changes the scope, we&apos;ll contact you before carrying out extra work.</p>
          <p>Please give at least 24 hours&apos; notice to cancel or reschedule a booked visit.</p>
          <p>Invoices are due on receipt unless you have an account with agreed payment terms.</p>
        </div>
      </div>
    </>
  );
}
