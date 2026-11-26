import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { site } from "@/lib/site";

export const SETTINGS_TAG = "site-settings";

export type DayHours = { day: number; open: boolean; opens: string; closes: string };
export type SocialKey = "googleBusiness" | "facebook" | "instagram" | "linkedin" | "x" | "youtube" | "tiktok" | "yelp" | "nextdoor";

export const socialNetworks: { key: SocialKey; label: string; placeholder: string }[] = [
  { key: "googleBusiness", label: "Google Business Profile", placeholder: "https://g.page/r/…" },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/yourpage" },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/yourhandle" },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/…" },
  { key: "x", label: "X (Twitter)", placeholder: "https://x.com/yourhandle" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@yourchannel" },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@yourhandle" },
  { key: "yelp", label: "Yelp", placeholder: "https://yelp.com/biz/…" },
  { key: "nextdoor", label: "Nextdoor", placeholder: "https://nextdoor.com/pages/…" },
];

export const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export type SiteInfo = {
  phone: string;
  phoneHref: string;
  email: string;
  address: { street: string; city: string; region: string; postalCode: string; country: string };
  fullAddress: string;
  geo: { lat: number; lng: number };
  hours: DayHours[]; // always 7 entries, Sunday first
  notify: { emails: string[]; newRequests: boolean; newBookings: boolean; customerConfirmations: boolean };
  social: Record<SocialKey, string>;
  tracking: { googleTagIds: string[]; gtmId: string; metaPixelId: string; clarityId: string; googleVerification: string; bingVerification: string };
};

/** Hours from lib/site.ts as 7 day rows (used until the owner saves their own). */
function defaultHours(): DayHours[] {
  return weekdays.map((name, day) => {
    const row = site.hours.find((h) => (h.schemaDays as readonly string[]).includes(name));
    return row ? { day, open: true, opens: row.opens, closes: row.closes } : { day, open: false, opens: "09:00", closes: "17:00" };
  });
}

/** "(555) 123-4567" → "tel:+15551234567" (US numbers get +1). */
export function telHref(phone: string) {
  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return `tel:${digits}`;
  return `tel:${digits.length === 10 ? `+1${digits}` : digits}`;
}

/**
 * Business details, notification and tracking settings: database values over lib/site.ts defaults.
 * Cached; Admin saves call updateTag(SETTINGS_TAG) so the site updates straight away.
 */
export async function getSiteInfo(): Promise<SiteInfo> {
  "use cache";
  cacheTag(SETTINGS_TAG);
  cacheLife("max");
  const s = await db.siteSettings.findUnique({ where: { id: 1 } });

  const address = {
    street: s?.street || site.address.street,
    city: s?.city || site.address.city,
    region: s?.region || site.address.region,
    postalCode: s?.postalCode || site.address.postalCode,
    country: s?.country || site.address.country,
  };
  const phone = s?.phone || site.phone;
  const savedHours = Array.isArray(s?.hours) ? (s.hours as DayHours[]) : null;
  const list = (v: string | undefined) =>
    (v ?? "")
      .split(/[,\s;]+/)
      .map((x) => x.trim())
      .filter(Boolean);

  return {
    phone,
    phoneHref: s?.phone ? telHref(s.phone) : site.phoneHref,
    email: s?.email || site.email,
    address,
    fullAddress: `${address.street}, ${address.city}, ${address.region} ${address.postalCode}`,
    geo: { lat: s?.lat ?? site.geo.lat, lng: s?.lng ?? site.geo.lng },
    hours: savedHours?.length === 7 ? savedHours : defaultHours(),
    notify: {
      emails: list(s?.notifyEmails).length ? list(s?.notifyEmails) : [process.env.LEAD_TO_EMAIL || s?.email || site.email],
      newRequests: s?.notifyNewRequests ?? true,
      newBookings: s?.notifyNewBookings ?? true,
      customerConfirmations: s?.customerConfirmations ?? true,
    },
    social: {
      googleBusiness: s?.googleBusiness || site.social.google,
      facebook: s?.facebook || site.social.facebook,
      instagram: s?.instagram || site.social.instagram,
      linkedin: s?.linkedin || site.social.linkedin,
      x: s?.x ?? "",
      youtube: s?.youtube ?? "",
      tiktok: s?.tiktok ?? "",
      yelp: s?.yelp ?? "",
      nextdoor: s?.nextdoor ?? "",
    },
    tracking: {
      googleTagIds: list(s?.googleTagIds),
      gtmId: s?.gtmId ?? "",
      metaPixelId: s?.metaPixelId ?? "",
      clarityId: s?.clarityId ?? "",
      googleVerification: s?.googleVerification ?? "",
      bingVerification: s?.bingVerification ?? "",
    },
  };
}

/**
 * Opening hours grouped for display: consecutive days with the same times share a row
 * ("Monday – Friday  07:30–17:30"). Week shown Monday first.
 */
export function groupHours(hours: DayHours[]) {
  const order = [1, 2, 3, 4, 5, 6, 0].map((d) => hours.find((h) => h.day === d)!).filter(Boolean);
  const groups: { days: string; opens: string; closes: string; open: boolean; schemaDays: string[] }[] = [];
  for (const h of order) {
    const last = groups[groups.length - 1];
    const same = last && last.open === h.open && (!h.open || (last.opens === h.opens && last.closes === h.closes));
    if (same) {
      last.schemaDays.push(weekdays[h.day]);
      last.days = `${last.schemaDays[0]} – ${weekdays[h.day]}`;
    } else {
      groups.push({ days: weekdays[h.day], opens: h.opens, closes: h.closes, open: h.open, schemaDays: [weekdays[h.day]] });
    }
  }
  return groups;
}
