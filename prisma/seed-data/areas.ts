/**
 * Service-area (city) pages. Each city needs UNIQUE copy — real neighborhoods,
 * ZIP codes and local conditions. Pages with `draft: true` render with
 * `noindex` and are left out of the sitemap and hub until they're written.
 *
 * TODO(owner): replace the example below with your real cities.
 */
export type Area = {
  slug: string;
  city: string;
  region: string;
  draft?: boolean;
  intro: string;
  neighborhoods: string[];
  zips: string[];
  localNotes: string[]; // weather, housing stock, local rules — what makes this city different
  featuredServices: string[];
};

export const areas: Area[] = [
  {
    slug: "example-city",
    city: "Example City",
    region: "ST",
    draft: true,
    intro:
      "TODO: two or three sentences about working in this city — the kind of properties you maintain here and how quickly you can get there.",
    neighborhoods: ["Neighborhood one", "Neighborhood two", "Neighborhood three"],
    zips: ["00000", "00001"],
    localNotes: [
      "TODO: local weather issue (e.g. freeze/thaw, storm season)",
      "TODO: housing stock (e.g. older homes, lots of duplexes)",
      "TODO: local rule (e.g. rental registration, vacant-property ordinance)",
    ],
    featuredServices: ["property-maintenance", "turnover-make-ready", "secure-and-stabilize", "landscaping-lawn-care"],
  },
];

export const publishedAreas = areas.filter((a) => !a.draft);

export function getArea(slug: string) {
  return areas.find((a) => a.slug === slug);
}
