import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";

export const SEO_TAG = "seo";

export type PageSeoOverride = { path: string; title: string; description: string; noIndex: boolean };

/** All admin SEO overrides for fixed pages, cached and tagged so admin saves refresh the site. */
export async function getPageSeoOverrides(): Promise<PageSeoOverride[]> {
  "use cache";
  cacheTag(SEO_TAG);
  cacheLife("max");
  return db.pageSeo.findMany({ select: { path: true, title: true, description: true, noIndex: true } });
}

export async function getPageSeoOverride(path: string): Promise<PageSeoOverride | undefined> {
  return (await getPageSeoOverrides()).find((o) => o.path === path);
}
