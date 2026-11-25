/**
 * Single source of truth for business details (NAP = Name, Address, Phone).
 * Everything on the site, the JSON-LD schema and the footer reads from here,
 * so the details stay identical everywhere — which matters for local SEO.
 *
 * TODO(owner): replace every value marked TODO with the real business details
 * before launch. Use the exact same spelling on Google Business Profile.
 */
export const site = {
  name: "Harborfront Property Services",
  legalName: "Harborfront Property Services LLC", // TODO: confirm legal name
  url: "https://harborfrontpropertyservices.com",
  tagline: "Property care, made simple.",
  description:
    "Property maintenance, repairs, inspections and turnovers for property managers, lenders, investors and owners. Licensed, insured, and photo-documented on every job.",

  phone: "(000) 000-0000", // TODO: real phone
  phoneHref: "tel:+10000000000", // TODO: real phone in E.164
  email: "office@harborfrontpropertyservices.com", // TODO: confirm inbox

  address: {
    street: "123 Example St, Suite 100", // TODO: real commercial address (not an apartment)
    city: "Your City", // TODO
    region: "ST", // TODO: two-letter state
    postalCode: "00000", // TODO
    country: "US",
  },
  geo: { lat: 0, lng: 0 }, // TODO: coordinates of the office

  // Primary market, used in headlines like "Property Maintenance in {city}"
  primaryCity: "Your City", // TODO
  primaryRegion: "ST", // TODO

  hours: [
    // TODO: real hours. Only claim 24/7 if someone actually answers the phone.
    { days: "Monday – Friday", opens: "07:30", closes: "17:30", schemaDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] },
    { days: "Saturday", opens: "08:00", closes: "13:00", schemaDays: ["Saturday"] },
  ],
  emergencyLine: false, // TODO: set true only if after-hours calls are really answered

  owner: {
    name: "Owner Name", // TODO
    title: "Founder & Operations Lead",
  },
  licenseNumber: "", // TODO: show if the state issues one
  insured: true, // TODO: confirm general liability coverage

  social: {
    google: "", // TODO: Google Business Profile URL
    facebook: "",
    instagram: "",
    linkedin: "",
  },
} as const;

export type Site = typeof site;

export const fullAddress = `${site.address.street}, ${site.address.city}, ${site.address.region} ${site.address.postalCode}`;

export const mainNav = [
  { href: "/services", label: "Services" },
  { href: "/industries/property-managers", label: "Who we serve" },
  { href: "/service-areas", label: "Service areas" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;
