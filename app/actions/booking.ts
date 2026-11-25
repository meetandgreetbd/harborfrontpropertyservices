"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/email";
import { site } from "@/lib/site";
import { blocksFor, getAvailability, getSlotRules, isUniqueViolation, newBookingRef, parseYmd, ymd, type DayAvailability } from "@/lib/booking";

const DAYS_SHOWN = 21;

/** Free days + start times for the booking calendar (public). */
export async function getAvailabilityAction(serviceId: string, optionId: string | null, fromYmd?: string): Promise<DayAvailability[] | { error: string }> {
  const ctx = await getSlotRules(String(serviceId), optionId ? String(optionId) : null);
  if (!ctx) return { error: "This service can't be booked online." };
  const from = fromYmd && /^\d{4}-\d{2}-\d{2}$/.test(fromYmd) ? parseYmd(fromYmd) : new Date();
  return getAvailability(ctx.rules, from, DAYS_SHOWN);
}

export type BookingState = {
  status: "idle" | "error" | "booked";
  message?: string;
  fieldErrors?: Record<string, string>;
  ref?: string;
};

const bookingSchema = z.object({
  serviceId: z.string().min(1),
  optionId: z.string().default(""),
  start: z.iso.datetime({ offset: true, message: "Choose a time" }),
  name: z.string().trim().min(2, "Enter your name").max(100),
  email: z.email("Enter a valid email").max(200),
  phone: z.string().trim().min(7, "Enter a phone number").max(30),
  address: z.string().trim().min(5, "Enter the property address").max(300),
  propertyType: z.string().trim().max(60).default(""),
  access: z.string().trim().max(300).default(""),
  notes: z.string().trim().max(3000).default(""),
});

const fmtWhen = (d: Date) =>
  new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" }).format(d);

export async function createBooking(_prev: BookingState, fd: FormData): Promise<BookingState> {
  const raw = Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string")) as Record<string, string>;
  if (raw.website) return { status: "booked", ref: "HF-00000" }; // honeypot

  const parsed = bookingSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { status: "error", message: "Please check the highlighted fields.", fieldErrors };
  }
  const d = parsed.data;

  const ctx = await getSlotRules(d.serviceId, d.optionId || null);
  if (!ctx) return { status: "error", message: "This service can't be booked online any more. Please call us." };
  const { service, option, rules } = ctx;

  // Re-check on the server that the chosen time is really offered (never trust the browser).
  const start = new Date(d.start);
  const [day] = await getAvailability(rules, parseYmd(ymd(start)), 1);
  if (!day?.slots.includes(start.toISOString())) {
    return { status: "error", message: "Sorry — that time is no longer available. Please pick another." };
  }

  const end = new Date(start.getTime() + rules.durationMin * 60_000);
  const instant = service.bookingMode === "INSTANT";
  const kindText = service.bookingMode === "APPOINTMENT" ? "Assessment visit" : "Online booking";

  // Create the request + lock its time blocks in one transaction. A clash on the UNIQUE slot index = double booking.
  let ref = "";
  try {
    await db.$transaction(async (tx) => {
      for (let attempt = 0; attempt < 5; attempt++) {
        ref = newBookingRef();
        if (!(await tx.lead.findUnique({ where: { bookingRef: ref }, select: { id: true } }))) break;
      }
      const lead = await tx.lead.create({
        data: {
          kind: "booking",
          status: instant ? "scheduled" : "new",
          source: "website",
          bookingRef: ref,
          serviceId: service.id,
          service: service.name,
          optionName: option?.name ?? "",
          scheduledFor: start,
          scheduledEnd: end,
          name: d.name,
          email: d.email,
          phone: d.phone,
          address: d.address,
          propertyType: d.propertyType,
          access: d.access,
          message: d.notes || `${kindText}: ${service.name}${option ? ` — ${option.name}` : ""}`,
          activities: {
            create: {
              type: "created",
              byName: "Website",
              message: `${kindText} for ${fmtWhen(start)}${instant ? " (confirmed automatically)" : " — waiting for confirmation"}`,
            },
          },
        },
      });
      await tx.bookingSlot.createMany({
        data: blocksFor(start, rules.durationMin, rules.bufferMin).map((slotStart) => ({ leadId: lead.id, slotStart })),
      });
    });
  } catch (e) {
    if (isUniqueViolation(e)) return { status: "error", message: "Sorry — someone just booked that time. Please pick another." };
    console.error("[booking] failed", e);
    return { status: "error", message: `Something went wrong. Please call us on ${site.phone}.` };
  }

  // Emails (a failure here doesn't undo the booking)
  const when = fmtWhen(start);
  const what = `${service.name}${option ? ` — ${option.name}` : ""}`;
  try {
    await sendMail({
      to: process.env.LEAD_TO_EMAIL || site.email,
      replyTo: d.email,
      subject: `New ${instant ? "booking" : "booking request"} ${ref}: ${what} — ${when}`,
      text: `${kindText} ${ref}\n\nWhen: ${when}\nService: ${what}\nName: ${d.name}\nPhone: ${d.phone}\nEmail: ${d.email}\nAddress: ${d.address}\n${d.access ? `Access: ${d.access}\n` : ""}${d.notes ? `\nNotes:\n${d.notes}\n` : ""}\nOpen in admin: ${site.url}/admin/leads`,
    });
    await sendMail({
      to: d.email,
      replyTo: process.env.LEAD_TO_EMAIL || site.email,
      subject: `${instant ? "Booking confirmed" : "Booking request received"} — ${ref}`,
      text: `Hi ${d.name.split(" ")[0]},\n\n${
        instant ? "Your booking is confirmed." : "Thanks — we've received your booking request and will confirm it shortly (usually the same business day)."
      }\n\nReference: ${ref}\nService: ${what}\nWhen: ${when}\nAddress: ${d.address}\n\nNeed to change it? Call ${site.phone} or reply to this email.\n\n— ${site.name}`,
    });
  } catch (e) {
    console.error("[booking] email failed (booking saved)", e);
  }

  return { status: "booked", ref };
}
