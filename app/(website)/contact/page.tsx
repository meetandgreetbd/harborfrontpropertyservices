import { Mail, MapPin, Phone } from "lucide-react";
import { getSiteInfo, groupHours } from "@/lib/data/settings";
import { SocialLinks } from "@/components/ui/SocialLinks";

/** "07:30" → "7:30 AM" */
const fmtTime = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};
import { seoFor } from "@/lib/seo";
import { PageHeader } from "@/components/sections/PageHeader";
import { QuoteForm } from "@/components/forms/QuoteForm";

export function generateMetadata() {
  return seoFor("/contact");
}

export default async function ContactPage() {
  const info = await getSiteInfo();
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
              <a href={info.phoneHref} className="tabular font-display text-2xl text-night">
                {info.phone}
              </a>
            </ContactItem>
            <ContactItem icon={Mail} label="Email">
              <a href={`mailto:${info.email}`} className="break-all text-night underline decoration-line underline-offset-4">
                {info.email}
              </a>
            </ContactItem>
            <ContactItem icon={MapPin} label="Office">
              <address className="not-italic text-ink/85">{info.fullAddress}</address>
            </ContactItem>
            <div>
              <p className="eyebrow">Hours</p>
              <dl className="mt-3 space-y-1.5 text-[0.98rem]">
                {groupHours(info.hours).map((h) => (
                  <div key={h.days} className="flex justify-between gap-4 border-b border-line pb-1.5">
                    <dt>{h.days}</dt>
                    <dd className="tabular text-muted">{h.open ? `${fmtTime(h.opens)} – ${fmtTime(h.closes)}` : "Closed"}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <SocialLinks tone="dark" />
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
