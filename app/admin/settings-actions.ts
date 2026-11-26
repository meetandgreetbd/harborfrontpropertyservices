"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { SETTINGS_TAG, socialNetworks, type DayHours } from "@/lib/data/settings";
import { issuesToFieldErrors, type FormState } from "@/lib/validations/catalog";

const text = (max: number) => z.string().trim().max(max).default("");
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM");
const coord = (min: number, max: number) =>
  z
    .string()
    .trim()
    .default("")
    .transform((v) => (v === "" ? null : Number(v)))
    .refine((v) => v === null || (Number.isFinite(v) && v >= min && v <= max), "Not a valid coordinate");
const url = z
  .string()
  .trim()
  .max(300)
  .default("")
  .refine((v) => v === "" || /^https?:\/\/[^\s]+\.[^\s]+/i.test(v), "Use a full link starting with https://");

const siteInfoSchema = z.object({
  phone: z.string().trim().min(7, "Enter the business phone").max(40),
  email: z.email("Enter a valid email").max(200),
  street: text(200),
  city: text(100),
  region: text(60),
  postalCode: text(20),
  country: z.string().trim().length(2, "Two-letter code, e.g. US").default("US"),
  lat: coord(-90, 90),
  lng: coord(-180, 180),
  notifyEmails: z
    .string()
    .trim()
    .max(1000)
    .default("")
    .refine((v) => v.split(/[,\s;]+/).filter(Boolean).every((e) => z.email().safeParse(e).success), "One or more emails aren't valid"),
  ...Object.fromEntries(socialNetworks.map((n) => [n.key, url])),
});

function formObject(fd: FormData) {
  return Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string")) as Record<string, string>;
}

/** Admin → Settings → Site info: contact, address, hours, notification emails, social links. */
export async function saveSiteInfo(_prev: FormState, fd: FormData): Promise<FormState> {
  await requirePermission("settings.manage");
  const raw = formObject(fd);
  const parsed = siteInfoSchema.safeParse(raw);
  const fieldErrors = parsed.success ? {} : issuesToFieldErrors(parsed.error.issues);

  // Opening hours: 7 rows, fields open-<day>, opens-<day>, closes-<day>
  const hours: DayHours[] = [];
  for (let day = 0; day < 7; day++) {
    const open = raw[`open-${day}`] === "on";
    const opens = raw[`opens-${day}`] || "09:00";
    const closes = raw[`closes-${day}`] || "17:00";
    if (open && (!time.safeParse(opens).success || !time.safeParse(closes).success)) fieldErrors[`hours-${day}`] = "Use HH:MM times";
    else if (open && opens >= closes) fieldErrors[`hours-${day}`] = "Closing time must be after opening time";
    hours.push({ day, open, opens, closes });
  }

  if (!parsed.success || Object.keys(fieldErrors).length) return { status: "error", message: "Please fix the highlighted fields.", fieldErrors };

  const d = parsed.data as z.infer<typeof siteInfoSchema> & Record<string, string>;
  const data = {
    phone: d.phone,
    email: d.email,
    street: d.street,
    city: d.city,
    region: d.region.toUpperCase(),
    postalCode: d.postalCode,
    country: d.country.toUpperCase(),
    lat: d.lat,
    lng: d.lng,
    hours,
    notifyEmails: d.notifyEmails.split(/[,\s;]+/).filter(Boolean).join(", "),
    notifyNewRequests: raw.notifyNewRequests === "on",
    notifyNewBookings: raw.notifyNewBookings === "on",
    customerConfirmations: raw.customerConfirmations === "on",
    ...Object.fromEntries(socialNetworks.map((n) => [n.key, d[n.key] ?? ""])),
  };
  await db.siteSettings.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
  updateTag(SETTINGS_TAG);
  refresh();
  return { status: "saved", message: "Site info saved — the website now shows the new details." };
}

/** Accepts either the bare token or the whole <meta … content="…"> tag Google/Bing give you. */
const verification = z
  .string()
  .trim()
  .max(400)
  .default("")
  .transform((v) => v.match(/content\s*=\s*["']([^"']+)["']/i)?.[1] ?? v)
  .refine((v) => v === "" || /^[\w\-.=+/]{6,200}$/.test(v), "Paste the verification code (or the whole meta tag)");

const trackingSchema = z.object({
  googleTagIds: z
    .string()
    .trim()
    .max(300)
    .default("")
    .transform((v) => v.toUpperCase().split(/[,\s;]+/).filter(Boolean))
    .refine((ids) => ids.every((id) => /^(G|AW|GT|DC)-[A-Z0-9]{4,20}$/.test(id)), "IDs look like G-XXXXXXX (Analytics) or AW-XXXXXXX (Google Ads)"),
  gtmId: z
    .string()
    .trim()
    .toUpperCase()
    .default("")
    .refine((v) => v === "" || /^GTM-[A-Z0-9]{4,12}$/.test(v), "Looks like GTM-XXXXXXX"),
  metaPixelId: z
    .string()
    .trim()
    .default("")
    .refine((v) => v === "" || /^\d{8,20}$/.test(v), "Meta Pixel ID is a number, e.g. 123456789012345"),
  clarityId: z
    .string()
    .trim()
    .toLowerCase()
    .default("")
    .refine((v) => v === "" || /^[a-z0-9]{6,20}$/.test(v), "Clarity project ID, e.g. abcd1234ef"),
  googleVerification: verification,
  bingVerification: verification,
});

/** Admin → SEO → Analytics & tracking. IDs are validated strictly because they're written into page scripts. */
export async function saveTracking(_prev: FormState, fd: FormData): Promise<FormState> {
  await requirePermission("seo.manage");
  const parsed = trackingSchema.safeParse(formObject(fd));
  if (!parsed.success) return { status: "error", message: "Please fix the highlighted fields.", fieldErrors: issuesToFieldErrors(parsed.error.issues) };
  const d = parsed.data;
  const data = { ...d, googleTagIds: d.googleTagIds.join(", ") };
  await db.siteSettings.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
  updateTag(SETTINGS_TAG);
  refresh();
  return { status: "saved", message: "Tracking saved — the codes now load on every public page." };
}
