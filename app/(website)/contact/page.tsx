import { Mail, MapPin, Phone } from "lucide-react";
import { fullAddress, site } from "@/lib/site";
import { seoFor } from "@/lib/seo";
import { PageHeader } from "@/components/sections/PageHeader";
import { QuoteForm } from "@/components/forms/QuoteForm";

export function generateMetadata() {
  return seoFor("/contact");
}

export default function ContactPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ name: "Contact", path: "/contact" }]}
        eyebrow="Contact"
        title="Talk to a person, not a call center."
        lead={<p>Call during office hours and you&apos;ll get someone who knows the jobs. Or send the form and we&apos;ll reply within one business day.</p>}
      />

      <section className="py-20 md:py-24">
        <div className="container-x grid gap-14 md:grid-cols-12">
          <div className="space-y-10 md:col-span-4">
            <ContactItem icon={Phone} label="Phone">
              <a href={site.phoneHref} className="tabular font-display text-2xl text-night">
                {site.phone}
              </a>
            </ContactItem>
            <ContactItem icon={Mail} label="Email">
              <a href={`mailto:${site.email}`} className="break-all text-night underline decoration-line underline-offset-4">
                {site.email}
              </a>
            </ContactItem>
            <ContactItem icon={MapPin} label="Office">
              <address className="not-italic text-ink/85">{fullAddress}</address>
            </ContactItem>
            <div>
              <p className="eyebrow">Hours</p>
              <dl className="mt-3 space-y-1.5 text-[0.98rem]">
                {site.hours.map((h) => (
                  <div key={h.days} className="flex justify-between gap-4 border-b border-line pb-1.5">
                    <dt>{h.days}</dt>
                    <dd className="tabular text-muted">
                      {h.opens}–{h.closes}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
          <div className="md:col-span-7 md:col-start-6">
            <div className="border border-line bg-white p-6 sm:p-10">
              <h2 className="h-card text-night">Send us a message</h2>
              <div className="mt-6">
                <QuoteForm />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function ContactItem({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Phone;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="eyebrow flex items-center gap-2">
        <Icon size={14} strokeWidth={1.75} aria-hidden="true" /> {label}
      </p>
      <div className="mt-3">{children}</div>
    </div>
  );
}
