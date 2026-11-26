import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

/**
 * Single Prisma client per server process (reused across hot reloads in dev).
 * MySQL via the MariaDB driver adapter (works with MySQL 5.7+/8 and MariaDB).
 * DATABASE_URL format: mysql://USER:PASSWORD@HOST:3306/DATABASE
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is not set (see .env.example)");
  const url = new URL(raw);
  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    connectionLimit: 5,
    // MySQL 8 default auth (caching_sha2_password) over a non-TLS local connection
    allowPublicKeyRetrieval: true,
  });
  return new PrismaClient({ adapter });
}

// After `prisma generate` the dev server hot-reloads a new PrismaClient class; a client cached
// from the old class wouldn't know new models, so replace it instead of reusing it.
const cached = globalForPrisma.prisma;
if (cached && !(cached instanceof PrismaClient)) void (cached as { $disconnect(): Promise<void> }).$disconnect().catch(() => {});

export const db = cached instanceof PrismaClient ? cached : createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
