/**
 * Demo users + crew for trying the admin locally.
 *   npm run db:seed:demo
 * Safe to re-run: users are matched by email, crew by email; passwords are reset to DEMO_PASSWORD.
 * Never run this against production — the passwords below are public.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "../lib/db";

const DEMO_PASSWORD = "Demo@12345"; // 10 characters — meets the admin's minimum

type DemoUser = {
  name: string;
  email: string;
  role: "admin" | "manager" | "staff";
  /** Crew record to create and link (makes the person assignable). Omit = login only, not crew yet. */
  crew?: { title: string; phone: string; color: string; notes?: string };
};

const demo: DemoUser[] = [
  { name: "Demo Admin", email: "admin@demo.test", role: "admin" },
  {
    name: "Maria Manager",
    email: "manager@demo.test",
    role: "manager",
    crew: { title: "Operations manager", phone: "(555) 010-2001", color: "#2f6f8f", notes: "Also does inspections." },
  },
  {
    name: "Sam Carter",
    email: "sam@demo.test",
    role: "staff",
    crew: { title: "Lead technician", phone: "(555) 010-3001", color: "#56664b", notes: "Carpentry, drywall, doors." },
  },
  {
    name: "Jordan Lee",
    email: "jordan@demo.test",
    role: "staff",
    crew: { title: "Handyman", phone: "(555) 010-3002", color: "#b5562b", notes: "Electrical fixtures, locks, small repairs." },
  },
  {
    name: "Alex Rivera",
    email: "alex@demo.test",
    role: "staff",
    crew: { title: "Grounds crew", phone: "(555) 010-3003", color: "#3d7a52", notes: "Lawn care, snow removal, debris." },
  },
  // Login only — not crew yet. Use Staff (crew) → Add staff member → Existing user to try the user picker.
  { name: "Taylor Brooks", email: "taylor@demo.test", role: "staff" },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  for (const u of demo) {
    let staffId: string | null = null;
    if (u.crew) {
      const crew = { name: u.name, email: u.email, role: u.crew.title, phone: u.crew.phone, color: u.crew.color, notes: u.crew.notes ?? null, isActive: true };
      const existing = await db.staff.findFirst({ where: { email: u.email }, select: { id: true } });
      staffId = existing ? (await db.staff.update({ where: { id: existing.id }, data: crew })).id : (await db.staff.create({ data: crew })).id;
    }

    await db.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, isActive: true, passwordHash, ...(staffId ? { staffId } : {}) },
      create: { name: u.name, email: u.email, role: u.role, isActive: true, passwordHash, staffId },
    });
  }

  console.log("Demo users ready (password for all: " + DEMO_PASSWORD + "):");
  for (const u of demo) console.log(`  ${u.role.padEnd(8)} ${u.email.padEnd(20)} ${u.crew ? "crew: " + u.crew.title : "login only (not crew yet)"}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
