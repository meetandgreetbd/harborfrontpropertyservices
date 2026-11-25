/**
 * Create (or reset the password of) an admin user.
 *
 *   npm run admin:create -- you@example.com "Your Name" "a-strong-password"
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "../lib/db";

async function main() {
  const [email, name, password] = process.argv.slice(2);
  if (!email || !name || !password) {
    console.error('Usage: npm run admin:create -- <email> "<name>" "<password>"');
    process.exit(1);
  }
  if (password.length < 10) {
    console.error("Password must be at least 10 characters.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.user.upsert({
    where: { email: email.toLowerCase() },
    update: { name, passwordHash },
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
