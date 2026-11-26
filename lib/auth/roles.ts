/**
 * Roles and what each one can do. Checked on the server in every admin page and action
 * (lib/auth/index.ts → requirePermission), and used to hide menu items the user can't open.
 */
export const roles = [
  { value: "admin", label: "Admin", description: "Everything, including user accounts and roles." },
  { value: "manager", label: "Manager", description: "Requests, staff, services, service areas and SEO. Can't manage user accounts." },
  { value: "staff", label: "Staff", description: "Crew login: sees only their own assigned jobs and can update status and add notes." },
] as const;

export type Role = (typeof roles)[number]["value"];
export const roleValues = roles.map((r) => r.value) as Role[];

export type Permission =
  | "requests.viewAll" // see every request (staff only see their own)
  | "requests.manage" // create, assign, reschedule, delete requests
  | "requests.updateOwn" // change status / add notes on requests assigned to you
  | "staff.manage"
  | "catalog.manage" // services, categories, service areas
  | "seo.manage" // page SEO + analytics / tracking codes
  | "settings.manage" // site info: contact details, address, hours, notification emails, social links
  | "users.manage";

const grants: Record<Role, Permission[]> = {
  admin: ["requests.viewAll", "requests.manage", "requests.updateOwn", "staff.manage", "catalog.manage", "seo.manage", "settings.manage", "users.manage"],
  manager: ["requests.viewAll", "requests.manage", "requests.updateOwn", "staff.manage", "catalog.manage", "seo.manage", "settings.manage"],
  staff: ["requests.updateOwn"],
};

export function can(role: string, permission: Permission) {
  return (grants[role as Role] ?? []).includes(permission);
}

export function roleLabel(role: string) {
  return roles.find((r) => r.value === role)?.label ?? role;
}

export const roleBadge: Record<string, string> = {
  admin: "border-night bg-night text-canvas",
  manager: "border-sky-200 bg-sky-50 text-sky-900",
  staff: "border-neutral-200 bg-neutral-100 text-neutral-700",
};
