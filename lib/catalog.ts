/** Labels and helpers for the service catalogue enums (shared by public site + admin). */
import type { BookingMode, PriceType } from "@/lib/generated/prisma/enums";

export const bookingModes: { value: BookingMode; label: string; help: string }[] = [
  { value: "INSTANT", label: "Instant booking", help: "Customer picks a time slot and it's confirmed immediately." },
  { value: "REQUEST", label: "Request a time", help: "Customer picks a time slot; you confirm or reject it." },
  { value: "APPOINTMENT", label: "Assessment visit", help: "Customer books a visit so you can look and quote." },
  { value: "QUOTE", label: "Quote only", help: "No calendar. Customer sends a quote request." },
];

export const priceTypes: { value: PriceType; label: string }[] = [
  { value: "FIXED", label: "Flat price" },
  { value: "STARTING_AT", label: "Starting price" },
  { value: "HOURLY", label: "Hourly" },
  { value: "QUOTE", label: "Free quote" },
];

export function priceTypeLabel(t: PriceType) {
  return priceTypes.find((p) => p.value === t)?.label ?? t;
}

export function bookingModeLabel(m: BookingMode) {
  return bookingModes.find((b) => b.value === m)?.label ?? m;
}

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

/** "Flat $95", "From $120", "$85/hr" or "Free quote". */
export function formatPrice(type: PriceType, price: number | null) {
  if (type === "QUOTE") return "Free quote";
  if (price == null) return "Price on request"; // priced service, but no price entered yet
  const p = usd.format(price);
  if (type === "FIXED") return p;
  if (type === "STARTING_AT") return `From ${p}`;
  return `${p}/hr`;
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
