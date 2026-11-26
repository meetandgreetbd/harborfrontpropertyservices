import { PhoneLink } from "@/components/ui/ContactInfo";
import { seoFor } from "@/lib/seo";
import { PageHeader } from "@/components/sections/PageHeader";
import { QuoteForm } from "@/components/forms/QuoteForm";

export function generateMetadata() {
  return seoFor("/work-order");
}

export default function WorkOrderPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ name: "Work order", path: "/work-order" }]}
        eyebrow="For property managers & lenders"
        title="Submit a work order."
        lead={<p>One property per form. Include access details and any photo requirements, and we&apos;ll confirm the schedule by email.</p>}
      />
      <section className="py-16 md:py-20">
        <div className="container-x grid gap-14 md:grid-cols-12">
          <div className="md:col-span-7">
            <QuoteForm kind="work-order" />
          </div>
          <aside className="md:col-span-4 md:col-start-9">
            <h2 className="h-card text-night">Sending a lot of orders?</h2>
            <p className="mt-4 text-[0.98rem] leading-relaxed text-muted">
              We can work from your portal, a shared spreadsheet or email — whatever your team already uses. Call{" "}
              <PhoneLink className="tabular font-medium text-night underline" />{" "}
              to set up an account with approval limits and monthly billing.
            </p>
          </aside>
        </div>
      </section>
    </>
  );
}
