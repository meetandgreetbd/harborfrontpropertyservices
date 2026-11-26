import { PhoneLink } from "@/components/ui/ContactInfo";
import { seoFor } from "@/lib/seo";
import { PageHeader } from "@/components/sections/PageHeader";
import { QuoteForm } from "@/components/forms/QuoteForm";

export function generateMetadata() {
  return seoFor("/request-estimate");
}

export default function RequestEstimatePage() {
  return (
    <>
      <PageHeader
        crumbs={[{ name: "Request a quote", path: "/request-estimate" }]}
        eyebrow="Free quote"
        title="Tell us about the job."
        lead={<p>The more detail, the more accurate the price. For bigger jobs we&apos;ll arrange a quick visit first.</p>}
      />
      <section className="py-16 md:py-20">
        <div className="container-x grid gap-14 md:grid-cols-12">
          <div className="md:col-span-7">
            <QuoteForm />
          </div>
          <aside className="md:col-span-4 md:col-start-9">
            <h2 className="h-card text-night">What happens next</h2>
            <ol className="mt-5 space-y-5 text-[0.98rem] leading-relaxed text-muted">
              <li><span className="font-medium text-night">1.</span> We read your request and reply within one business day.</li>
              <li><span className="font-medium text-night">2.</span> Small jobs get a price by email. Bigger ones get a short site visit.</li>
              <li><span className="font-medium text-night">3.</span> You approve the quote, we book a date. Nothing starts without your OK.</li>
            </ol>
            <p className="mt-10 border-t border-line pt-6 text-[0.95rem] text-muted">
              Urgent? Call{" "}
              <PhoneLink className="tabular font-medium text-night underline" />
            </p>
          </aside>
        </div>
      </section>
    </>
  );
}
