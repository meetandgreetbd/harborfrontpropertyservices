import { site } from "./site";
import { absoluteUrl } from "./seo";
import type { AreaSummary, ServiceDetail } from "./data/catalog";
import { groupHours, type SiteInfo } from "./data/settings";

const businessId = `${site.url}/#business`;

/** Business details come from Admin → Settings → Site info (getSiteInfo). */
export function localBusinessSchema(info: SiteInfo, publishedAreas: AreaSummary[] = []) {
  const sameAs = Object.values(info.social).filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    "@id": businessId,
    name: site.name,
    legalName: site.legalName,
    url: site.url,
    telephone: info.phone,
    email: info.email,
    description: site.description,
    address: {
      "@type": "PostalAddress",
      streetAddress: info.address.street,
      addressLocality: info.address.city,
      addressRegion: info.address.region,
      postalCode: info.address.postalCode,
      addressCountry: info.address.country,
    },
    ...(info.geo.lat || info.geo.lng ? { geo: { "@type": "GeoCoordinates", latitude: info.geo.lat, longitude: info.geo.lng } } : {}),
    openingHoursSpecification: groupHours(info.hours)
      .filter((h) => h.open)
      .map((h) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: h.schemaDays,
        opens: h.opens,
        closes: h.closes,
      })),
    areaServed: [
      { "@type": "City", name: site.primaryCity },
      ...publishedAreas.map((a) => ({ "@type": "City", name: `${a.city}, ${a.region}` })),
    ],
    ...(sameAs.length ? { sameAs } : {}),
    // TODO: add aggregateRating once real Google reviews are in place — never invent it.
  };
}

export function serviceSchema(service: ServiceDetail, areaName?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: areaName ? `${service.name} in ${areaName}` : service.name,
    serviceType: service.name,
    description: service.metaDescription,
    url: absoluteUrl(`/services/${service.slug}`),
    provider: { "@id": businessId },
    areaServed: areaName ?? site.primaryCity,
  };
}

export function faqSchema(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
