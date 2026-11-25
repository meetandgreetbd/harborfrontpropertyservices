/** Service-request workflow: statuses, priorities and sources (shared by admin pages and actions). */

export const leadStatuses = [
  { value: "new", label: "New", hint: "Not replied to yet", className: "bg-amber-100 text-amber-900 border-amber-300" },
  { value: "contacted", label: "Contacted", hint: "Spoke to the customer", className: "bg-sky-50 text-sky-900 border-sky-200" },
  { value: "quoted", label: "Quoted", hint: "Price sent, waiting for approval", className: "bg-violet-50 text-violet-900 border-violet-200" },
  { value: "scheduled", label: "Scheduled", hint: "Date booked", className: "bg-indigo-50 text-indigo-900 border-indigo-200" },
  { value: "in_progress", label: "In progress", hint: "Crew on the job", className: "bg-orange-50 text-orange-900 border-orange-200" },
  { value: "completed", label: "Completed", hint: "Job done", className: "bg-emerald-50 text-emerald-900 border-emerald-200" },
  { value: "cancelled", label: "Cancelled", hint: "Declined, lost or spam", className: "bg-neutral-100 text-neutral-600 border-neutral-200" },
] as const;

export type LeadStatus = (typeof leadStatuses)[number]["value"];
export const statusValues = leadStatuses.map((s) => s.value) as LeadStatus[];
/** Statuses that still need work. */
export const openStatuses: LeadStatus[] = ["new", "contacted", "quoted", "scheduled", "in_progress"];

export function statusMeta(value: string) {
  return leadStatuses.find((s) => s.value === value) ?? leadStatuses[0];
}

export const priorities = [
  { value: "low", label: "Low", className: "text-neutral-500" },
  { value: "normal", label: "Normal", className: "text-ink/70" },
  { value: "high", label: "High", className: "text-orange-700 font-medium" },
  { value: "urgent", label: "Urgent", className: "text-red-700 font-semibold" },
] as const;
export type Priority = (typeof priorities)[number]["value"];
export const priorityValues = priorities.map((p) => p.value) as Priority[];
export function priorityMeta(value: string) {
  return priorities.find((p) => p.value === value) ?? priorities[1];
}

export const sources = [
  { value: "website", label: "Website" },
  { value: "phone", label: "Phone call" },
  { value: "email", label: "Email" },
  { value: "walk-in", label: "In person" },
  { value: "other", label: "Other" },
] as const;
export const sourceValues = sources.map((s) => s.value);
export function sourceLabel(value: string) {
  return sources.find((s) => s.value === value)?.label ?? value;
}

export function kindLabel(kind: string) {
  if (kind === "booking") return "Online booking";
  return kind === "work-order" ? "Work order" : "Quote request";
}
