import { site } from "@/lib/site";
import { seoFor } from "@/lib/seo";
import { PageHeader } from "@/components/sections/PageHeader";
import { CtaBand } from "@/components/sections/CtaBand";
import { Photo } from "@/components/ui/Photo";

export function generateMetadata() {
  return seoFor("/about");
}

const principles = [
  { title: "We say what we'll do, then do it", body: "A written scope before we start. If something changes on site, you hear about it before the invoice." },
  { title: "Photos, every time", body: "Before-and-after photos on every work order, so you never have to drive out to check." },
  { title: "Small jobs matter", body: "A sticking door is a small job for us, but it's a tenant complaint for you. We treat it that way." },
  { title: "We know our limits", body: "If a job needs a licensed electrician, plumber or roofer, we'll tell you and help arrange one." },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ name: "About", path: "/about" }]}
        eyebrow="About us"
        title="A local crew that treats your property like it's on our own street."
      />

      <section className="py-20 md:py-24">
        <div className="container-x grid gap-14 md:grid-cols-12">
          <div className="md:col-span-5">
            <Photo slot="about-owner" caption={`${site.owner.name}, owner`} className="aspect-[4/5] w-full" />
          </div>
          <div className="md:col-span-7 md:pl-4">
            {/* TODO(owner): rewrite in your own words — how you started, who's on the crew, why you do it. */}
            <div className="prose-body text-[1.1rem]">
              <p>
                {site.name} started with a simple idea: property managers and owners shouldn&apos;t have to chase
                their maintenance crew. Show up when you said, do the job properly, and send photos so nobody has to
                drive out to check.
              </p>
              <p>
                Today we look after rentals, multifamily buildings, vacant and bank-owned homes, and small commercial
                properties around {site.primaryCity}. Most of our work comes from repeat clients and referrals.
              </p>
              <p>
                We&apos;re deliberately not a big contractor. We don&apos;t do roofs or full remodels. We focus on the
                maintenance, repairs and preservation work that keeps a property rented, safe and up to code — and we
                try to be the easiest vendor you work with.
              </p>
            </div>
            <p className="mt-10 font-display text-2xl italic text-night">— {site.owner.name}</p>
            <p className="text-[0.9rem] text-muted">{site.owner.title}</p>
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-canvas-2/60 py-20 md:py-24">
        <div className="container-x">
          <h2 className="h-section max-w-xl text-night">How we work</h2>
          <div className="mt-12 grid gap-10 sm:grid-cols-2">
            {principles.map((p) => (
              <div key={p.title} className="border-t border-night pt-5">
                <h3 className="font-sans text-[1.1rem] font-semibold text-night">{p.title}</h3>
                <p className="mt-2 max-w-md text-[1rem] leading-relaxed text-muted">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container-x grid gap-3 sm:grid-cols-3">
          <Photo slot="about-crew" caption="The crew" className="aspect-[4/3]" />
          <Photo slot="about-van" caption="Work truck & tools" className="aspect-[4/3]" />
          <Photo slot="about-job" caption="On a job" className="aspect-[4/3]" />
        </div>
      </section>

      <CtaBand />
    </>
  );
}
