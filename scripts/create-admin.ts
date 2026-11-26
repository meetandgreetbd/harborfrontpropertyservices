/**
 * Create (or reset the password of) an admin user.
 *
 *   npm run admin:create                      (reads ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD from .env)
 *   npm run admin:create -- you@example.com "Your Name" "a-strong-password"
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "../lib/db";

async function main() {
  const args = process.argv.slice(2);
  const email = args[0] || process.env.ADMIN_EMAIL;
  const name = args[1] || process.env.ADMIN_NAME;
  const password = args[2] || process.env.ADMIN_PASSWORD;
  if (!email || !name || !password) {
    console.error('Set ADMIN_EMAIL, ADMIN_NAME and ADMIN_PASSWORD in .env, or run: npm run admin:create -- <email> "<name>" "<password>"');
    process.exit(1);
  }
  if (password.length < 10) {
    console.error("Password must be at least 10 characters.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.user.upsert({
    where: { email: email.toLowerCase() },
    update: { name, passwordHash, role: "admin", isActive: true },
    create: { email: email.toLowerCase(), name, passwordHash },
  });
  console.log(`Admin ready: ${user.email} — log in at /admin/login`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
