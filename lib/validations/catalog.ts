import { z } from "zod";

const slug = z
  .string()
  .trim()
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes only (e.g. lock-changes)");

/** Textarea with one item per line → string[] */
export const lines = z
  .string()
  .default("")
  .transform((v) =>
    v
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean),
  );

const money = z
  .string()
  .trim()
  .default("")
  .refine((v) => v === "" || /^\d+(\.\d{1,2})?$/.test(v), "Enter a price like 95 or 95.50")
  .transform((v) => (v === "" ? null : v));

const optionalInt = (min: number, max: number) =>
  z
    .union([z.literal(""), z.coerce.number().int().min(min).max(max)])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v));

const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal("")])
  .optional()
  .transform((v) => v === "on" || v === "true");

export const seoFields = {
  metaTitle: z.string().trim().max(120, "Keep the meta title under 120 characters").default(""),
  metaDescription: z.string().trim().max(200, "Keep the meta description under 200 characters").default(""),
  noIndex: checkbox,
};

export const serviceSchema = z.object({
  id: z.string().optional().default(""),
  name: z.string().trim().min(2, "Enter the service name").max(120),
  slug: z.union([z.literal(""), slug]).default(""),
  categoryId: z.string().min(1, "Choose a category"),
  shortDescription: z.string().trim().min(10, "Write a one-line description (10+ characters)").max(300),
  icon: z.string().trim().max(40).default("wrench"),
  intro: z.string().trim().max(10000).default(""),
  included: lines,
  goodFor: lines,
  bookingMode: z.enum(["INSTANT", "REQUEST", "APPOINTMENT", "QUOTE"]),
  priceType: z.enum(["FIXED", "STARTING_AT", "HOURLY", "QUOTE"]),
  basePrice: money,
  priceNote: z.string().trim().max(300).default(""),
  durationMin: z.coerce.number().int().min(15, "At least 15 minutes").max(1440),
  bufferMin: z.coerce.number().int().min(0).max(480),
  minNoticeHours: z.coerce.number().int().min(0).max(720),
  maxAdvanceDays: z.coerce.number().int().min(1).max(365),
  slotIntervalMin: z.coerce.number().int().min(15).max(240),
  requiresStaff: checkbox,
  isPublished: checkbox,
  isFeatured: checkbox,
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  ...seoFields,
  options: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Option name is required").max(120),
        description: z.string().trim().max(300).default(""),
        price: money,
        durationMin: optionalInt(15, 1440),
        isActive: z.boolean().default(true),
      }),
    )
    .default([]),
  faqs: z
    .array(
      z.object({
        question: z.string().trim().min(3, "Question is required").max(300),
        answer: z.string().trim().min(3, "Answer is required").max(5000),
      }),
    )
    .default([]),
  images: z
    .array(
      z.object({
        url: z
          .string()
          .trim()
          .min(1, "Image URL is required")
          .max(500)
          .refine((v) => v.startsWith("/") || /^https?:\/\//.test(v), "Use /photos/file.jpg or a full https:// link"),
        alt: z.string().trim().min(3, "Describe the photo (alt text) — required for SEO").max(200),
        caption: z.string().trim().max(200).default(""),
        isCover: z.boolean().default(false),
      }),
    )
    .default([]),
  relatedIds: z.array(z.string()).default([]),
});
export type ServiceInput = z.infer<typeof serviceSchema>;

export const areaSchema = z.object({
  id: z.string().optional().default(""),
  city: z.string().trim().min(2, "Enter the city").max(100),
  region: z.string().trim().min(2, "Enter the state (e.g. TX)").max(10),
  slug: z.union([z.literal(""), slug]).default(""),
  intro: z.string().trim().min(20, "Write a short local intro (20+ characters)").max(5000),
  neighborhoods: lines,
  zipCodes: lines,
  localNotes: lines,
  serviceIds: z.array(z.string()).default([]),
  isPublished: checkbox,
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  ...seoFields,
});

export const categorySchema = z.object({
  id: z.string().optional().default(""),
  name: z.string().trim().min(2, "Enter a category name").max(80),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export const pageSeoSchema = z.object({
  path: z.string().min(1).max(200),
  title: z.string().trim().max(120, "Keep the title under 120 characters").default(""),
  description: z.string().trim().max(200, "Keep the description under 200 characters").default(""),
  noIndex: checkbox,
});

export type FormState = {
  status: "idle" | "saved" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
  /** Services: published state after the save (drives the Draft / Published display). */
  published?: boolean;
};

/** Flatten zod issues to { "options.0.name": "message" } for inline display. */
export function issuesToFieldErrors(issues: z.core.$ZodIssue[]) {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const key = i.path.join(".");
    if (!out[key]) out[key] = i.message;
  }
  return out;
}
