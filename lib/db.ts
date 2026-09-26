import { defaultFounders } from "./founders";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { officialContact } from "./contact";
import { services, slugify } from "./seed";
type Db = { query<T>(sql: string, values?: unknown[]): Promise<{ rows: T[] }> };
const globals = globalThis as typeof globalThis & { motionPool?: Pool };
export function database(): Db {
  if (!process.env.DATABASE_URL)
    throw new Error("Supabase database is not configured.");
  const pool = (globals.motionPool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 20000,
  }));
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
      [founder.id, founder.kind, founder.slug, founder.title, founder.status, JSON.stringify(founder.data)],
    );
}
