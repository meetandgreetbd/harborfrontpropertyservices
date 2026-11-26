"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { db } from "@/lib/db";
import { can, requireAdmin, requirePermission } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { sendMail } from "@/lib/email";
import { getSiteInfo } from "@/lib/data/settings";
import { site } from "@/lib/site";
import { kindLabel, priorityMeta, priorityValues, sourceValues, statusMeta, statusValues } from "@/lib/leads";
import { issuesToFieldErrors, type FormState } from "@/lib/validations/catalog";
import { blocksFor, isUniqueViolation } from "@/lib/booking";

const enumOf = <T extends string>(values: readonly T[]) => z.enum(values as unknown as [T, ...T[]]);

/** "2026-11-26T10:30" from <input type="datetime-local"> → Date (server local time), "" → null */
const dateTimeLocal = z
  .string()
  .trim()
  .default("")
  .refine((v) => v === "" || !Number.isNaN(new Date(v).getTime()), "Enter a valid date and time")
  .transform((v) => (v === "" ? null : new Date(v)));

const fmt = (d: Date | null) =>
  d ? new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(d) : "not set";

// ───────────── Update a request ─────────────

const updateSchema = z.object({
  id: z.string().min(1),
  status: enumOf(statusValues),
  priority: enumOf(priorityValues).default("normal"), // not sent by staff logins (field disabled)
  assignedToId: z.string().default(""),
  scheduledFor: dateTimeLocal,
  notes: z.string().max(10000).default(""),
  comment: z.string().trim().max(2000).default(""),
  notifyStaff: z.literal("on").optional(),
});

export async function updateRequest(_prev: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = updateSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { status: "error", message: "Please check the form.", fieldErrors: issuesToFieldErrors(parsed.error.issues) };
  const d = parsed.data;

  const lead = await db.lead.findUnique({ where: { id: d.id }, include: { assignedTo: true } });
  if (!lead) return { status: "error", message: "This request no longer exists." };

  // Staff logins: only their own jobs, and only status / notes / updates. Everything else stays as set by a manager.
  if (!can(admin.role, "requests.manage")) {
    if (!can(admin.role, "requests.updateOwn") || !admin.staffId || lead.assignedToId !== admin.staffId) {
      return { status: "error", message: "You can only update jobs assigned to you." };
    }
    d.assignedToId = lead.assignedToId ?? "";
    d.scheduledFor = lead.scheduledFor;
    d.priority = lead.priority as typeof d.priority;
    d.notifyStaff = undefined;
  }

  const assignedToId = d.assignedToId || null;
  const staff = assignedToId ? await db.staff.findUnique({ where: { id: assignedToId } }) : null;
  if (assignedToId && !staff) return { status: "error", message: "That staff member no longer exists." };

  // Work out what changed, for the history log
  const log: { type: string; message: string }[] = [];
  if (lead.status !== d.status) log.push({ type: "status", message: `Status: ${statusMeta(lead.status).label} → ${statusMeta(d.status).label}` });
  if (lead.priority !== d.priority) log.push({ type: "priority", message: `Priority: ${priorityMeta(lead.priority).label} → ${priorityMeta(d.priority).label}` });
  if ((lead.assignedToId ?? null) !== assignedToId)
    log.push({ type: "assigned", message: staff ? `Assigned to ${staff.name}` : `Unassigned (was ${lead.assignedTo?.name ?? "nobody"})` });
  if ((lead.scheduledFor?.getTime() ?? null) !== (d.scheduledFor?.getTime() ?? null))
    log.push({ type: "scheduled", message: d.scheduledFor ? `Scheduled for ${fmt(d.scheduledFor)}` : "Schedule cleared" });
  if ((lead.notes ?? "") !== d.notes) log.push({ type: "edited", message: "Internal notes updated" });
  if (d.comment) log.push({ type: "note", message: d.comment });

  if (log.length === 0) return { status: "saved", message: "No changes to save." };

  // Moving to "scheduled" without a date is allowed, but nudge if a date was set while still "new"
  const status = d.scheduledFor && lead.status === "new" && d.status === "new" ? "scheduled" : d.status;
  if (status !== d.status) log.push({ type: "status", message: `Status: New → Scheduled (date was set)` });

  // Online bookings hold time blocks. Cancelling frees them; rescheduling moves them (refused if the new time clashes).
  const isBooking = lead.kind === "booking";
  const timeChanged = (lead.scheduledFor?.getTime() ?? null) !== (d.scheduledFor?.getTime() ?? null);
  const durationMin =
    lead.scheduledFor && lead.scheduledEnd ? Math.round((lead.scheduledEnd.getTime() - lead.scheduledFor.getTime()) / 60_000) : 60;
  const bufferMin = lead.serviceId ? ((await db.service.findUnique({ where: { id: lead.serviceId }, select: { bufferMin: true } }))?.bufferMin ?? 0) : 0;
  const releaseSlots = isBooking && (status === "cancelled" || (timeChanged && !d.scheduledFor));
  const moveSlots = isBooking && status !== "cancelled" && timeChanged && d.scheduledFor;

  try {
    await db.$transaction(async (tx) => {
      await tx.lead.update({
        where: { id: d.id },
        data: {
          status,
          priority: d.priority,
          assignedToId,
          scheduledFor: d.scheduledFor,
          scheduledEnd: isBooking && d.scheduledFor ? new Date(d.scheduledFor.getTime() + durationMin * 60_000) : isBooking ? null : undefined,
          notes: d.notes,
        },
      });
      if (releaseSlots || moveSlots) await tx.bookingSlot.deleteMany({ where: { leadId: d.id } });
      if (moveSlots) {
        await tx.bookingSlot.createMany({ data: blocksFor(d.scheduledFor!, durationMin, bufferMin).map((slotStart) => ({ leadId: d.id, slotStart })) });
      }
      // Re-opening a cancelled booking re-reserves its time
      if (isBooking && lead.status === "cancelled" && status !== "cancelled" && !moveSlots && d.scheduledFor) {
        await tx.bookingSlot.createMany({ data: blocksFor(d.scheduledFor, durationMin, bufferMin).map((slotStart) => ({ leadId: d.id, slotStart })) });
      }
      if (releaseSlots) log.push({ type: "scheduled", message: "Booked time released" });
      await tx.leadActivity.createMany({ data: log.map((l) => ({ ...l, leadId: d.id, byName: admin.name })) });
    });
  } catch (e) {
    if (isUniqueViolation(e)) return { status: "error", message: "That time clashes with another booking. Pick a different time." };
    throw e;
  }

  // Email the newly assigned crew member (or on request, re-send to the current one)
  const newlyAssigned = staff && lead.assignedToId !== staff.id;
  const emailNote =
    staff && (newlyAssigned || d.notifyStaff)
      ? await emailAssignment({ ...lead, scheduledFor: d.scheduledFor, priority: d.priority }, staff, admin.name)
      : "";

  refresh();
  return { status: "saved", message: `Saved.${emailNote}` };
}

// ───────────── Assignment email (shared) ─────────────

type AssignableLead = {
  id: string;
  kind: string;
  service: string;
  address: string;
  access: string;
  name: string;
  phone: string;
  message: string;
  priority: string;
  scheduledFor: Date | null;
  dueDate: string;
};

/** Emails a crew member the job details and logs it. Returns a short note for the admin ("" if they have no email). */
async function emailAssignment(lead: AssignableLead, staff: { name: string; email: string }, byName: string) {
  if (!staff.email) return ` ${staff.name} has no email address, so they weren't notified.`;
  const what = lead.service || kindLabel(lead.kind);
  const when = lead.scheduledFor ? fmt(lead.scheduledFor) : lead.dueDate ? `Customer's preferred date: ${lead.dueDate}` : "Not scheduled yet";
  try {
    const result = await sendMail({
      to: staff.email,
      replyTo: (await getSiteInfo()).email,
      subject: `Job assigned: ${what} — ${lead.address}`,
      text: [
        `Hi ${staff.name.split(" ")[0]},`,
        ``,
        `You've been assigned a job.`,
        ``,
        `Service: ${what}`,
        `Address: ${lead.address}`,
        `When: ${when}`,
        `Priority: ${priorityMeta(lead.priority).label}`,
        lead.access ? `Access: ${lead.access}` : "",
        `Customer: ${lead.name} · ${lead.phone}`,
        ``,
        `Details:`,
        lead.message,
        ``,
        `Open in admin: ${site.url}/admin/leads/${lead.id}`,
      ]
        .filter((l) => l !== "")
        .join("\n"),
    });
    if (result !== "sent") return ` Email to ${staff.name} not sent — SMTP isn't set up yet (see .env).`;
    await db.leadActivity.create({ data: { leadId: lead.id, type: "assigned", message: `Job details emailed to ${staff.name}`, byName } });
    return ` ${staff.name} was emailed the job details.`;
  } catch (err) {
    console.error("[request] staff email failed", err);
    return ` (Couldn't email ${staff.name} — check SMTP settings.)`;
  }
}

// ───────────── Quick assign from the requests list ─────────────

export async function quickAssign(fd: FormData): Promise<{ ok: boolean; message: string }> {
  const admin = await requirePermission("requests.manage");
  const id = String(fd.get("id") ?? "");
  const assignedToId = String(fd.get("assignedToId") ?? "") || null;

  const lead = await db.lead.findUnique({ where: { id }, include: { assignedTo: true } });
  if (!lead) return { ok: false, message: "This request no longer exists." };
  if ((lead.assignedToId ?? null) === assignedToId) return { ok: true, message: "" };

  const staff = assignedToId ? await db.staff.findUnique({ where: { id: assignedToId } }) : null;
  if (assignedToId && (!staff || !staff.isActive)) return { ok: false, message: "That staff member isn't available." };

  await db.$transaction([
    db.lead.update({ where: { id }, data: { assignedToId } }),
    db.leadActivity.create({
      data: {
        leadId: id,
        type: "assigned",
        byName: admin.name,
        message: staff ? `Assigned to ${staff.name}` : `Unassigned (was ${lead.assignedTo?.name ?? "nobody"})`,
      },
    }),
  ]);
  const note = staff ? await emailAssignment(lead, staff, admin.name) : "";
  refresh();
  return { ok: true, message: staff ? `Assigned to ${staff.name}.${note}` : "Unassigned." };
}

// ───────────── Create a request manually (phone call, email…) ─────────────

const createSchema = z.object({
  kind: z.enum(["estimate", "work-order"]),
  source: z.string().refine((v) => sourceValues.includes(v as never), "Choose a source"),
  name: z.string().trim().min(2, "Enter the customer's name").max(100),
  phone: z.string().trim().min(7, "Enter a phone number").max(30),
  email: z.union([z.literal(""), z.email("Enter a valid email")]).default(""),
  address: z.string().trim().min(5, "Enter the property address").max(300),
  service: z.string().trim().max(100).default(""),
  company: z.string().trim().max(150).default(""),
  reference: z.string().trim().max(100).default(""),
  access: z.string().trim().max(300).default(""),
  message: z.string().trim().min(3, "Describe the job").max(4000),
  priority: enumOf(priorityValues),
  assignedToId: z.string().default(""),
  scheduledFor: dateTimeLocal,
});

export async function createRequest(_prev: FormState, fd: FormData): Promise<FormState> {
  const admin = await requirePermission("requests.manage");
  const parsed = createSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { status: "error", message: "Please fix the highlighted fields.", fieldErrors: issuesToFieldErrors(parsed.error.issues) };
  const d = parsed.data;
  const staff = d.assignedToId ? await db.staff.findUnique({ where: { id: d.assignedToId } }) : null;

  const lead = await db.lead.create({
    data: {
      kind: d.kind,
      source: d.source,
      name: d.name,
      phone: d.phone,
      email: d.email,
      address: d.address,
      service: d.service,
      company: d.company,
      reference: d.reference,
      access: d.access,
      message: d.message,
      priority: d.priority,
      assignedToId: staff?.id ?? null,
      scheduledFor: d.scheduledFor,
      status: d.scheduledFor ? "scheduled" : "new",
      activities: {
        create: [
          { type: "created", byName: admin.name, message: `Added by ${admin.name} (${d.source})` },
          ...(staff ? [{ type: "assigned", byName: admin.name, message: `Assigned to ${staff.name}` }] : []),
          ...(d.scheduledFor ? [{ type: "scheduled", byName: admin.name, message: `Scheduled for ${fmt(d.scheduledFor)}` }] : []),
        ],
      },
    },
  });
  if (staff) await emailAssignment(lead, staff, admin.name); // notify the crew member, same as assigning later
  redirect(`/admin/leads/${lead.id}?created=1`);
}

// ───────────── Quick status change from the list ─────────────

export async function quickSetStatus(fd: FormData) {
  const admin = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const status = String(fd.get("status") ?? "");
  if (!statusValues.includes(status as never)) return;
  const lead = await db.lead.findUnique({ where: { id }, select: { status: true, assignedToId: true } });
  if (!lead || lead.status === status) return;
  if (!can(admin.role, "requests.manage") && (!admin.staffId || lead.assignedToId !== admin.staffId)) return;
  await db.$transaction([
    db.lead.update({ where: { id }, data: { status } }),
    ...(status === "cancelled" ? [db.bookingSlot.deleteMany({ where: { leadId: id } })] : []),
    db.leadActivity.create({
      data: { leadId: id, type: "status", byName: admin.name, message: `Status: ${statusMeta(lead.status).label} → ${statusMeta(status).label}` },
    }),
  ]);
  refresh();
}

// ───────────── Staff ─────────────

const staffSchema = z.object({
  id: z.string().default(""),
  name: z.string().trim().min(2, "Enter a name").max(100),
  role: z.string().trim().max(100).default(""),
  phone: z.string().trim().max(30).default(""),
  email: z.union([z.literal(""), z.email("Enter a valid email")]).default(""),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Pick a colour")
    .default("#56664b"),
  notes: z.string().trim().max(2000).default(""),
  isActive: z.literal("on").optional(),
});

/** Edit a crew member. */
export async function saveStaff(_prev: FormState, fd: FormData): Promise<FormState> {
  await requirePermission("staff.manage");
  const parsed = staffSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { status: "error", message: "Please fix the highlighted fields.", fieldErrors: issuesToFieldErrors(parsed.error.issues) };
  const { id, isActive, ...data } = parsed.data;
  if (!id) return { status: "error", message: "Use “Add staff member” to add someone new." };
  await db.staff.update({ where: { id }, data: { ...data, notes: data.notes || null, isActive: isActive === "on" } });
  refresh();
  return { status: "saved", message: "Saved." };
}

const addStaffSchema = z.object({
  mode: z.enum(["existing", "new"]),
  userId: z.string().default(""),
  name: z.string().trim().max(100).default(""),
  email: z.string().trim().max(200).default(""),
  password: z.string().default(""),
  role: z.string().trim().max(100).default(""), // job title
  phone: z.string().trim().max(30).default(""),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Pick a colour")
    .default("#56664b"),
  notes: z.string().trim().max(2000).default(""),
  isActive: z.literal("on").optional(),
});

/**
 * Add a crew member. Every crew member has a login:
 *  - "existing": link a user picked in the search (any role; admins/managers who also do jobs)
 *  - "new": create a user with the Staff role + the crew record together
 */
export async function addStaff(_prev: FormState, fd: FormData): Promise<FormState> {
  await requirePermission("staff.manage");
  const parsed = addStaffSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { status: "error", message: "Please fix the highlighted fields.", fieldErrors: issuesToFieldErrors(parsed.error.issues) };
  const d = parsed.data;
  const crew = { role: d.role, phone: d.phone, color: d.color, notes: d.notes || null, isActive: d.isActive === "on" };

  if (d.mode === "existing") {
    if (!d.userId) return { status: "error", message: "Search for and pick a user.", fieldErrors: { userId: "Pick a user" } };
    const user = await db.user.findUnique({ where: { id: d.userId }, select: { id: true, name: true, email: true, staffId: true } });
    if (!user) return { status: "error", message: "That user no longer exists.", fieldErrors: { userId: "Pick the user again" } };
    if (user.staffId) return { status: "error", message: `${user.name} is already a crew member.`, fieldErrors: { userId: "Already a crew member" } };
    await db.$transaction(async (tx) => {
      const staff = await tx.staff.create({ data: { ...crew, name: user.name, email: user.email } });
      await tx.user.update({ where: { id: user.id }, data: { staffId: staff.id } });
    });
    redirect(`/admin/staff?added=${encodeURIComponent(user.name)}`);
  }

  // New user with the Staff role
  const fieldErrors: Record<string, string> = {};
  if (d.name.length < 2) fieldErrors.name = "Enter a name";
  const email = d.email.toLowerCase();
  if (!z.email().safeParse(email).success) fieldErrors.email = "Enter a valid email";
  if (d.password.length < 10) fieldErrors.password = "Use at least 10 characters";
  if (Object.keys(fieldErrors).length) return { status: "error", message: "Please fix the highlighted fields.", fieldErrors };
  if (await db.user.findUnique({ where: { email }, select: { id: true } }))
    return { status: "error", message: "That email already has a login — use “Existing user” instead.", fieldErrors: { email: "Already in use" } };

  const passwordHash = await bcrypt.hash(d.password, 12);
  await db.$transaction(async (tx) => {
    const staff = await tx.staff.create({ data: { ...crew, name: d.name, email } });
    await tx.user.create({ data: { name: d.name, email, role: "staff", isActive: crew.isActive, passwordHash, staffId: staff.id } });
  });
  redirect(`/admin/staff?added=${encodeURIComponent(d.name)}`);
}

export async function deleteStaff(fd: FormData) {
  await requirePermission("staff.manage");
  const id = String(fd.get("id") ?? "");
  const count = await db.lead.count({ where: { assignedToId: id } });
  // Keep history intact: staff with jobs are deactivated, not deleted.
  if (count > 0) await db.staff.update({ where: { id }, data: { isActive: false } });
  else await db.staff.delete({ where: { id } }); // the linked login stays (User.staffId is cleared)
  if (fd.get("from") === "list") return refresh();
  redirect("/admin/staff");
}
