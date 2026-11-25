/**
 * Online booking: availability engine + slot locks.
 *
 * Times use the server's local time zone (set TZ for the business, e.g. TZ=America/Chicago, in production).
 * A booking occupies its visit length + the service's buffer, rounded up to 15-minute blocks. Each block is a
 * BookingSlot row with a UNIQUE slotStart, so the database itself rejects two bookings for the same time.
 */
import { db } from "@/lib/db";

export const BLOCK_MIN = 15;
const MIN = 60_000;

export type BookableService = {
  id: string;
  slug: string;
  name: string;
  icon: string;
  shortDescription: string;
  bookingMode: "INSTANT" | "REQUEST" | "APPOINTMENT";
  priceType: string;
  basePrice: number | null;
  durationMin: number;
  options: { id: string; name: string; description: string; price: number | null; durationMin: number | null }[];
};

export type SlotRules = {
  durationMin: number;
  bufferMin: number;
  slotIntervalMin: number;
  minNoticeHours: number;
  maxAdvanceDays: number;
};

export type DayAvailability = { date: string; weekday: number; open: boolean; slots: string[] }; // slots = ISO start times

/** Published services customers can book online (not "quote only"), with their active options. */
export async function getBookableServices(): Promise<BookableService[]> {
  const rows = await db.service.findMany({
    where: { isPublished: true, bookingMode: { in: ["INSTANT", "REQUEST", "APPOINTMENT"] } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { options: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
  });
  return rows.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    icon: s.icon,
    shortDescription: s.shortDescription,
    bookingMode: s.bookingMode as BookableService["bookingMode"],
    priceType: s.priceType,
    basePrice: s.basePrice == null ? null : Number(s.basePrice),
    durationMin: s.durationMin,
    options: s.options.map((o) => ({
      id: o.id,
      name: o.name,
      description: o.description,
      price: o.price == null ? null : Number(o.price),
      durationMin: o.durationMin,
    })),
  }));
}

/** Rules for a service (+ optional option, which can override the visit length). */
export async function getSlotRules(serviceId: string, optionId?: string | null) {
  const service = await db.service.findFirst({
    where: { id: serviceId, isPublished: true, bookingMode: { in: ["INSTANT", "REQUEST", "APPOINTMENT"] } },
    include: { options: { where: { isActive: true } } },
  });
  if (!service) return null;
  const option = optionId ? service.options.find((o) => o.id === optionId) : undefined;
  if (optionId && !option) return null;
  const rules: SlotRules = {
    durationMin: option?.durationMin ?? service.durationMin,
    bufferMin: service.bufferMin,
    slotIntervalMin: Math.max(BLOCK_MIN, service.slotIntervalMin),
    minNoticeHours: service.minNoticeHours,
    maxAdvanceDays: service.maxAdvanceDays,
  };
  return { service, option, rules };
}

// ── date helpers (local time) ──
export const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const parseYmd = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const atTime = (day: Date, hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(day);
  d.setHours(h, m, 0, 0);
  return d;
};
const floorBlock = (t: number) => Math.floor(t / (BLOCK_MIN * MIN)) * BLOCK_MIN * MIN;

/** The 15-minute block start times a booking from `start` occupies (visit + buffer). */
export function blocksFor(start: Date, durationMin: number, bufferMin: number) {
  const first = floorBlock(start.getTime());
  const end = start.getTime() + (durationMin + bufferMin) * MIN;
  const out: Date[] = [];
  for (let t = first; t < end; t += BLOCK_MIN * MIN) out.push(new Date(t));
  return out;
}

/**
 * Free start times for each day in [from, from + days).
 * One query each for hours, blocked time and occupied blocks over the whole range.
 */
export async function getAvailability(rules: SlotRules, from: Date, days: number, now = new Date()): Promise<DayAvailability[]> {
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + days);

  const earliest = now.getTime() + rules.minNoticeHours * 60 * MIN;
  const latestDay = new Date(now);
  latestDay.setHours(0, 0, 0, 0);
  latestDay.setDate(latestDay.getDate() + rules.maxAdvanceDays + 1);

  const [hours, blocked, taken] = await Promise.all([
    db.workingHours.findMany(),
    db.blockedTime.findMany({ where: { startsAt: { lt: end }, endsAt: { gt: start } } }),
    db.bookingSlot.findMany({ where: { slotStart: { gte: start, lt: end } }, select: { slotStart: true } }),
  ]);
  const takenSet = new Set(taken.map((t) => t.slotStart.getTime()));
  const span = (rules.durationMin + rules.bufferMin) * MIN;

  const result: DayAvailability[] = [];
  for (let i = 0; i < days; i++) {
    const day = new Date(start);
    day.setDate(day.getDate() + i);
    const wd = day.getDay();
    const h = hours.find((x) => x.weekday === wd);
    const open = Boolean(h?.isOpen) && day < latestDay;
    const slots: string[] = [];

    if (h && open) {
      const openAt = atTime(day, h.startTime).getTime();
      const closeAt = atTime(day, h.endTime).getTime();
      // The visit itself must finish by closing time; the buffer may run past it.
      for (let t = openAt; t + rules.durationMin * MIN <= closeAt; t += rules.slotIntervalMin * MIN) {
        if (t < earliest) continue;
        if (blocked.some((b) => t < b.endsAt.getTime() && t + span > b.startsAt.getTime())) continue;
        const occupied = blocksFor(new Date(t), rules.durationMin, rules.bufferMin).some((b) => takenSet.has(b.getTime()));
        if (!occupied) slots.push(new Date(t).toISOString());
      }
    }
    result.push({ date: ymd(day), weekday: wd, open, slots });
  }
  return result;
}

/** Customer-facing booking reference, e.g. HF-7K2Q9 (no 0/O/1/I to avoid confusion). */
export function newBookingRef() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `HF-${s}`;
}

export function isUniqueViolation(e: unknown) {
  return typeof e === "object" && e !== null && "code" in e && (e as { code?: string }).code === "P2002";
}
