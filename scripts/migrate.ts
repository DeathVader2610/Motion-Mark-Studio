import { config } from "dotenv";
config({ path: [".env.local", ".env"], quiet: true });
import { readFile, readdir } from "node:fs/promises";
import { database, seed } from "../lib/db";
async function main() {
  const db = await database();
  await db.query(await readFile("migrations/001_initial.sql", "utf8"));
  for (const file of (await readdir("supabase/migrations"))
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await db.query(await readFile(`supabase/migrations/${file}`, "utf8"));
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
