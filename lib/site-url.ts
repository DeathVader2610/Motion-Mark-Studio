/** Resolve canonical URLs on Vercel without publishing localhost links. */
export function siteOrigin() {
  if (process.env.SITE_URL) return new URL(process.env.SITE_URL).origin;
  const host =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  return host ? new URL(`https://${host}`).origin : "http://localhost:3000";
}
