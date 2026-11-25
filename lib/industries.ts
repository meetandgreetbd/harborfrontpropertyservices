export type Industry = {
  slug: string;
  name: string;
  headline: string;
  metaDescription: string;
  intro: string;
  pains: string[];
  howWeHelp: { title: string; body: string }[];
  services: string[]; // service slugs
};

export const industries: Industry[] = [
  {
    slug: "property-managers",
    name: "Property Managers",
    headline: "One maintenance crew for your whole portfolio",
    metaDescription:
      "Maintenance, turnovers and inspections for property managers. One point of contact, approval limits you set, and photo reports on every work order.",
    intro:
      "You manage people, leases and owners. You shouldn't also be chasing five different vendors to get a faucet fixed. Send us the work order; we'll schedule it, do it, and close it out with photos.",
    pains: [
      "Vendors who don't show or don't call back",
      "Owners asking for proof the work was done",
      "Vacant days adding up between tenants",
      "Small invoices with no detail",
    ],
    howWeHelp: [
      { title: "Approval limits you set", body: "Give us a not-to-exceed amount per job. Anything over it waits for your OK." },
      { title: "Photos on every work order", body: "Before-and-after photos you can forward straight to the owner." },
      { title: "Turnovers on a schedule", body: "Move-out walk-through within days of vacancy, with a single written scope." },
    ],
    services: ["property-maintenance", "turnover-make-ready", "handyman", "property-inspections"],
  },
  {
    slug: "lenders-reo",
    name: "Lenders & REO",
    headline: "Property preservation, documented the way servicers need it",
    metaDescription:
      "Property preservation for lenders, servicers and asset managers: inspections, securing, winterization, trash-outs and lawn maintenance with lender-standard photos.",
    intro:
      "Vacant and bank-owned properties need fast, documented work. We complete preservation orders, follow your photo requirements, and update your portal or send reports the same day.",
    pains: [
      "Rejected work orders over missing photos",
      "Code violations on vacant properties",
      "Slow turnaround on initial securing",
    ],
    howWeHelp: [
      { title: "Your photo standards", body: "Before, during and after photos in the order and format your portal requires." },
      { title: "Initial secure and stabilize", body: "Lock change, board-up, winterization and hazard fixes on first visit." },
      { title: "Recurring upkeep", body: "Grass cuts, snow and occupancy checks on a fixed schedule." },
    ],
    services: ["secure-and-stabilize", "locks-rekey-lockbox", "debris-trash-removal", "property-inspections", "landscaping-lawn-care"],
  },
  {
    slug: "investors",
    name: "Real Estate Investors",
    headline: "Your eyes and hands on properties you can't visit",
    metaDescription:
      "Maintenance, inspections, turnovers and light construction for real estate investors and out-of-town landlords. Clear quotes and photo updates.",
    intro:
      "Whether it's a flip, a BRRRR or a single rental across the state, you need someone local you can trust to tell you what's actually going on — and fix it.",
    pains: ["You can't see the property yourself", "Contractors who expand the scope", "No idea what a fair price is"],
    howWeHelp: [
      { title: "Walk-through before you buy", body: "Condition report with photos so you know what you're taking on." },
      { title: "Written scope, fixed quote", body: "We price the list you approve and stick to it." },
      { title: "Updates without asking", body: "Photos at each stage, not just at the end." },
    ],
    services: ["property-inspections", "light-construction", "turnover-make-ready", "property-maintenance"],
  },
  {
    slug: "hoa",
    name: "HOAs & Community Associations",
    headline: "Common areas kept up, without board members chasing vendors",
    metaDescription:
      "Common-area maintenance for HOAs and community associations: grounds, snow, lighting, repairs and scheduled inspections with reports for the board.",
    intro:
      "Board members are volunteers. We take care of the common areas on a set schedule and send a short report the board can read in two minutes.",
    pains: ["Residents reporting the same issue for weeks", "Seasonal work that starts too late", "No record of what was done"],
    howWeHelp: [
      { title: "Seasonal calendar", body: "Snow, leaves and spring cleanup booked before the season starts." },
      { title: "Common-area checks", body: "Lighting, gates, mailboxes, signage and amenities checked on each visit." },
      { title: "Board-ready reports", body: "A short monthly summary with photos." },
    ],
    services: ["landscaping-lawn-care", "snow-removal-ice-control", "property-maintenance", "electrical-repairs"],
  },
];

export function getIndustry(slug: string) {
  return industries.find((i) => i.slug === slug);
}
