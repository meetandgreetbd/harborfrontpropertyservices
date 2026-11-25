import Link from "next/link";
import {
  ArrowRight,
  Camera,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  FileText,
  Receipt,
  ShieldCheck,
  Building2,
  Landmark,
  TrendingUp,
  Users,
  MapPin,
  Clock,
} from "lucide-react";
import { site } from "@/lib/site";
import { industries } from "@/lib/industries";
import { getPublishedAreas, getServices } from "@/lib/data/catalog";
import { generalFaqs } from "@/lib/faqs";
import { seoFor } from "@/lib/seo";
import { ButtonLink } from "@/components/ui/Button";
import { Photo } from "@/components/ui/Photo";
import { Reveal } from "@/components/ui/Reveal";
import { ServiceCards } from "@/components/services/ServiceCards";
import { FaqList } from "@/components/sections/FaqList";
import { CtaBand } from "@/components/sections/CtaBand";
import { Reviews } from "@/components/sections/Reviews";

export function generateMetadata() {
  return seoFor("/");
}

const trust = [
  { icon: ShieldCheck, text: site.insured ? "Fully insured" : "Licensed crew" },
  { icon: Camera, text: "Photos on every job" },
  { icon: FileText, text: "Free written quotes" },
  { icon: Receipt, text: "One itemized invoice" },
];

const steps = [
  { icon: CalendarCheck, title: "Book or send the job", body: "Pick a time online, call, or send a work order. Photos help us price it faster." },
  { icon: FileText, title: "Get a clear price", body: "A written quote or a flat price — and a date. Nothing starts without your OK." },
  { icon: ClipboardList, title: "We do the work", body: "On the day we said. If something changes on site, we call before we carry on." },
  { icon: Camera, title: "Photos & invoice", body: "Before-and-after photos and one itemized invoice, the same day." },
];

const industryIcons: Record<string, typeof Users> = {
  "property-managers": Building2,
  "lenders-reo": Landmark,
  investors: TrendingUp,
  hoa: Users,
};

export default async function HomePage() {
  const [allServices, publishedAreas] = await Promise.all([getServices(), getPublishedAreas()]);
  const featured = allServices.filter((s) => s.isFeatured);
  const homeServices = (featured.length ? featured : allServices).slice(0, 6);

  return (
    <>
      {/* ───────────── HERO ───────────── */}
      <section className="relative isolate overflow-hidden bg-night text-white">
        <div aria-hidden="true" className="bg-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        <div aria-hidden="true" className="animate-glow absolute -left-40 top-10 -z-10 h-[32rem] w-[32rem] rounded-full bg-brand/45 blur-3xl" />
        <div aria-hidden="true" className="animate-glow absolute -right-20 bottom-0 -z-10 h-96 w-96 rounded-full bg-cyan/25 blur-3xl [animation-delay:-4s]" />

        <div className="container-x grid gap-14 pb-20 pt-16 md:pb-28 md:pt-24 lg:grid-cols-12 lg:items-center lg:gap-10">
          <div className="lg:col-span-7">
            <p className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[0.8rem] font-medium text-white/80 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan" />
              </span>
              Property maintenance · {site.primaryCity}, {site.primaryRegion}
            </p>
            <h1 className="h-hero animate-fade-up mt-6 font-extrabold text-white [animation-delay:80ms]">
              Property care that shows up, fixes it, and <span className="text-gradient">sends the photos.</span>
            </h1>
            <p className="animate-fade-up mt-6 max-w-xl text-[1.12rem] leading-relaxed text-white/70 [animation-delay:160ms]">
              Repairs, unit turnovers, inspections and vacant-property care for property managers, lenders, investors and
              owners in {site.primaryCity}. One crew, one invoice, and a photo report on every job.
            </p>
            <div className="animate-fade-up mt-9 flex flex-wrap items-center gap-3 [animation-delay:240ms]">
              <ButtonLink href="/book" className="px-7 py-3.5 text-[1rem]">
                <CalendarCheck size={19} /> Book online
              </ButtonLink>
              <ButtonLink href="/request-estimate" variant="outline-light" className="px-7 py-3.5 text-[1rem]">
                Get a free quote <ArrowRight size={18} className="transition-transform group-hover/btn:translate-x-1" />
              </ButtonLink>
            </div>
            <ul className="animate-fade-up mt-10 grid max-w-xl grid-cols-2 gap-x-6 gap-y-3 text-[0.92rem] text-white/75 [animation-delay:320ms]">
              {trust.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-2.5">
                  <Icon size={18} className="text-brand-400" aria-hidden="true" />
                  {text}
                </li>
              ))}
            </ul>
          </div>

          {/* Photo with floating info cards */}
          <div className="animate-fade-up relative mx-auto w-full max-w-md [animation-delay:200ms] lg:col-span-5 lg:max-w-none">
            <div className="absolute -inset-3 -z-10 rounded-[32px] bg-gradient-to-br from-brand/50 to-cyan/30 blur-2xl" aria-hidden="true" />
            <Photo slot="hero" caption="Our crew finishing a unit turnover" priority className="aspect-[4/5] w-full rounded-[28px] ring-1 ring-white/10" sizes="(min-width: 1024px) 40vw, 90vw" />

            <div className="animate-float absolute -left-6 bottom-10 w-60 rounded-2xl border border-white/10 bg-white p-4 text-ink shadow-2xl sm:-left-10">
              <p className="text-[0.75rem] font-semibold uppercase tracking-wider text-brand">Every job includes</p>
              <ul className="mt-2.5 space-y-1.5 text-[0.88rem]">
                {["Written quote first", "Before & after photos", "One clear invoice"].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="shrink-0 text-brand" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="animate-float absolute -right-3 top-8 flex items-center gap-2.5 rounded-full bg-white px-4 py-2.5 text-[0.85rem] font-semibold text-ink shadow-xl [animation-delay:-3s] sm:-right-6">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-gradient text-white">
                <Clock size={14} />
              </span>
              Same-day replies
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── SERVICES ───────────── */}
      <section className="relative bg-canvas-2 py-20 md:py-28">
        <div className="container-x">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="eyebrow">Our services</p>
              <h2 className="h-section mt-3 font-extrabold text-night">
                The work most buildings <span className="text-gradient">actually need.</span>
              </h2>
              <p className="mt-4 text-[1.05rem] leading-relaxed text-muted">
                No remodels, no roofs. Just the maintenance, repairs and preservation work that keeps a property rented, safe
                and up to code.
              </p>
            </div>
            <ButtonLink href="/services" variant="secondary">
              All services <ArrowRight size={17} />
            </ButtonLink>
          </Reveal>
          <div className="mt-12">
            <ServiceCards items={homeServices} />
          </div>
        </div>
      </section>

      {/* ───────────── WHO WE SERVE ───────────── */}
      <section className="py-20 md:py-28">
        <div className="container-x">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Who we work with</p>
            <h2 className="h-section mt-3 font-extrabold text-night">Built for people who manage more than one property.</h2>
            <p className="mt-4 text-[1.05rem] leading-relaxed text-muted">
              Approval limits, photo standards, monthly billing — we work the way property professionals need.
            </p>
          </Reveal>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {industries.map((ind, i) => {
              const Icon = industryIcons[ind.slug] ?? Users;
              return (
                <Reveal key={ind.slug} delay={i * 80}>
                  <Link href={`/industries/${ind.slug}`} className="card card-hover group flex h-full flex-col overflow-hidden">
                    <div className="relative">
                      <Photo slot={`industry-${ind.slug}`} caption={ind.name} rounded={false} className="aspect-[16/10] w-full" sizes="(min-width: 1024px) 25vw, 50vw" />
                      <span className="absolute -bottom-5 left-5 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-lg">
                        <Icon size={20} />
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-5 pt-8">
                      <h3 className="font-display text-[1.1rem] font-bold text-night">{ind.name}</h3>
                      <p className="mt-2 flex-1 text-[0.92rem] leading-relaxed text-muted">{ind.headline}.</p>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-[0.88rem] font-semibold text-brand">
                        How we help <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────────── HOW IT WORKS (dark) ───────────── */}
      <section className="relative isolate overflow-hidden bg-night py-20 text-white md:py-28">
        <div aria-hidden="true" className="bg-grid absolute inset-0 -z-10 opacity-70" />
        <div aria-hidden="true" className="animate-glow absolute left-1/2 top-0 -z-10 h-80 w-[40rem] -translate-x-1/2 rounded-full bg-brand/30 blur-3xl" />
        <div className="container-x">
          <Reveal className="max-w-2xl">
            <p className="eyebrow text-brand-400">How it works</p>
            <h2 className="h-section mt-3 font-extrabold text-white">Four steps, and you always know where the job is.</h2>
          </Reveal>
          <ol className="relative mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div aria-hidden="true" className="absolute left-0 right-0 top-[3.25rem] hidden h-px bg-gradient-to-r from-transparent via-brand/60 to-transparent lg:block" />
            {steps.map((s, i) => (
              <Reveal as="li" key={s.title} delay={i * 110} className="relative">
                <div className="h-full rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur transition-colors hover:border-brand/50 hover:bg-white/[0.07]">
                  <div className="flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-[0_10px_30px_-8px_rgb(37_99_235/0.8)]">
                      <s.icon size={21} />
                    </span>
                    <span className="font-display text-[2.4rem] font-extrabold leading-none text-white/10">0{i + 1}</span>
                  </div>
                  <h3 className="mt-6 font-display text-[1.1rem] font-bold text-white">{s.title}</h3>
                  <p className="mt-2 text-[0.94rem] leading-relaxed text-white/65">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────────── PROOF ───────────── */}
      <section className="py-20 md:py-28">
        <div className="container-x grid gap-12 lg:grid-cols-12 lg:items-center">
          <Reveal className="grid grid-cols-2 gap-4 lg:col-span-7">
            <div className="relative">
              <Photo slot="proof-before" caption="Before — damaged drywall" className="aspect-[4/3] w-full" sizes="(min-width: 1024px) 30vw, 50vw" />
              <span className="absolute left-3 top-3 rounded-full bg-night/85 px-3 py-1 text-[0.75rem] font-semibold text-white backdrop-blur">Before</span>
            </div>
            <div className="relative">
              <Photo slot="proof-after" caption="After — patched and painted" className="aspect-[4/3] w-full" sizes="(min-width: 1024px) 30vw, 50vw" />
              <span className="absolute left-3 top-3 rounded-full bg-brand px-3 py-1 text-[0.75rem] font-semibold text-white">After</span>
            </div>
            <div className="relative col-span-2">
              <Photo slot="proof-lockbox" caption="Lockbox installed, code logged" className="aspect-[16/7] w-full" sizes="(min-width: 1024px) 60vw, 100vw" />
            </div>
          </Reveal>
          <Reveal delay={120} className="lg:col-span-5">
            <p className="eyebrow">What you get back</p>
            <h2 className="h-section mt-3 font-extrabold text-night">A photo report you can forward to the owner as-is.</h2>
            <p className="prose-body mt-5">
              Every work order closes with before-and-after photos, a short note on what we did, and anything we spotted
              that you should know about. Lender clients get photos in the order their portal needs.
            </p>
            <ul className="mt-6 space-y-3">
              {["Time-stamped before & after photos", "Notes on anything else we spotted", "Itemized invoice, same day"].map((t) => (
                <li key={t} className="flex items-center gap-3 text-[0.98rem] text-ink">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 text-brand">
                    <CheckCircle2 size={15} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            <ButtonLink href="/about" variant="ghost" className="mt-7">
              More about how we work <ArrowRight size={16} />
            </ButtonLink>
          </Reveal>
        </div>
      </section>

      <Reviews />

      {/* ───────────── AREAS ───────────── */}
      <section className="bg-canvas-2 py-20 md:py-28">
        <div className="container-x grid gap-12 lg:grid-cols-12 lg:items-center">
          <Reveal className="lg:col-span-5">
            <p className="eyebrow">Where we work</p>
            <h2 className="h-section mt-3 font-extrabold text-night">Based in {site.primaryCity}. Working across the area.</h2>
            {publishedAreas.length > 0 ? (
              <ul className="mt-7 flex flex-wrap gap-2.5">
                {publishedAreas.map((a) => (
                  <li key={a.slug}>
                    <Link href={`/service-areas/${a.slug}`} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-[0.92rem] font-medium text-night shadow-sm transition-colors hover:border-brand hover:text-brand">
                      <MapPin size={15} className="text-brand" /> {a.city}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="prose-body mt-5">Not sure if you&apos;re in range? Call {site.phone} and we&apos;ll tell you straight away.</p>
            )}
            <ButtonLink href="/service-areas" variant="secondary" className="mt-8">
              See all service areas <ArrowRight size={17} />
            </ButtonLink>
          </Reveal>
          <Reveal delay={120} className="lg:col-span-7">
            <Photo slot="areas-map" caption="Neighborhoods we cover" className="aspect-[16/11] w-full" sizes="(min-width: 1024px) 55vw, 100vw" />
          </Reveal>
        </div>
      </section>

      {/* ───────────── FAQ ───────────── */}
      <section className="py-20 md:py-28">
        <div className="container-x grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <p className="eyebrow">Questions</p>
            <h2 className="h-section mt-3 font-extrabold text-night">Straight answers.</h2>
            <p className="mt-4 text-muted">
              Can&apos;t find yours?{" "}
              <Link href="/contact" className="font-semibold text-brand hover:underline">
                Ask us
              </Link>
              .
            </p>
          </Reveal>
          <Reveal delay={100} className="lg:col-span-8">
            <FaqList faqs={generalFaqs} />
          </Reveal>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
