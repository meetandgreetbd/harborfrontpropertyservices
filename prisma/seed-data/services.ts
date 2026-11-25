/**
 * Service catalogue. Phase 1 keeps this in code; Phase 2 moves it into the
 * database (Prisma `Service` model) so it can be edited from /admin.
 * Keep the shape identical so the page templates don't change.
 *
 * TODO(owner): delete any service you don't actually offer, and fill in
 * real price ranges in `pricing.note`.
 */

export type BookingMode = "fixed" | "starting" | "hourly" | "quote" | "appointment";

export type Service = {
  slug: string;
  name: string;
  category: "Maintenance & repair" | "Grounds & seasonal" | "Lender & investor" | "Commercial";
  short: string; // one line for cards
  metaTitle: string;
  metaDescription: string;
  intro: string[];
  included: string[];
  goodFor: string[];
  pricing: { mode: BookingMode; note: string };
  faqs: { q: string; a: string }[];
  related: string[];
};

export const services: Service[] = [
  {
    slug: "property-maintenance",
    name: "Property Maintenance",
    category: "Maintenance & repair",
    short: "Scheduled upkeep and fix-it lists for rentals, multifamily and commercial buildings.",
    metaTitle: "Property Maintenance Services",
    metaDescription:
      "Recurring and on-call property maintenance for rentals, multifamily and small commercial buildings. One crew, one invoice, photo report on every visit.",
    intro: [
      "Most buildings don't need a big contractor. They need someone who shows up on the day they said, works through the list, and sends photos when it's done. That's what our maintenance visits are.",
      "We set up a schedule that fits the property — monthly walk-throughs, quarterly checks, or on-call only — and keep a running record of what we found and fixed, so you're not starting from zero every time something breaks.",
    ],
    included: [
      "Walk-through with a written punch list",
      "Minor plumbing: running toilets, slow drains, supply lines, faucets",
      "Doors, hinges, closers, weatherstripping and hardware",
      "Drywall patching and touch-up paint",
      "Filter changes, smoke and CO detector checks",
      "Common-area lighting and fixture replacement",
      "Before-and-after photos uploaded the same day",
    ],
    goodFor: ["Property managers with scattered portfolios", "Small multifamily owners", "Landlords who live out of town"],
    pricing: {
      mode: "starting",
      note: "Visits are billed per trip plus time and materials. Recurring plans get a fixed monthly rate once we've walked the building. TODO: add real starting price.",
    },
    faqs: [
      { q: "Do I need a contract for recurring visits?", a: "No long contract. Recurring plans are month-to-month — you can pause or cancel with 30 days' notice." },
      { q: "Can tenants contact you directly?", a: "Yes, if you want them to. We can take tenant requests, but we won't start billable work without your approval unless you set a spending limit." },
      { q: "What if the job needs a licensed plumber or electrician?", a: "We'll tell you up front. Anything that needs a permit or a licensed trade goes to a trusted partner, and we coordinate access so you don't have to." },
    ],
    related: ["handyman", "turnover-make-ready", "property-inspections"],
  },
  {
    slug: "handyman",
    name: "Handyman Services",
    category: "Maintenance & repair",
    short: "The small repairs that pile up — done in one visit, not five.",
    metaTitle: "Handyman Services",
    metaDescription:
      "Reliable handyman services for homes, rentals and offices: repairs, installs, drywall, doors, fixtures and assembly. Clear pricing and photos when the job's done.",
    intro: [
      "Send us the list. Loose railing, sticking door, a hole behind the door handle, the shelf that's been leaning since spring. We bring the common parts on the truck so most of it gets done in the first visit.",
      "If something on the list is bigger than a handyman job, we'll say so before we start rather than halfway through.",
    ],
    included: [
      "Door and lock adjustments, hardware replacement",
      "Drywall repair, caulking, trim and touch-up paint",
      "TV mounting, shelving, blinds and curtain rods",
      "Furniture and fixture assembly",
      "Grab bars, handrails and small safety fixes",
      "Appliance hook-ups (non-gas)",
    ],
    goodFor: ["Homeowners with a to-do list", "Landlords between tenants", "Offices and retail units"],
    pricing: { mode: "hourly", note: "Billed hourly with a one-hour minimum, plus materials at cost. TODO: add hourly rate." },
    faqs: [
      { q: "Do you bring materials?", a: "We carry common hardware and patch supplies. Anything specific — a light fixture you picked out, a particular faucet — we can pick up or you can have it on site." },
      { q: "How soon can you come out?", a: "Most handyman visits are scheduled within a few business days. TODO: confirm typical lead time." },
    ],
    related: ["property-maintenance", "light-construction", "electrical-repairs"],
  },
  {
    slug: "light-construction",
    name: "Light Construction & Carpentry",
    category: "Maintenance & repair",
    short: "Carpentry, flooring, drywall and paint — the bigger fixes short of a remodel.",
    metaTitle: "Light Construction, Carpentry & Drywall",
    metaDescription:
      "Carpentry, drywall, flooring repair, cabinet and countertop fixes, fencing and interior painting for rentals and commercial spaces.",
    intro: [
      "Some jobs are too big for a quick handyman visit but nowhere near a remodel: a water-damaged section of drywall, a run of rotted fence, a kitchen cabinet that's come off the wall, flooring that needs patching before the next tenant.",
      "We quote these by the job after seeing the space, and we stick to the scope we wrote down.",
    ],
    included: [
      "Drywall replacement, mudding and texture matching",
      "Interior painting — single rooms to full units",
      "Flooring repair: LVP, laminate, tile and carpet patches",
      "Cabinet, countertop and vanity repair",
      "Trim, baseboard and door replacement",
      "Fence and gate repair, small deck fixes",
    ],
    goodFor: ["Unit turnovers", "Insurance and damage repairs", "Small commercial build-outs"],
    pricing: { mode: "quote", note: "Quoted per job after a site visit or photos. The quote lists exactly what's included." },
    faqs: [
      { q: "Do you pull permits?", a: "Light construction work like this usually doesn't need one. If it does, we'll tell you and handle it, or bring in a licensed contractor." },
      { q: "Can you match existing paint and texture?", a: "Usually, yes. Give us the paint name if you have it; otherwise we'll color-match a sample." },
    ],
    related: ["handyman", "turnover-make-ready", "commercial-maintenance"],
  },
  {
    slug: "electrical-repairs",
    name: "Basic Electrical Repairs",
    category: "Maintenance & repair",
    short: "Fixtures, outlets, switches, fans and detectors — the everyday electrical items.",
    metaTitle: "Basic Electrical Repairs & Fixture Installation",
    metaDescription:
      "Light fixture, outlet, switch, ceiling fan and exhaust fan replacement, plus smoke and CO detectors and doorbell cameras.",
    intro: [
      "Like-for-like electrical work: swapping a dead outlet, replacing a light fixture, putting in a bathroom fan where one already was, adding detectors to meet a lease requirement.",
      "We don't do panel work, new circuits or anything that needs a permit. When a job crosses that line we'll refer it to a licensed electrician.",
    ],
    included: [
      "Light fixture and ceiling fan replacement",
      "Outlet, GFCI and switch replacement",
      "Bathroom exhaust fan replacement",
      "Smoke and carbon monoxide detectors",
      "Video doorbells, cameras and smart locks",
      "Bulb and ballast changes in common areas",
    ],
    goodFor: ["Rental readiness", "Inspection fix lists", "Common-area lighting"],
    pricing: { mode: "starting", note: "Priced per item. TODO: add starting price per fixture." },
    faqs: [
      { q: "Are you licensed electricians?", a: "No — and we'll be clear about that. We handle like-for-like replacements only. TODO: confirm what your state allows without a license." },
    ],
    related: ["handyman", "property-maintenance", "locks-rekey-lockbox"],
  },
  {
    slug: "locks-rekey-lockbox",
    name: "Locks, Rekeying & Lockboxes",
    category: "Lender & investor",
    short: "Lock changes between tenants, lockbox installs and access control for vacant properties.",
    metaTitle: "Lock Changes, Rekeying & Lockbox Installation",
    metaDescription:
      "Lock changes and rekeying between tenants, lockbox installation, and secure access for vacant and bank-owned properties. Photo-verified.",
    intro: [
      "When a tenant moves out or a property changes hands, the locks should change the same week. We rekey or replace entry locks, install lockboxes, and log the new key codes in your work order so nobody's guessing later.",
    ],
    included: [
      "Rekeying and lock replacement, keyed alike on request",
      "Lockbox installation and code changes",
      "Deadbolt installs and strike-plate reinforcement",
      "Garage and side-gate locks",
      "Key and code handoff logged with photos",
    ],
    goodFor: ["Tenant turnovers", "Lenders and asset managers", "Real-estate agents listing vacant homes"],
    pricing: { mode: "fixed", note: "Flat price per door. TODO: add price per door." },
    faqs: [
      { q: "How do you handle keys?", a: "New keys go wherever you tell us — your office, a lockbox on site, or the next tenant. Every handoff is noted in the work order." },
    ],
    related: ["secure-and-stabilize", "turnover-make-ready", "property-inspections"],
  },
  {
    slug: "landscaping-lawn-care",
    name: "Landscaping & Lawn Care",
    category: "Grounds & seasonal",
    short: "Mowing, trimming and seasonal cleanups that keep vacant and occupied properties presentable.",
    metaTitle: "Lawn Care & Landscaping for Rental and Vacant Properties",
    metaDescription:
      "Mowing, trimming, edging, leaf and storm cleanups for rentals, HOAs and vacant properties. Recurring or one-time, with dated photos.",
    intro: [
      "Overgrown grass is the fastest way to get a code violation on a vacant property. We mow, trim and edge on a set schedule and photograph each visit with a date stamp, which is usually what a lender or HOA needs to see.",
    ],
    included: [
      "Mowing, trimming and edging",
      "Shrub and hedge trimming",
      "Spring and fall cleanups, leaf removal",
      "Storm debris cleanup",
      "Initial cuts on badly overgrown lots",
    ],
    goodFor: ["Vacant and REO properties", "HOA common areas", "Single-family rentals"],
    pricing: { mode: "starting", note: "Recurring visits are priced by lot size. Initial overgrown cuts are quoted separately. TODO: add starting price." },
    faqs: [
      { q: "Do you provide dated photos?", a: "Yes. Every visit gets before-and-after photos with the date, attached to the work order." },
    ],
    related: ["snow-removal-ice-control", "debris-trash-removal", "property-inspections"],
  },
  {
    slug: "snow-removal-ice-control",
    name: "Snow Removal & Ice Control",
    category: "Grounds & seasonal",
    short: "Plowing, shoveling and salting for walkways, driveways and small lots.",
    metaTitle: "Snow Removal & Ice Control",
    metaDescription:
      "Seasonal snow plowing, sidewalk shoveling and salting for rentals, HOAs and small commercial lots. Per-event or seasonal contracts.",
    intro: [
      "Snow contracts are about being there before people need to walk. We agree on a trigger depth, a priority order for your properties, and what gets salted — then we show up without you having to call.",
    ],
    included: [
      "Plowing for driveways and small lots",
      "Shoveling walkways, steps and entrances",
      "Salt and ice-melt application",
      "Re-treatment after refreeze",
      "Time-stamped photos for liability records",
    ],
    goodFor: ["Multifamily and HOAs", "Small commercial lots", "Vacant properties"],
    pricing: { mode: "quote", note: "Seasonal or per-event pricing, quoted per site before the season starts." },
    faqs: [
      { q: "When should I sign up?", a: "Before the first storm. Routes fill up in the fall. TODO: set your sign-up deadline." },
    ],
    related: ["landscaping-lawn-care", "commercial-maintenance", "property-maintenance"],
  },
  {
    slug: "debris-trash-removal",
    name: "Debris & Trash-Out",
    category: "Lender & investor",
    short: "Clear-outs after evictions, move-outs and renovations — hauled and disposed of properly.",
    metaTitle: "Trash-Out, Junk & Debris Removal",
    metaDescription:
      "Trash-outs after evictions and move-outs, bulky-item removal and renovation debris hauling. Priced by the cubic yard with photo documentation.",
    intro: [
      "Left-behind furniture, a garage full of boxes, a yard of renovation debris. We clear it, haul it, and leave the space broom-swept. Lender trash-outs are documented by cubic yard with photos from each room, before and after.",
    ],
    included: [
      "Interior and exterior trash-outs",
      "Bulky item and appliance removal",
      "Construction and renovation debris",
      "Broom-sweep after clear-out",
      "Cubic-yard estimates with room-by-room photos",
    ],
    goodFor: ["Post-eviction cleanouts", "REO and pre-listing", "Landlord move-outs"],
    pricing: { mode: "quote", note: "Priced by cubic yard. Send photos for a quick estimate." },
    faqs: [
      { q: "What happens to personal property?", a: "We follow your instructions and local rules for abandoned property. Anything flagged as personal or valuable is photographed and set aside, not thrown out." },
    ],
    related: ["secure-and-stabilize", "turnover-make-ready", "landscaping-lawn-care"],
  },
  {
    slug: "property-inspections",
    name: "Property Inspections & Occupancy Checks",
    category: "Lender & investor",
    short: "Condition reports and occupancy checks with photos, delivered the same day.",
    metaTitle: "Property Inspections & Occupancy Verification",
    metaDescription:
      "Exterior and interior condition inspections, occupancy verification and move-in/move-out reports with timestamped photos for lenders, investors and managers.",
    intro: [
      "An inspection report is only useful if it's clear. Ours list what we checked, what we found and what we'd do about it, with photos next to each item — not a 40-page PDF you have to decode.",
    ],
    included: [
      "Occupancy verification (exterior)",
      "Interior condition reports",
      "Move-in and move-out reports for landlords",
      "Vacant property checks on a schedule",
      "Damage documentation for insurance claims",
    ],
    goodFor: ["Lenders and servicers", "Out-of-town investors", "Property managers"],
    pricing: { mode: "fixed", note: "Flat fee per inspection type. TODO: add prices." },
    faqs: [
      { q: "Can you use our form?", a: "Yes. If your company has a required inspection form or portal, we'll complete it there." },
    ],
    related: ["secure-and-stabilize", "locks-rekey-lockbox", "property-maintenance"],
  },
  {
    slug: "secure-and-stabilize",
    name: "Secure, Board-Up & Winterization",
    category: "Lender & investor",
    short: "Make a vacant property safe, weather-tight and code-compliant — fast.",
    metaTitle: "Property Preservation: Board-Up, Securing & Winterization",
    metaDescription:
      "Property preservation for vacant and bank-owned homes: board-ups, securing entry points, winterization, and hazard fixes. Photo-documented for lenders.",
    intro: [
      "Vacant properties deteriorate quickly once they're open to weather or trespassers. We secure every entry point, board broken openings, winterize plumbing, and fix obvious hazards, then send a report that follows lender documentation standards.",
    ],
    included: [
      "Board-up of broken doors and windows",
      "Securing entry points, sliders and crawl spaces",
      "Plumbing winterization and dewinterization",
      "Pool securing and hazard removal",
      "Tarping and temporary roof protection",
      "Photo documentation to lender standards",
    ],
    goodFor: ["Mortgage servicers and asset managers", "REO and pre-foreclosure", "Estate properties"],
    pricing: { mode: "quote", note: "Quoted per property, or by allowable fee schedule for lender clients." },
    faqs: [
      { q: "Do you follow HUD / investor guidelines?", a: "TODO: confirm which guidelines you work to (e.g., HUD, Fannie Mae, Freddie Mac) and list them here." },
    ],
    related: ["locks-rekey-lockbox", "debris-trash-removal", "property-inspections"],
  },
  {
    slug: "turnover-make-ready",
    name: "Unit Turnovers & Make-Ready",
    category: "Maintenance & repair",
    short: "Get a vacant unit rent-ready: repairs, paint, cleaning coordination and a final walk-through.",
    metaTitle: "Rental Turnover & Make-Ready Services",
    metaDescription:
      "Rental unit turnovers: move-out inspection, repairs, paint, flooring fixes, lock change and final walk-through so the unit is ready to list.",
    intro: [
      "Every vacant day costs rent. A turnover starts with a move-out walk-through and a written scope, so you approve one list instead of a dozen small invoices. Then we work it in order — repairs, paint, floors, locks — and finish with a walk-through and photos you can use in the listing.",
    ],
    included: [
      "Move-out inspection and written scope",
      "Patch, paint and caulk",
      "Flooring repairs and replacement",
      "Fixture, blind and hardware replacement",
      "Lock change",
      "Final walk-through with listing-ready photos",
    ],
    goodFor: ["Property managers", "Single-family rental owners", "Multifamily operators"],
    pricing: { mode: "quote", note: "Quoted per unit from the move-out walk-through." },
    faqs: [
      { q: "Do you handle cleaning?", a: "TODO: say whether you clean in-house or coordinate a cleaning partner." },
    ],
    related: ["light-construction", "locks-rekey-lockbox", "property-maintenance"],
  },
  {
    slug: "commercial-maintenance",
    name: "Commercial Property Maintenance",
    category: "Commercial",
    short: "Day-to-day upkeep for offices, retail units and small commercial buildings.",
    metaTitle: "Commercial Property Maintenance",
    metaDescription:
      "Maintenance for offices, retail and small commercial buildings: repairs, lighting, ceiling tiles, doors, parking-lot sweeping and after-hours work.",
    intro: [
      "Commercial tenants notice the small things — a flickering light in the hallway, a stained ceiling tile, a door that doesn't latch. We handle that layer of upkeep on a schedule, and can work early or after close so we're not in the way of your tenants.",
    ],
    included: [
      "Lighting, ceiling tiles and fixtures",
      "Doors, closers and hardware",
      "Drywall, paint and minor carpentry",
      "Parking-lot sweeping and litter pickup",
      "After-hours and weekend scheduling",
    ],
    goodFor: ["Office and retail landlords", "Facility managers", "Strip centers"],
    pricing: { mode: "quote", note: "Monthly plans or per-visit, quoted after a walk-through." },
    faqs: [
      { q: "Can you provide a certificate of insurance?", a: "Yes. We can name you as additional insured on request. TODO: confirm coverage limits." },
    ],
    related: ["property-maintenance", "snow-removal-ice-control", "light-construction"],
  },
];

export const serviceCategories = [
  "Maintenance & repair",
  "Lender & investor",
  "Grounds & seasonal",
  "Commercial",
] as const;

export function getService(slug: string) {
  return services.find((s) => s.slug === slug);
}

export const bookingModeLabel: Record<BookingMode, string> = {
  fixed: "Flat price",
  starting: "Starting price",
  hourly: "Hourly",
  quote: "Free quote",
  appointment: "Book a visit",
};
