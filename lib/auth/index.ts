import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { readSession } from "./session";
import { can, type Permission } from "./roles";

export type AdminUser = { id: string; name: string; email: string; role: string; staffId: string | null };

/**
 * Data-access-layer guard: every admin page and action calls this (or requirePermission).
 * Verifies the session cookie, loads the user, and rejects deactivated accounts.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const session = await readSession();
  if (!session) redirect("/admin/login");
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, role: true, staffId: true, isActive: true },
  });
  if (!user || !user.isActive) redirect("/admin/login?inactive=1");
  return { id: user.id, name: user.name, email: user.email, role: user.role, staffId: user.staffId };
}

/** Same as requireAdmin, plus a role check. Users without the permission get the "no access" page. */
export async function requirePermission(permission: Permission): Promise<AdminUser> {
  const user = await requireAdmin();
  if (!can(user.role, permission)) redirect("/admin/no-access");
  return user;
}

export { can };
