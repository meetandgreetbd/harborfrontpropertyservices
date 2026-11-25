/** Admin-only reads for service requests and staff. Callers must requireAdmin() first. */
import { db } from "@/lib/db";
import type { StaffOption } from "@/components/admin/RequestManager";

export async function getStaffOptions(): Promise<StaffOption[]> {
  return db.staff.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: { id: true, name: true, role: true, color: true, email: true, isActive: true },
  });
}

/** Date → value for <input type="datetime-local"> in server local time ("" for null). */
export function toDateTimeLocal(d: Date | null) {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
