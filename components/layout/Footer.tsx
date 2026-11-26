import Link from "next/link";
import { cacheLife } from "next/cache";
import { CalendarCheck, ArrowRight } from "lucide-react";
import { site } from "@/lib/site";
import { getPublishedAreas, getServices } from "@/lib/data/catalog";
import { industries } from "@/lib/industries";
import { Logo } from "./Logo";
import { SocialLinks } from "@/components/ui/SocialLinks";

async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}

export async function Footer() {
  const [services, publishedAreas] = await Promise.all([getServices(), getPublishedAreas()]);
  return (
    <footer className="relative isolate overflow-hidden bg-night text-white/80">
      <div aria-hidden="true" className="absolute -left-40 -top-40 -z-10 h-96 w-96 rounded-full bg-brand/20 blur-3xl" />
      <div className="container-x grid gap-12 py-16 md:grid-cols-12">
        <div className="md:col-span-4">
          <Logo tone="light" />
          <p className="mt-6 max-w-xs text-[0.95rem] leading-relaxed text-white/70">{site.tagline} Maintenance, repairs and preservation, done properly and photographed every time.</p>
          <Link
            href="/book"
            className="bg-brand-gradient mt-7 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[0.9rem] font-semibold text-white shadow-[0_10px_30px_-10px_rgb(37_99_235/0.8)] transition-transform hover:-translate-y-0.5"
          >
            <CalendarCheck size={16} /> Book online
          </Link>
          <SocialLinks className="mt-7" />
        </div>

        <FooterCol title="Services" className="md:col-span-3">
          {services.slice(0, 5).map((s) => (
            <FooterLink key={s.slug} href={`/services/${s.slug}`}>
              {s.name}
            </FooterLink>
          ))}
          <li>
            <Link href="/services" className="group inline-flex items-center gap-1.5 font-semibold text-brand-400 transition-colors hover:text-white">
              View all services
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </li>
        </FooterCol>

        <FooterCol title="Who we serve" className="md:col-span-2">
          {industries.map((i) => (
            <FooterLink key={i.slug} href={`/industries/${i.slug}`}>
              {i.name}
            </FooterLink>
          ))}
          {publishedAreas.length > 0 && (
            <>
              <li className="pt-4 text-[0.75rem] uppercase tracking-[0.14em] text-brand-400">Areas</li>
              {publishedAreas.map((a) => (
                <FooterLink key={a.slug} href={`/service-areas/${a.slug}`}>
                  {a.city}
                </FooterLink>
              ))}
            </>
          )}
        </FooterCol>

        <FooterCol title="Company" className="md:col-span-3">
          <FooterLink href="/about">About us</FooterLink>
          <FooterLink href="/service-areas">Service areas</FooterLink>
          <FooterLink href="/faq">FAQ</FooterLink>
          <FooterLink href="/contact">Contact</FooterLink>
          <FooterLink href="/request-estimate">Request a quote</FooterLink>
          <FooterLink href="/work-order">Submit a work order</FooterLink>
        </FooterCol>
      </div>

      <div className="border-t border-canvas/10">
        <div className="container-x flex flex-col gap-3 py-6 text-[0.85rem] text-canvas/55 sm:flex-row sm:justify-between">
          <p>
            © <CopyrightYear /> {site.legalName}. {site.insured && "Fully insured."}
            {site.licenseNumber && ` License #${site.licenseNumber}.`}
          </p>
          <p className="flex gap-5">
            <Link href="/privacy" className="hover:text-canvas">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-canvas">
              Terms
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, className, children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <h2 className="font-sans text-[0.75rem] font-medium uppercase tracking-[0.14em] text-brand-400">{title}</h2>
      <ul className="mt-5 space-y-2.5 text-[0.95rem]">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-canvas/75 transition-colors hover:text-canvas">
        {children}
      </Link>
    </li>
  );
}
