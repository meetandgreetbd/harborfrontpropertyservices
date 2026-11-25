import type { Metadata } from "next";
import { site } from "./site";
import { industries } from "./industries";
import { getPageSeoOverride } from "./data/seo";

type PageMetaInput = {
  title: string;
  description: string;
  path: string; // e.g. "/services/handyman"
  noindex?: boolean;
};

/** Builds consistent metadata: title, description, canonical, Open Graph, Twitter, robots. */
export function pageMeta({ title, description, path, noindex }: PageMetaInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: site.name,
      type: "website",
      locale: "en_US",
    },
    twitter: { card: "summary_large_image", title, description },
    robots: noindex ? { index: false, follow: true } : undefined,
  };
}

export function absoluteUrl(path: string) {
  return new URL(path, site.url).toString();
}

/**
 * Fixed pages and their DEFAULT SEO. Admin → SEO can override title, description
 * and index/noindex for each one (stored in the PageSeo table). Services and
 * service areas have their own SEO fields in their editors.
 */
export type StaticPageSeo = { path: string; label: string; title: string; description: string };

export const staticPages: StaticPageSeo[] = [
  {
    path: "/",
    label: "Home",
    title: `Property Maintenance & Repairs in ${site.primaryCity}, ${site.primaryRegion}`,
    description: `Property maintenance, turnovers, inspections and preservation in ${site.primaryCity}. Free quotes, insured crew, and before-and-after photos on every job.`,
  },
  {
    path: "/services",
    label: "Services",
    title: `Property Services in ${site.primaryCity}`,
    description: `Every service we offer in ${site.primaryCity}: maintenance, handyman, turnovers, inspections, lock changes, trash-outs, lawn care, snow removal and property preservation.`,
  },
  {
    path: "/service-areas",
    label: "Service areas",
    title: `Service Areas Around ${site.primaryCity}`,
    description: `Towns and cities we cover for property maintenance, turnovers, inspections and preservation around ${site.primaryCity}, ${site.primaryRegion}.`,
  },
  ...industries.map((i) => ({
    path: `/industries/${i.slug}`,
    label: `Who we serve: ${i.name}`,
    title: `Property Services for ${i.name} in ${site.primaryCity}`,
    description: i.metaDescription,
  })),
  {
    path: "/about",
    label: "About",
    title: "About Us",
    description: `${site.name} is a local property maintenance company in ${site.primaryCity}. Who we are, how we work, and what you can expect on every job.`,
  },
  {
    path: "/contact",
    label: "Contact",
    title: "Contact Us",
    description: `Call ${site.phone} or send a message to ${site.name}. Quotes, work orders and questions — we reply within one business day.`,
  },
  {
    path: "/faq",
    label: "FAQ",
    title: "Frequently Asked Questions",
    description: `Answers about pricing, insurance, photo reports, scheduling and the services ${site.name} offers.`,
  },
  {
    path: "/book",
    label: "Book online",
    title: "Book Online",
    description: `Book property maintenance, handyman work, lock changes or an inspection online with ${site.name}. Pick a time that suits you.`,
  },
  {
    path: "/request-estimate",
    label: "Request a quote",
    title: "Request a Free Quote",
    description: `Request a free quote for property maintenance, repairs, turnovers or preservation in ${site.primaryCity}. We reply within one business day.`,
  },
  {
    path: "/work-order",
    label: "Work order",
    title: "Submit a Work Order",
    description:
      "Work-order form for property managers, lenders, servicers and investors. Include access details and photo requirements; we confirm the schedule the same business day.",
  },
  {
    path: "/privacy",
    label: "Privacy policy",
    title: "Privacy Policy",
    description: `How ${site.name} collects and uses the information you send through this website.`,
  },
  {
    path: "/terms",
    label: "Terms of service",
    title: "Terms of Service",
    description: `Terms for quotes, scheduling, cancellations and payment with ${site.name}.`,
  },
];

export function staticPageDefaults(path: string) {
  const page = staticPages.find((p) => p.path === path);
  if (!page) throw new Error(`No SEO defaults registered for ${path} (add it to staticPages in lib/seo.ts)`);
  return page;
}

/** Metadata for a fixed page: registry defaults + admin overrides. */
export async function seoFor(path: string): Promise<Metadata> {
  const defaults = staticPageDefaults(path);
  const o = await getPageSeoOverride(path);
  return pageMeta({
    path,
    title: o?.title || defaults.title,
    description: o?.description || defaults.description,
    noindex: o?.noIndex ?? false,
  });
}
