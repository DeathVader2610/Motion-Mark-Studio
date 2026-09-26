import { defaultFounders } from "./founders";
import { randomUUID } from "node:crypto";
import { databaseConfig } from "./db-config";
import { Pool } from "pg";
import { officialContact } from "./contact";
import { services, slugify } from "./seed";
type Db = { query<T>(sql: string, values?: unknown[]): Promise<{ rows: T[] }> };
const globals = globalThis as typeof globalThis & { motionPool?: Pool };
export function database(): Db {
  if (!process.env.DATABASE_URL)
    throw new Error("Supabase database is not configured.");
  const pool = (globals.motionPool ??= new Pool(databaseConfig(process.env)));
  return {
    query: async <T>(sql: string, values?: unknown[]) => ({
      rows: (await pool.query(sql, values)).rows as T[],
    }),
  };
}
export async function query<T = Record<string, unknown>>(
  sql: string,
  values?: unknown[],
): Promise<T[]> {
  return (await database().query<T>(sql, values)).rows;
}
export async function seed(db: Db) {
  await db.query(
    "INSERT INTO settings(key,value) VALUES($1,$2) ON CONFLICT DO NOTHING",
    ["contact", JSON.stringify(officialContact)],
  );
  for (const [title, description, brief, deliverables] of services)
    await db.query(
      "INSERT INTO content(id,kind,slug,title,status,data) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING",
      [
        randomUUID(),
        "service",
        slugify(title),
        title,
        "published",
        JSON.stringify({
          description,
          brief,
          deliverables,
          category: "Services",
        }),
      ],
    );
  for (const founder of defaultFounders)
    await db.query(
      "INSERT INTO content(id,kind,slug,title,status,data) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING",
      [
        founder.id,
        founder.kind,
        founder.slug,
        founder.title,
        founder.status,
        JSON.stringify(founder.data),
      ],
    );
}

/** Keep related access-control changes on one connection and commit atomically. */
export async function transaction<T>(
  work: (client: import("pg").PoolClient) => Promise<T>,
): Promise<T> {
  database();
  const client = await globals.motionPool!.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
