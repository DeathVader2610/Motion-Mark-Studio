import { config } from "dotenv";
config({ path: [".env.local", ".env"], quiet: true });
import { readFile } from "node:fs/promises";
import { database, seed } from "../lib/db";
async function main() {
  const db = await database();
  await db.query(await readFile("migrations/001_initial.sql", "utf8"));
  await seed(db);
  console.log(
    "Database migrated. Official contact settings, services and founders seeded without overwriting existing content.",
  );
}
main()
  .then(() => process.exit(0))
  .catch(() => {
    console.error(
      "Migration failed. Check DATABASE_URL and database permissions.",
    );
    process.exit(1);
  });
