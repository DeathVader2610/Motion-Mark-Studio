import type { PoolConfig } from "pg";
export function databaseConfig(
  env: Record<string, string | undefined>,
): PoolConfig {
  if (!env.DATABASE_URL)
    throw new Error("Supabase database is not configured.");
  const url = new URL(env.DATABASE_URL);
  const ca = env.DATABASE_SSL_CA?.replace(/\\n/g, "\n");
  // A supplied CA takes precedence over connection-string SSL options.
  if (ca) {
    for (const key of ["sslmode", "sslrootcert", "sslcert", "sslkey"])
      url.searchParams.delete(key);
  } else if (env.VERCEL) {
    url.searchParams.set("sslmode", "verify-full");
  }
  return {
    connectionString: url.href,
    ...(ca ? { ssl: { ca, rejectUnauthorized: true } } : {}),
    max: 1,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 20000,
  };
}
