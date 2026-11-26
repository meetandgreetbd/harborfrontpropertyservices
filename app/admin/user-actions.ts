"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin, requirePermission } from "@/lib/auth";
import { roleValues } from "@/lib/auth/roles";
import { issuesToFieldErrors, type FormState } from "@/lib/validations/catalog";

const password = z.string().min(10, "Use at least 10 characters").max(200);

const userSchema = z.object({
  id: z.string().default(""),
  name: z.string().trim().min(2, "Enter a name").max(100),
  email: z.email("Enter a valid email").max(200),
  role: z.enum(roleValues as [string, ...string[]]),
  isActive: z.literal("on").optional(),
  password: z.string().default(""),
});

/** How many active admins would remain if `excludeId` stopped being one. */
async function otherActiveAdmins(excludeId: string) {
  return db.user.count({ where: { role: "admin", isActive: true, NOT: { id: excludeId } } });
}

/**
 * Create / edit a login and its role. The crew record is separate: Staff (crew) → Add staff member links a
 * crew member to a user (see saveStaff), so this never touches User.staffId.
 */
export async function saveUser(_prev: FormState, fd: FormData): Promise<FormState> {
  const me = await requirePermission("users.manage");
  const parsed = userSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { status: "error", message: "Please fix the highlighted fields.", fieldErrors: issuesToFieldErrors(parsed.error.issues) };
  const d = parsed.data;
  const email = d.email.toLowerCase();
  const isActive = d.isActive === "on";

  // Password: required for new users, optional when editing (blank = keep current)
  if (!d.id || d.password) {
    const p = password.safeParse(d.password);
    if (!p.success) return { status: "error", message: "Please fix the highlighted fields.", fieldErrors: { password: p.error.issues[0].message } };
  }

  const emailClash = await db.user.findFirst({ where: { email, NOT: d.id ? { id: d.id } : undefined }, select: { id: true } });
  if (emailClash) return { status: "error", message: "That email already has an account.", fieldErrors: { email: "Already in use" } };

  if (d.id) {
    const existing = await db.user.findUnique({ where: { id: d.id } });
    if (!existing) return { status: "error", message: "This user no longer exists." };
    const losingAdmin = existing.role === "admin" && existing.isActive && (d.role !== "admin" || !isActive);
    if (losingAdmin && (await otherActiveAdmins(d.id)) === 0)
      return { status: "error", message: "There must always be at least one active Admin. Make someone else an Admin first." };
    if (d.id === me.id && !isActive) return { status: "error", message: "You can't deactivate your own account." };

    await db.user.update({
      where: { id: d.id },
      data: { name: d.name, email, role: d.role, isActive, ...(d.password ? { passwordHash: await bcrypt.hash(d.password, 12) } : {}) },
    });
    refresh();
    return { status: "saved", message: d.password ? "Saved. New password set." : "Saved." };
  }

  const user = await db.user.create({ data: { name: d.name, email, role: d.role, isActive, passwordHash: await bcrypt.hash(d.password, 12) } });
  redirect(`/admin/users?created=${user.id}`);
}

export async function deleteUser(fd: FormData) {
  const me = await requirePermission("users.manage");
  const id = String(fd.get("id") ?? "");
  if (!id || id === me.id) return; // can't delete yourself
  const user = await db.user.findUnique({ where: { id } });
  if (!user) return;
  if (user.role === "admin" && user.isActive && (await otherActiveAdmins(id)) === 0) return; // never remove the last admin
  await db.user.delete({ where: { id } });
  refresh();
}

// ───────────── My profile ─────────────

const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(100),
  email: z.email("Enter a valid email").max(200),
  currentPassword: z.string().default(""),
  newPassword: z.string().default(""),
  confirmPassword: z.string().default(""),
});

export async function updateProfile(_prev: FormState, fd: FormData): Promise<FormState> {
  const me = await requireAdmin();
  const parsed = profileSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { status: "error", message: "Please fix the highlighted fields.", fieldErrors: issuesToFieldErrors(parsed.error.issues) };
  const d = parsed.data;
  const email = d.email.toLowerCase();

  const clash = await db.user.findFirst({ where: { email, NOT: { id: me.id } }, select: { id: true } });
  if (clash) return { status: "error", message: "That email already has an account.", fieldErrors: { email: "Already in use" } };

  let passwordHash: string | undefined;
  if (d.newPassword) {
    const user = await db.user.findUniqueOrThrow({ where: { id: me.id } });
    if (!(await bcrypt.compare(d.currentPassword, user.passwordHash)))
      return { status: "error", message: "Your current password is wrong.", fieldErrors: { currentPassword: "Doesn't match" } };
    const p = password.safeParse(d.newPassword);
    if (!p.success) return { status: "error", message: "Please fix the highlighted fields.", fieldErrors: { newPassword: p.error.issues[0].message } };
    if (d.newPassword !== d.confirmPassword) return { status: "error", message: "The new passwords don't match.", fieldErrors: { confirmPassword: "Doesn't match" } };
    passwordHash = await bcrypt.hash(d.newPassword, 12);
  }

  await db.user.update({ where: { id: me.id }, data: { name: d.name, email, ...(passwordHash ? { passwordHash } : {}) } });
  refresh();
  return { status: "saved", message: passwordHash ? "Profile saved and password changed." : "Profile saved." };
}
