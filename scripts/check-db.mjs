// Pre-build diagnostic: tries the database connection and prints why it fails.
// Never prints the password. Never fails the build by itself.
import mariadb from "mariadb";

const raw = process.env.DATABASE_URL;
if (!raw) {
  console.log("[check-db] DATABASE_URL is not set");
  process.exit(0);
}
let url;
try {
  url = new URL(raw);
} catch {
  console.log("[check-db] DATABASE_URL is not a valid URL (check for unencoded special characters or stray quotes/spaces)");
  process.exit(0);
}
const user = decodeURIComponent(url.username);
const password = decodeURIComponent(url.password);
const database = url.pathname.replace(/^\//, "");
console.log(`[check-db] protocol=${url.protocol} host=${url.hostname} port=${url.port || 3306} user=${user} database=${database} passwordLength=${password.length}`);

for (const host of [...new Set([url.hostname, "127.0.0.1", "localhost"])]) {
  try {
    const conn = await mariadb.createConnection({ host, port: Number(url.port || 3306), user, password, database, connectTimeout: 8000, allowPublicKeyRetrieval: true });
    const rows = await conn.query("SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = ?", [database]);
    console.log(`[check-db] ${host}: connected OK, tables=${Number(rows[0].n)}`);
    await conn.end();
  } catch (e) {
    console.log(`[check-db] ${host}: FAILED code=${e.code} errno=${e.errno} sqlState=${e.sqlState} message=${String(e.message).split("\n")[0].slice(0, 300)}`);
  }
}
process.exit(0);
