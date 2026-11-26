"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { createSession, destroySession } from "@/lib/auth/session";

export type LoginState = { error?: string; email?: string };

// Compared against when the email doesn't exist, so a wrong email and a wrong password take the same time.
let dummyHash: string | undefined;
const getDummyHash = async () => (dummyHash ??= await bcrypt.hash("not-a-real-password", 12));

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Enter your email and password.", email };

  const user = await db.user.findUnique({ where: { email } });
  const ok = await bcrypt.compare(password, user?.passwordHash ?? (await getDummyHash()));
  if (!user || !ok) return { error: "That email and password don't match.", email };
  if (!user.isActive) return { error: "This account has been deactivated. Ask an admin to reactivate it.", email };

  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSession(user.id);
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

// Request updates (status, assignment, schedule, notes) live in ./request-actions.ts

export async function deleteLead(formData: FormData) {
  await requirePermission("requests.manage");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  // History and booking slots are removed with it (onDelete: Cascade), which frees any booked date.
  await db.lead.deleteMany({ where: { id } });
  if (formData.get("from") === "list") refresh(); // stay on the list
  else redirect("/admin/leads");
}
