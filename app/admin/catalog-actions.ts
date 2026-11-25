"use server";

import { redirect } from "next/navigation";
import { refresh, updateTag } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { CATALOG_TAG } from "@/lib/data/catalog";
import { SEO_TAG } from "@/lib/data/seo";
import { slugify } from "@/lib/catalog";
import { serviceIconKeys } from "@/lib/service-icons";
import { staticPages } from "@/lib/seo";
import {
  areaSchema,
  categorySchema,
  issuesToFieldErrors,
  pageSeoSchema,
  serviceSchema,
  type FormState,
} from "@/lib/validations/catalog";

const formObject = (fd: FormData) =>
  Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string")) as Record<string, string>;

const parseJson = (raw: string | undefined) => {
  try {
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

// ───────────── Services ─────────────

export async function saveService(_prev: FormState, fd: FormData): Promise<FormState> {
  await requirePermission("catalog.manage");
  const raw = formObject(fd);
  const parsed = serviceSchema.safeParse({
    ...raw,
    options: parseJson(raw.options),
    faqs: parseJson(raw.faqs),
    images: parseJson(raw.images),
    relatedIds: fd.getAll("relatedIds").map(String),
  });
  if (!parsed.success) {
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors: issuesToFieldErrors(parsed.error.issues) };
  }
  const d = parsed.data;
  // "Save as draft" → hidden, "Publish"/"Update" → live. (Falls back to the form field if no intent is sent.)
  const intent = fd.get("intent");
  const isPublished = intent === "draft" ? false : intent === "publish" ? true : d.isPublished;
  const slug = d.slug || slugify(d.name);

  const clash = await db.service.findFirst({ where: { slug, NOT: d.id ? { id: d.id } : undefined }, select: { id: true } });
  if (clash) return { status: "error", message: "That URL slug is already used.", fieldErrors: { slug: "Already used by another service" } };

  // Only one cover image
  let coverSeen = false;
  const images = d.images.map((img, i) => {
    const isCover = img.isCover && !coverSeen;
    if (isCover) coverSeen = true;
    return { ...img, isCover: isCover || (!d.images.some((x) => x.isCover) && i === 0), sortOrder: i };
  });

  const fields = {
    slug,
    name: d.name,
    categoryId: d.categoryId,
    shortDescription: d.shortDescription,
    icon: serviceIconKeys.includes(d.icon) ? d.icon : "wrench",
    intro: d.intro,
    included: d.included,
    goodFor: d.goodFor,
    bookingMode: d.bookingMode,
    priceType: d.priceType,
    basePrice: d.priceType === "QUOTE" ? null : d.basePrice,
    priceNote: d.priceNote,
    durationMin: d.durationMin,
    bufferMin: d.bufferMin,
    minNoticeHours: d.minNoticeHours,
    maxAdvanceDays: d.maxAdvanceDays,
    slotIntervalMin: d.slotIntervalMin,
    requiresStaff: d.requiresStaff,
    isPublished,
    isFeatured: d.isFeatured,
    sortOrder: d.sortOrder,
    metaTitle: d.metaTitle,
    metaDescription: d.metaDescription,
    noIndex: d.noIndex,
  };

  const id = await db.$transaction(async (tx) => {
    const svc = d.id
      ? await tx.service.update({ where: { id: d.id }, data: fields })
      : await tx.service.create({ data: fields });

    await tx.serviceOption.deleteMany({ where: { serviceId: svc.id } });
    await tx.serviceFaq.deleteMany({ where: { serviceId: svc.id } });
    await tx.serviceImage.deleteMany({ where: { serviceId: svc.id } });
    await tx.serviceRelation.deleteMany({ where: { serviceId: svc.id } });

    if (d.options.length)
      await tx.serviceOption.createMany({ data: d.options.map((o, i) => ({ ...o, serviceId: svc.id, sortOrder: i })) });
    if (d.faqs.length)
      await tx.serviceFaq.createMany({ data: d.faqs.map((f, i) => ({ ...f, serviceId: svc.id, sortOrder: i })) });
    if (images.length) await tx.serviceImage.createMany({ data: images.map((img) => ({ ...img, serviceId: svc.id })) });
    const related = [...new Set(d.relatedIds)].filter((r) => r !== svc.id);
    if (related.length)
      await tx.serviceRelation.createMany({ data: related.map((relatedId) => ({ serviceId: svc.id, relatedId })) });
    return svc.id;
  });

  updateTag(CATALOG_TAG);
  if (!d.id) redirect(`/admin/services/${id}?created=1`);
  refresh();
  return {
    status: "saved",
    published: isPublished,
    message: isPublished ? "Published. The website is updated." : "Saved as draft — not visible on the website.",
  };
}

export async function deleteService(fd: FormData) {
  await requirePermission("catalog.manage");
  const id = String(fd.get("id") ?? "");
  if (id) await db.service.deleteMany({ where: { id } });
  updateTag(CATALOG_TAG);
  if (fd.get("from") === "list") return refresh();
  redirect("/admin/services");
}

export async function toggleServicePublished(fd: FormData) {
  await requirePermission("catalog.manage");
  const id = String(fd.get("id") ?? "");
  const svc = await db.service.findUnique({ where: { id }, select: { isPublished: true } });
  if (!svc) return;
  await db.service.update({ where: { id }, data: { isPublished: !svc.isPublished } });
  updateTag(CATALOG_TAG);
  refresh();
}

// ───────────── Categories ─────────────

export async function saveCategory(_prev: FormState, fd: FormData): Promise<FormState> {
  await requirePermission("catalog.manage");
  const parsed = categorySchema.safeParse(formObject(fd));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };
  const { id, name, sortOrder } = parsed.data;
  const slug = slugify(name);
  const clash = await db.serviceCategory.findFirst({ where: { slug, NOT: id ? { id } : undefined } });
  if (clash) return { status: "error", message: "A category with that name already exists." };
  if (id) await db.serviceCategory.update({ where: { id }, data: { name, slug, sortOrder } });
  else await db.serviceCategory.create({ data: { name, slug, sortOrder } });
  updateTag(CATALOG_TAG);
  refresh();
  return { status: "saved", message: id ? "Category updated." : "Category added." };
}

export async function deleteCategory(fd: FormData) {
  await requirePermission("catalog.manage");
  const id = String(fd.get("id") ?? "");
  // A category that still has services can't be deleted (move or delete its services first).
  const inUse = await db.service.count({ where: { categoryId: id } });
  if (inUse === 0) await db.serviceCategory.deleteMany({ where: { id } });
  updateTag(CATALOG_TAG);
  refresh();
}

// ───────────── Service areas ─────────────

export async function saveArea(_prev: FormState, fd: FormData): Promise<FormState> {
  await requirePermission("catalog.manage");
  const parsed = areaSchema.safeParse({ ...formObject(fd), serviceIds: fd.getAll("serviceIds").map(String) });
  if (!parsed.success) {
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors: issuesToFieldErrors(parsed.error.issues) };
  }
  const d = parsed.data;
  const slug = d.slug || slugify(`${d.city} ${d.region}`);
  const clash = await db.serviceArea.findFirst({ where: { slug, NOT: d.id ? { id: d.id } : undefined }, select: { id: true } });
  if (clash) return { status: "error", message: "That URL slug is already used.", fieldErrors: { slug: "Already used by another area" } };

  const fields = {
    slug,
    city: d.city,
    region: d.region.toUpperCase(),
    intro: d.intro,
    neighborhoods: d.neighborhoods,
    zipCodes: d.zipCodes,
    localNotes: d.localNotes,
    isPublished: d.isPublished,
    sortOrder: d.sortOrder,
    metaTitle: d.metaTitle,
    metaDescription: d.metaDescription,
    noIndex: d.noIndex,
  };

  const id = await db.$transaction(async (tx) => {
    const area = d.id ? await tx.serviceArea.update({ where: { id: d.id }, data: fields }) : await tx.serviceArea.create({ data: fields });
    await tx.serviceAreaService.deleteMany({ where: { areaId: area.id } });
    const ids = [...new Set(d.serviceIds)];
    if (ids.length)
      await tx.serviceAreaService.createMany({ data: ids.map((serviceId, i) => ({ areaId: area.id, serviceId, sortOrder: i })) });
    return area.id;
  });

  updateTag(CATALOG_TAG);
  if (!d.id) redirect(`/admin/areas/${id}?created=1`);
  refresh();
  return { status: "saved", message: "Saved. The website is updated." };
}

export async function deleteArea(fd: FormData) {
  await requirePermission("catalog.manage");
  const id = String(fd.get("id") ?? "");
  if (id) await db.serviceArea.deleteMany({ where: { id } });
  updateTag(CATALOG_TAG);
  if (fd.get("from") === "list") return refresh();
  redirect("/admin/areas");
}

export async function toggleAreaPublished(fd: FormData) {
  await requirePermission("catalog.manage");
  const id = String(fd.get("id") ?? "");
  const area = await db.serviceArea.findUnique({ where: { id }, select: { isPublished: true } });
  if (!area) return;
  await db.serviceArea.update({ where: { id }, data: { isPublished: !area.isPublished } });
  updateTag(CATALOG_TAG);
  refresh();
}

// ───────────── Page SEO (fixed pages) ─────────────

export async function savePageSeo(_prev: FormState, fd: FormData): Promise<FormState> {
  await requirePermission("seo.manage");
  const parsed = pageSeoSchema.safeParse(formObject(fd));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };
  const { path, title, description, noIndex } = parsed.data;
  if (!staticPages.some((p) => p.path === path)) return { status: "error", message: "Unknown page." };

  if (!title && !description && !noIndex) {
    await db.pageSeo.deleteMany({ where: { path } }); // back to defaults
  } else {
    await db.pageSeo.upsert({ where: { path }, update: { title, description, noIndex }, create: { path, title, description, noIndex } });
  }
  updateTag(SEO_TAG);
  refresh();
  return { status: "saved", message: "Saved." };
}
