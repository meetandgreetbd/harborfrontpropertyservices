"use server";

import { z } from "zod";
import { refresh } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import type { FormState } from "@/lib/validations/catalog";

const hhmm = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Save the 7-day weekly schedule. Field names: open-0..6, start-0..6, end-0..6 (0 = Sunday). */
export async function saveWorkingHours(_prev: FormState, fd: FormData): Promise<FormState> {
  await requirePermission("requests.manage");
  const rows = [];
  for (let wd = 0; wd < 7; wd++) {
    const isOpen = fd.get(`open-${wd}`) === "on";
    const startTime = String(fd.get(`start-${wd}`) ?? "08:00");
    const endTime = String(fd.get(`end-${wd}`) ?? "17:00");
    if (isOpen) {
      if (!hhmm.test(startTime) || !hhmm.test(endTime)) return { status: "error", message: "Use times like 08:00 and 17:30." };
      if (startTime >= endTime) return { status: "error", message: "Each day's closing time must be after its opening time." };
      if (Number(startTime.slice(3)) % 15 || Number(endTime.slice(3)) % 15)
        return { status: "error", message: "Use 15-minute steps (e.g. 07:30, 17:45)." };
    }
    rows.push({ weekday: wd, isOpen, startTime, endTime });
  }
  await db.$transaction(rows.map((r) => db.workingHours.upsert({ where: { weekday: r.weekday }, update: r, create: r })));
  refresh();
  return { status: "saved", message: "Working hours saved. Online booking times are updated." };
}

const blockSchema = z
  .object({
    startDate: z.iso.date("Choose a start date"),
    endDate: z.iso.date("Choose an end date"),
    allDay: z.literal("on").optional(),
    startTime: z.string().default("00:00"),
    endTime: z.string().default("23:59"),
    reason: z.string().trim().max(120).default(""),
  })
  .refine((v) => v.endDate >= v.startDate, { message: "End date must be on or after the start date", path: ["endDate"] });

export async function addBlockedTime(_prev: FormState, fd: FormData): Promise<FormState> {
  await requirePermission("requests.manage");
  const parsed = blockSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };
  const v = parsed.data;
  const allDay = v.allDay === "on";
  if (!allDay && (!hhmm.test(v.startTime) || !hhmm.test(v.endTime))) return { status: "error", message: "Enter start and end times." };

  const [sy, sm, sd] = v.startDate.split("-").map(Number);
  const [ey, em, ed] = v.endDate.split("-").map(Number);
  const startsAt = allDay ? new Date(sy, sm - 1, sd, 0, 0) : new Date(sy, sm - 1, sd, ...(v.startTime.split(":").map(Number) as [number, number]));
  const endsAt = allDay ? new Date(ey, em - 1, ed + 1, 0, 0) : new Date(ey, em - 1, ed, ...(v.endTime.split(":").map(Number) as [number, number]));
  if (endsAt <= startsAt) return { status: "error", message: "The end must be after the start." };

  await db.blockedTime.create({ data: { startsAt, endsAt, reason: v.reason } });
  refresh();
  return { status: "saved", message: "Blocked. No online bookings can be made in that period." };
}

export async function deleteBlockedTime(fd: FormData) {
  await requirePermission("requests.manage");
  const id = String(fd.get("id") ?? "");
  if (id) await db.blockedTime.deleteMany({ where: { id } });
  refresh();
}
