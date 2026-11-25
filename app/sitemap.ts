import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { staticPages } from "@/lib/seo";
import { getSitemapCatalog } from "@/lib/data/catalog";
import { getPageSeoOverrides } from "@/lib/data/seo";

const priority: Record<string, number> = {
  "/": 1,
  "/services": 0.9,
  "/service-areas": 0.8,
  "/book": 0.8,
  "/request-estimate": 0.7,
  "/contact": 0.6,
  "/work-order": 0.6,
  "/privacy": 0.1,
  "/terms": 0.1,
};

/** Built from the database: published, indexable pages only (noindex pages are left out). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = (path: string) => `${site.url}${path === "/" ? "" : path}`;
  const [{ services, areas }, overrides] = await Promise.all([getSitemapCatalog(), getPageSeoOverrides()]);
  const noIndexPaths = new Set(overrides.filter((o) => o.noIndex).map((o) => o.path));

  return [
    ...staticPages
      .filter((p) => !noIndexPaths.has(p.path))
      .map((p) => ({ url: url(p.path), priority: priority[p.path] ?? 0.6 })),
    ...services.map((s) => ({ url: url(`/services/${s.slug}`), lastModified: s.updatedAt, priority: 0.9 })),
    ...areas.map((a) => ({ url: url(`/service-areas/${a.slug}`), lastModified: a.updatedAt, priority: 0.8 })),
  ];
}
