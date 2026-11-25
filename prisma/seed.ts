/**
 * Seed the catalogue from the original static content.
 *   npm run db:seed
 * Safe to re-run: existing rows (matched by slug) are updated, not duplicated.
 */
import "dotenv/config";
import { db } from "../lib/db";
import { services, serviceCategories } from "./seed-data/services";
import { areas } from "./seed-data/areas";
import { slugify } from "../lib/catalog";
import type { BookingMode, PriceType } from "../lib/generated/prisma/enums";

const modeMap: Record<string, { bookingMode: BookingMode; priceType: PriceType }> = {
  fixed: { bookingMode: "REQUEST", priceType: "FIXED" },
  starting: { bookingMode: "REQUEST", priceType: "STARTING_AT" },
  hourly: { bookingMode: "REQUEST", priceType: "HOURLY" },
  quote: { bookingMode: "QUOTE", priceType: "QUOTE" },
  appointment: { bookingMode: "APPOINTMENT", priceType: "QUOTE" },
};

// Example packages so the options feature has something to show. Edit/remove in admin.
const sampleOptions: Record<string, { name: string; description?: string; price?: number; durationMin?: number }[]> = {
  handyman: [
    { name: "1 hour", description: "One or two small fixes", durationMin: 60 },
    { name: "2 hours", description: "A short to-do list", durationMin: 120 },
    { name: "Half day (4 hours)", description: "The whole list in one visit", durationMin: 240 },
  ],
  "locks-rekey-lockbox": [
    { name: "1 door", durationMin: 45 },
    { name: "2 doors", durationMin: 75 },
    { name: "3+ doors", description: "Priced per door", durationMin: 120 },
  ],
  "property-inspections": [
    { name: "Exterior occupancy check", durationMin: 30 },
    { name: "Interior condition report", durationMin: 90 },
    { name: "Move-in / move-out report", durationMin: 90 },
  ],
};

async function main() {
  // Categories
  const catIds = new Map<string, string>();
  for (const [i, name] of serviceCategories.entries()) {
    const slug = slugify(name);
    const cat = await db.serviceCategory.upsert({
      where: { slug },
      update: { name, sortOrder: i },
      create: { name, slug, sortOrder: i },
    });
    catIds.set(name, cat.id);
  }

  // Services
  const ids = new Map<string, string>();
  for (const [i, s] of services.entries()) {
    const { bookingMode, priceType } = modeMap[s.pricing.mode];
    const data = {
      name: s.name,
      categoryId: catIds.get(s.category)!,
      shortDescription: s.short,
      intro: s.intro.join("\n\n"),
      included: s.included,
      goodFor: s.goodFor,
      bookingMode,
      priceType,
      priceNote: s.pricing.note.replace(/\s*TODO:.*$/, "").trim(),
      metaTitle: s.metaTitle,
      metaDescription: s.metaDescription,
      isPublished: true,
      isFeatured: i < 8,
      sortOrder: i,
    };
    const row = await db.service.upsert({ where: { slug: s.slug }, update: data, create: { slug: s.slug, ...data } });
    ids.set(s.slug, row.id);

    await db.serviceFaq.deleteMany({ where: { serviceId: row.id } });
    await db.serviceFaq.createMany({
      data: s.faqs.map((f, j) => ({ serviceId: row.id, question: f.q, answer: f.a, sortOrder: j })),
    });

    const opts = sampleOptions[s.slug];
    if (opts && (await db.serviceOption.count({ where: { serviceId: row.id } })) === 0) {
      await db.serviceOption.createMany({
        data: opts.map((o, j) => ({ serviceId: row.id, ...o, description: o.description ?? "", sortOrder: j })),
      });
    }
  }

  // Related services
  for (const s of services) {
    const from = ids.get(s.slug)!;
    await db.serviceRelation.deleteMany({ where: { serviceId: from } });
    await db.serviceRelation.createMany({
      data: s.related.filter((r) => ids.has(r)).map((r) => ({ serviceId: from, relatedId: ids.get(r)! })),
    });
  }

  // Service areas
  for (const [i, a] of areas.entries()) {
    const data = {
      city: a.city,
      region: a.region,
      intro: a.intro,
      neighborhoods: a.neighborhoods,
      zipCodes: a.zips,
      localNotes: a.localNotes,
      isPublished: !a.draft,
      sortOrder: i,
    };
    const row = await db.serviceArea.upsert({ where: { slug: a.slug }, update: data, create: { slug: a.slug, ...data } });
    await db.serviceAreaService.deleteMany({ where: { areaId: row.id } });
    await db.serviceAreaService.createMany({
      data: a.featuredServices.filter((s) => ids.has(s)).map((s, j) => ({ areaId: row.id, serviceId: ids.get(s)!, sortOrder: j })),
    });
  }

  // Working hours for online booking (match the hours shown on the website). Only created if missing.
  const hours = [
    { weekday: 0, isOpen: false, startTime: "08:00", endTime: "13:00" },
    ...[1, 2, 3, 4, 5].map((weekday) => ({ weekday, isOpen: true, startTime: "07:30", endTime: "17:30" })),
    { weekday: 6, isOpen: true, startTime: "08:00", endTime: "13:00" },
  ];
  for (const h of hours) await db.workingHours.upsert({ where: { weekday: h.weekday }, update: {}, create: h });

  console.log(`Seeded ${catIds.size} categories, ${ids.size} services, ${areas.length} service areas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
