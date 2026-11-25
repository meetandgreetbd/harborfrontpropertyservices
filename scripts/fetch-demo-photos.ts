/**
 * Download DEMO photos for the website (replace with real job photos before launch).
 *
 *   1. Put a free key in .env:  UNSPLASH_ACCESS_KEY=...  (unsplash.com/developers)
 *                          or:  PEXELS_API_KEY=...       (pexels.com/api)
 *   2. npm run photos:demo
 *
 * Saves public/demo/<slot>.jpg and lib/demo-photos.json (paths + photographer credits).
 * Both Unsplash and Pexels photos are free for commercial use; we keep credits anyway.
 */
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";

type Slot = { slot: string; query: string; orientation?: "landscape" | "portrait" };

const slots: Slot[] = [
  { slot: "hero", query: "handyman repairing house interior", orientation: "portrait" },
  { slot: "about-owner", query: "contractor portrait smiling tool belt", orientation: "portrait" },
  { slot: "about-crew", query: "construction crew team working house" },
  { slot: "about-van", query: "work van tools contractor" },
  { slot: "about-job", query: "worker installing door house" },
  { slot: "proof-before", query: "damaged drywall wall hole" },
  { slot: "proof-after", query: "freshly painted white wall room" },
  { slot: "proof-lockbox", query: "door lock key front door" },
  { slot: "areas-map", query: "aerial view suburban neighborhood houses" },
  { slot: "cta", query: "modern house exterior evening" },
  { slot: "service-property-maintenance", query: "maintenance worker fixing sink" },
  { slot: "service-handyman", query: "handyman tools repair wall" },
  { slot: "service-light-construction", query: "carpenter installing wood floor" },
  { slot: "service-electrical-repairs", query: "electrician installing light fixture" },
  { slot: "service-locks-rekey-lockbox", query: "locksmith door lock" },
  { slot: "service-landscaping-lawn-care", query: "lawn mowing yard" },
  { slot: "service-snow-removal-ice-control", query: "snow shoveling driveway" },
  { slot: "service-debris-trash-removal", query: "junk removal dumpster" },
  { slot: "service-property-inspections", query: "home inspector clipboard house" },
  { slot: "service-secure-and-stabilize", query: "boarded up window house" },
  { slot: "service-turnover-make-ready", query: "empty apartment painting renovation" },
  { slot: "service-commercial-maintenance", query: "office building maintenance worker" },
  { slot: "industry-property-managers", query: "apartment building exterior" },
  { slot: "industry-lenders-reo", query: "house for sale sign" },
  { slot: "industry-investors", query: "real estate investor house renovation" },
  { slot: "industry-hoa", query: "townhouse community neighborhood" },
];

type Credit = { src: string; alt: string; credit: string; creditUrl: string; source: "Unsplash" | "Pexels" };

async function fromUnsplash(s: Slot, key: string): Promise<{ url: string; meta: Omit<Credit, "src"> } | null> {
  const q = new URLSearchParams({ query: s.query, per_page: "1", orientation: s.orientation ?? "landscape", content_filter: "high" });
  const res = await fetch(`https://api.unsplash.com/search/photos?${q}`, { headers: { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" } });
  if (!res.ok) throw new Error(`Unsplash ${res.status}: ${await res.text()}`);
  const p = (await res.json()).results?.[0];
  if (!p) return null;
  // Unsplash API guidelines: trigger the download endpoint when a photo is used.
  await fetch(p.links.download_location, { headers: { Authorization: `Client-ID ${key}` } }).catch(() => {});
  return {
    url: `${p.urls.raw}&w=${s.orientation === "portrait" ? 1100 : 1600}&q=78&fm=jpg&fit=max`,
    meta: { alt: p.alt_description ?? s.query, credit: p.user.name, creditUrl: `${p.user.links.html}?utm_source=harborfront&utm_medium=referral`, source: "Unsplash" },
  };
}

async function fromPexels(s: Slot, key: string): Promise<{ url: string; meta: Omit<Credit, "src"> } | null> {
  const q = new URLSearchParams({ query: s.query, per_page: "1", orientation: s.orientation ?? "landscape" });
  const res = await fetch(`https://api.pexels.com/v1/search?${q}`, { headers: { Authorization: key } });
  if (!res.ok) throw new Error(`Pexels ${res.status}: ${await res.text()}`);
  const p = (await res.json()).photos?.[0];
  if (!p) return null;
  return {
    url: s.orientation === "portrait" ? p.src.large : p.src.large2x,
    meta: { alt: p.alt || s.query, credit: p.photographer, creditUrl: p.photographer_url, source: "Pexels" },
  };
}

async function main() {
  const unsplash = process.env.UNSPLASH_ACCESS_KEY?.trim();
  const pexels = process.env.PEXELS_API_KEY?.trim();
  if (!unsplash && !pexels) {
    console.error("Add UNSPLASH_ACCESS_KEY or PEXELS_API_KEY to .env first (both are free).");
    process.exit(1);
  }
  const outDir = path.join("public", "demo");
  await fs.mkdir(outDir, { recursive: true });
  const manifest: Record<string, Credit> = {};

  for (const s of slots) {
    try {
      const hit = unsplash ? await fromUnsplash(s, unsplash) : await fromPexels(s, pexels!);
      if (!hit) {
        console.warn(`  - ${s.slot}: no result for "${s.query}"`);
        continue;
      }
      const img = await fetch(hit.url);
      if (!img.ok) throw new Error(`download ${img.status}`);
      const file = `${s.slot}.jpg`;
      await fs.writeFile(path.join(outDir, file), Buffer.from(await img.arrayBuffer()));
      manifest[s.slot] = { src: `/demo/${file}`, ...hit.meta };
      console.log(`  ✓ ${s.slot}  (${hit.meta.credit} / ${hit.meta.source})`);
    } catch (e) {
      console.warn(`  ! ${s.slot}: ${(e as Error).message}`);
    }
  }

  await fs.writeFile(path.join("lib", "demo-photos.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log(`\nSaved ${Object.keys(manifest).length}/${slots.length} demo photos → public/demo, manifest → lib/demo-photos.json`);
}

main();
