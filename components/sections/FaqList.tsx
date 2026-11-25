import { Plus } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqSchema } from "@/lib/schema";

/** Accessible FAQ using native <details> — works without JavaScript. Emits FAQPage schema. */
export function FaqList({ faqs, withSchema = true }: { faqs: { q: string; a: string }[]; withSchema?: boolean }) {
  // Don't publish placeholder answers in schema.
  const publishable = faqs.filter((f) => !f.a.includes("TODO"));
  return (
    <>
      <div className="divide-y divide-line border-y border-line">
        {faqs.map((f) => (
          <details key={f.q} className="group">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-[1.05rem] font-medium text-ink marker:hidden [&::-webkit-details-marker]:hidden">
              {f.q}
              <Plus
                size={20}
                strokeWidth={1.5}
                className="mt-0.5 shrink-0 text-brand-700 transition-transform duration-200 group-open:rotate-45"
                aria-hidden="true"
              />
            </summary>
            <p className="prose-body pb-6 pr-10 text-[1rem]">{f.a}</p>
          </details>
        ))}
      </div>
      {withSchema && publishable.length > 0 && <JsonLd data={faqSchema(publishable)} />}
    </>
  );
}
