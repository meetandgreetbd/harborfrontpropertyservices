/** Icons a service can use on its card (chosen per service in Admin → Services). */
import {
  Wrench,
  Hammer,
  Zap,
  KeyRound,
  Trees,
  Snowflake,
  Trash2,
  ClipboardCheck,
  ShieldCheck,
  Repeat,
  Building2,
  Home,
  Paintbrush,
  Droplets,
  Lightbulb,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export const serviceIcons: Record<string, { label: string; icon: LucideIcon }> = {
  wrench: { label: "Wrench (maintenance)", icon: Wrench },
  hammer: { label: "Hammer (handyman / carpentry)", icon: Hammer },
  paintbrush: { label: "Paintbrush (painting)", icon: Paintbrush },
  zap: { label: "Lightning (electrical)", icon: Zap },
  lightbulb: { label: "Lightbulb (fixtures)", icon: Lightbulb },
  droplets: { label: "Droplets (plumbing)", icon: Droplets },
  key: { label: "Key (locks)", icon: KeyRound },
  trees: { label: "Trees (landscaping)", icon: Trees },
  snowflake: { label: "Snowflake (snow removal)", icon: Snowflake },
  trash: { label: "Bin (trash-out)", icon: Trash2 },
  clipboard: { label: "Clipboard (inspections)", icon: ClipboardCheck },
  shield: { label: "Shield (secure / preservation)", icon: ShieldCheck },
  repeat: { label: "Cycle (turnovers)", icon: Repeat },
  building: { label: "Building (commercial)", icon: Building2 },
  home: { label: "House (residential)", icon: Home },
  sparkles: { label: "Sparkles (cleaning)", icon: Sparkles },
};

export const serviceIconKeys = Object.keys(serviceIcons);

export function ServiceIcon({ name, size = 22, className }: { name: string; size?: number; className?: string }) {
  const Icon = (serviceIcons[name] ?? serviceIcons.wrench).icon;
  return <Icon size={size} strokeWidth={1.75} className={className} aria-hidden="true" />;
}

/** Sensible default icon for the seeded services. */
export const defaultIconForSlug: Record<string, string> = {
  "property-maintenance": "wrench",
  handyman: "hammer",
  "light-construction": "paintbrush",
  "electrical-repairs": "zap",
  "locks-rekey-lockbox": "key",
  "landscaping-lawn-care": "trees",
  "snow-removal-ice-control": "snowflake",
  "debris-trash-removal": "trash",
  "property-inspections": "clipboard",
  "secure-and-stabilize": "shield",
  "turnover-make-ready": "repeat",
  "commercial-maintenance": "building",
};
