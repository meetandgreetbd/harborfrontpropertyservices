/**
 * Public read layer for services and service areas.
 * Everything here is cached with `use cache` and tagged, so pages prerender as static HTML.
 * Admin save actions call updateTag("catalog") and the site refreshes immediately.
 */
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import type { BookingMode, PriceType } from "@/lib/generated/prisma/enums";

export const CATALOG_TAG = "catalog";

export type ServiceSummary = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  icon: string;
  category: string;
  isFeatured: boolean;
};

export type ServiceDetail = ServiceSummary & {
  intro: string[];
  included: string[];
  goodFor: string[];
  bookingMode: BookingMode;
  priceType: PriceType;
  basePrice: number | null;
  priceNote: string;
  durationMin: number;
  metaTitle: string;
  metaDescription: string;
  noIndex: boolean;
  options: { id: string; name: string; description: string; price: number | null; durationMin: number | null }[];
  faqs: { q: string; a: string }[];
  images: { url: string; alt: string; caption: string; isCover: boolean }[];
  related: ServiceSummary[];
};

export type AreaSummary = { id: string; slug: string; city: string; region: string; zipCodes: string[] };

export type AreaDetail = AreaSummary & {
  intro: string;
  neighborhoods: string[];
  localNotes: string[];
  metaTitle: string;
  metaDescription: string;
  noIndex: boolean;
  isPublished: boolean;
  services: ServiceSummary[];
};

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);

const summarySelect = {
  id: true,
  slug: true,
  name: true,
  shortDescription: true,
  icon: true,
  isFeatured: true,
  category: { select: { name: true } },
} as const;

type SummaryRow = { id: string; slug: string; name: string; shortDescription: string; icon: string; isFeatured: boolean; category: { name: string } };
const toSummary = (s: SummaryRow): ServiceSummary => ({
  id: s.id,
  slug: s.slug,
  name: s.name,
  shortDescription: s.shortDescription,
  icon: s.icon,
  isFeatured: s.isFeatured,
  category: s.category.name,
});

export async function getServices(): Promise<ServiceSummary[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("max");
  const rows = await db.service.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: summarySelect,
  });
  return rows.map(toSummary);
}

export async function getServicesByCategory(): Promise<{ category: string; services: ServiceSummary[] }[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("max");
  const cats = await db.serviceCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: { services: { where: { isPublished: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: summarySelect } },
  });
  return cats.filter((c) => c.services.length).map((c) => ({ category: c.name, services: c.services.map(toSummary) }));
}

export async function getServiceBySlug(slug: string): Promise<ServiceDetail | null> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("max");
  const s = await db.service.findFirst({
    where: { slug, isPublished: true },
    include: {
      category: { select: { name: true } },
      options: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      faqs: { orderBy: { sortOrder: "asc" } },
      images: { orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }] },
      related: { include: { related: { select: summarySelect } } },
    },
  });
  if (!s) return null;
  return {
    ...toSummary(s),
    intro: s.intro.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
    included: strings(s.included),
    goodFor: strings(s.goodFor),
    bookingMode: s.bookingMode,
    priceType: s.priceType,
    basePrice: s.basePrice == null ? null : Number(s.basePrice),
    priceNote: s.priceNote,
    durationMin: s.durationMin,
    metaTitle: s.metaTitle || s.name,
    metaDescription: s.metaDescription || s.shortDescription,
    noIndex: s.noIndex,
    options: s.options.map((o) => ({
      id: o.id,
      name: o.name,
      description: o.description,
      price: o.price == null ? null : Number(o.price),
      durationMin: o.durationMin,
    })),
    faqs: s.faqs.map((f) => ({ q: f.question, a: f.answer })),
    images: s.images.map((i) => ({ url: i.url, alt: i.alt, caption: i.caption, isCover: i.isCover })),
    related: s.related.map((r) => r.related).filter((r) => r).map(toSummary),
  };
}

/** Published services for a list of slugs, in the order given (used by the static industry pages). */
export async function getServicesBySlugs(slugs: string[]): Promise<ServiceSummary[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("max");
  const rows = await db.service.findMany({ where: { slug: { in: slugs }, isPublished: true }, select: summarySelect });
  const bySlug = new Map(rows.map((r) => [r.slug, toSummary(r)]));
  return slugs.map((s) => bySlug.get(s)).filter((s) => s !== undefined);
}

export async function getAllFaqs(): Promise<{ group: string; faqs: { q: string; a: string }[] }[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("max");
  const rows = await db.service.findMany({
    where: { isPublished: true, faqs: { some: {} } },
    orderBy: { sortOrder: "asc" },
    select: { name: true, faqs: { orderBy: { sortOrder: "asc" }, select: { question: true, answer: true } } },
  });
  return rows.map((s) => ({ group: s.name, faqs: s.faqs.map((f) => ({ q: f.question, a: f.answer })) }));
}

/** URLs for sitemap.xml: published and indexable services and areas only. */
export async function getSitemapCatalog(): Promise<{ services: { slug: string; updatedAt: Date }[]; areas: { slug: string; updatedAt: Date }[] }> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("max");
  const [services, areas] = await Promise.all([
    db.service.findMany({ where: { isPublished: true, noIndex: false }, orderBy: { sortOrder: "asc" }, select: { slug: true, updatedAt: true } }),
    db.serviceArea.findMany({ where: { isPublished: true, noIndex: false }, orderBy: { sortOrder: "asc" }, select: { slug: true, updatedAt: true } }),
  ]);
  return { services, areas };
}

/** Slugs of every published service (for generateStaticParams). */
export async function getServiceSlugs(): Promise<string[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("max");
  return (await db.service.findMany({ where: { isPublished: true }, select: { slug: true } })).map((s) => s.slug);
}

// ── Service areas ──

export async function getPublishedAreas(): Promise<AreaSummary[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("max");
  const rows = await db.serviceArea.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: "asc" }, { city: "asc" }],
    select: { id: true, slug: true, city: true, region: true, zipCodes: true },
  });
  return rows.map((a) => ({ ...a, zipCodes: strings(a.zipCodes) }));
}

/** All area slugs (drafts included) so draft pages can be previewed with noindex. */
export async function getAllAreaSlugs(): Promise<string[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("max");
  return (await db.serviceArea.findMany({ select: { slug: true } })).map((a) => a.slug);
}

export async function getAreaBySlug(slug: string): Promise<AreaDetail | null> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("max");
  const a = await db.serviceArea.findUnique({
    where: { slug },
    include: {
      services: {
        orderBy: { sortOrder: "asc" },
        include: { service: { select: { ...summarySelect, isPublished: true } } },
      },
    },
  });
  if (!a) return null;
  return {
    id: a.id,
    slug: a.slug,
    city: a.city,
    region: a.region,
    zipCodes: strings(a.zipCodes),
    intro: a.intro,
    neighborhoods: strings(a.neighborhoods),
    localNotes: strings(a.localNotes),
    metaTitle: a.metaTitle,
    metaDescription: a.metaDescription,
    noIndex: a.noIndex,
    isPublished: a.isPublished,
    services: a.services.filter((s) => s.service.isPublished).map((s) => toSummary(s.service)),
  };
}
