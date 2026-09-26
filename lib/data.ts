import "server-only";
import { cache } from "react";
import { query } from "./db";
import { contactSchema, officialContact } from "./contact";
import { contentSchema, type Content } from "./schema";
import { defaultFounders, publishedFounders } from "./founders";
import { services, slugify } from "./seed";
export const getContact = cache(async () => {
  if (!process.env.DATABASE_URL) return officialContact;
  const [row] = await query<{ value: unknown }>(
    "SELECT value FROM settings WHERE key=$1",
    ["contact"],
  );
  return row ? contactSchema.parse(row.value) : officialContact;
});
export const getContent = cache(async (kind: string) => {
  if (!process.env.DATABASE_URL)
    return kind === "service"
      ? services.map(([title, description, brief, deliverables], i) => ({
          ...contentSchema.parse({
            kind: "service",
            slug: slugify(title),
            title,
            status: "published",
            data: { description, brief, deliverables },
          }),
          id: `preview-service-${i}`,
          updated_at: "2026-09-21T00:00:00Z",
        }))
      : kind === "founder" ? defaultFounders : [];
  return query<Content>(
    "SELECT * FROM content WHERE kind=$1 AND status=$2 ORDER BY created_at",
    [kind, "published"],
  );
});
export async function getBySlug(kind: string, slug: string) {
  return (await getContent(kind)).find((c) => c.slug === slug);
}
export async function getPageSeo(
  slug: string,
  title: string,
  description: string,
) {
  const page = await getBySlug("page", slug);
  return {
    title: page?.data.seoTitle || title,
    description: page?.data.seoDescription || description,
    alternates: { canonical: slug === "home" ? "/" : `/${slug}` },
  };
}

export const getFounders = cache(async () => publishedFounders(await getContent("founder")));
