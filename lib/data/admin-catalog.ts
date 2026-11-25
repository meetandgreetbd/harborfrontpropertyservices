/** Admin-only reads (uncached — admin always sees live data). Callers must requireAdmin() first. */
import { db } from "@/lib/db";
import type { ServiceEditorData } from "@/components/admin/ServiceEditor";
import type { AreaEditorData } from "@/components/admin/AreaEditor";

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);

export async function getServiceForEditor(id: string): Promise<ServiceEditorData | null> {
  const s = await db.service.findUnique({
    where: { id },
    include: {
      options: { orderBy: { sortOrder: "asc" } },
      faqs: { orderBy: { sortOrder: "asc" } },
      images: { orderBy: { sortOrder: "asc" } },
      related: { select: { relatedId: true } },
    },
  });
  if (!s) return null;
  return {
    id: s.id,
    name: s.name,
    slug: s.slug,
    categoryId: s.categoryId,
    shortDescription: s.shortDescription,
    icon: s.icon,
    intro: s.intro,
    included: strings(s.included),
    goodFor: strings(s.goodFor),
    bookingMode: s.bookingMode,
    priceType: s.priceType,
    basePrice: s.basePrice == null ? "" : String(Number(s.basePrice)),
    priceNote: s.priceNote,
    durationMin: s.durationMin,
    bufferMin: s.bufferMin,
    minNoticeHours: s.minNoticeHours,
    maxAdvanceDays: s.maxAdvanceDays,
    slotIntervalMin: s.slotIntervalMin,
    requiresStaff: s.requiresStaff,
    isPublished: s.isPublished,
    isFeatured: s.isFeatured,
    sortOrder: s.sortOrder,
    metaTitle: s.metaTitle,
    metaDescription: s.metaDescription,
    noIndex: s.noIndex,
    options: s.options.map((o) => ({
      name: o.name,
      description: o.description,
      price: o.price == null ? "" : String(Number(o.price)),
      durationMin: o.durationMin == null ? "" : String(o.durationMin),
      isActive: o.isActive,
    })),
    faqs: s.faqs.map((f) => ({ question: f.question, answer: f.answer })),
    images: s.images.map((i) => ({ url: i.url, alt: i.alt, caption: i.caption, isCover: i.isCover })),
    relatedIds: s.related.map((r) => r.relatedId),
  };
}

export function emptyService(categoryId = ""): ServiceEditorData {
  return {
    id: "",
    name: "",
    slug: "",
    categoryId,
    shortDescription: "",
    icon: "wrench",
    intro: "",
    included: [],
    goodFor: [],
    bookingMode: "QUOTE",
    priceType: "QUOTE",
    basePrice: "",
    priceNote: "",
    durationMin: 60,
    bufferMin: 30,
    minNoticeHours: 24,
    maxAdvanceDays: 30,
    slotIntervalMin: 30,
    requiresStaff: true,
    isPublished: false,
    isFeatured: false,
    sortOrder: 100,
    metaTitle: "",
    metaDescription: "",
    noIndex: false,
    options: [],
    faqs: [],
    images: [],
    relatedIds: [],
  };
}

export async function getEditorLookups() {
  const [categories, allServices] = await Promise.all([
    db.serviceCategory.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    db.service.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
  ]);
  return { categories, allServices };
}

export async function getAreaForEditor(id: string): Promise<AreaEditorData | null> {
  const a = await db.serviceArea.findUnique({ where: { id }, include: { services: { orderBy: { sortOrder: "asc" } } } });
  if (!a) return null;
  return {
    id: a.id,
    city: a.city,
    region: a.region,
    slug: a.slug,
    intro: a.intro,
    neighborhoods: strings(a.neighborhoods),
    zipCodes: strings(a.zipCodes),
    localNotes: strings(a.localNotes),
    serviceIds: a.services.map((s) => s.serviceId),
    isPublished: a.isPublished,
    sortOrder: a.sortOrder,
    metaTitle: a.metaTitle,
    metaDescription: a.metaDescription,
    noIndex: a.noIndex,
  };
}

export function emptyArea(): AreaEditorData {
  return {
    id: "",
    city: "",
    region: "",
    slug: "",
    intro: "",
    neighborhoods: [],
    zipCodes: [],
    localNotes: [],
    serviceIds: [],
    isPublished: false,
    sortOrder: 100,
    metaTitle: "",
    metaDescription: "",
    noIndex: false,
  };
}
