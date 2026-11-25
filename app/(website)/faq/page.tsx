import { generalFaqs } from "@/lib/faqs";
import { getAllFaqs } from "@/lib/data/catalog";
import { site } from "@/lib/site";
import { seoFor } from "@/lib/seo";
import { faqSchema } from "@/lib/schema";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageHeader } from "@/components/sections/PageHeader";
import { FaqList } from "@/components/sections/FaqList";
import { CtaBand } from "@/components/sections/CtaBand";

export function generateMetadata() {
  return seoFor("/faq");
}

export default async function FaqPage() {
  const serviceFaqs = await getAllFaqs();
  const all = [...generalFaqs, ...serviceFaqs.flatMap((g) => g.faqs)];
  const publishable = all.filter((f) => !f.a.includes("TODO"));

  return (
    <>
      <PageHeader crumbs={[{ name: "FAQ", path: "/faq" }]} eyebrow="FAQ" title="Questions we get asked a lot." />

      <div className="container-x space-y-20 py-20 md:py-24">
        <section className="grid gap-10 md:grid-cols-12">
          <h2 className="h-card text-night md:col-span-3 md:pt-5">General</h2>
          <div className="md:col-span-9">
            <FaqList faqs={generalFaqs} withSchema={false} />
          </div>
        </section>
        {serviceFaqs.map((g) => (
          <section key={g.group} className="grid gap-10 md:grid-cols-12">
            <h2 className="h-card text-night md:col-span-3 md:pt-5">{g.group}</h2>
            <div className="md:col-span-9">
              <FaqList faqs={g.faqs} withSchema={false} />
            </div>
          </section>
        ))}
      </div>

      <CtaBand
        title="Still have a question?"
        body={`Call ${site.phone} or send a message — we'll get back to you within one business day.`}
      />
      <JsonLd data={faqSchema(publishable)} />
    </>
  );
}
