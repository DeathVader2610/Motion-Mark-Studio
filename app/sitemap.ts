import { siteOrigin } from "@/lib/site-url";
import type { MetadataRoute } from "next";
export const dynamic = "force-dynamic";
import { getContent } from "@/lib/data";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin();
  const projects = await getContent("project");
  return [
    ...[
      "",
      "/services",
      "/work",
      "/collaborations",
      "/about",
      "/founders",
      "/instagram",
      "/videos",
      "/contact",
      "/privacy",
      "/terms",
    ].map((path) => ({ url: `${origin}${path}` })),
    ...projects.map((p) => ({
      url: `${origin}/work/${p.slug}`,
      lastModified: new Date(p.updated_at),
    })),
  ];
}
