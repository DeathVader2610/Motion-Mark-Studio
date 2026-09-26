import { siteOrigin } from "@/lib/site-url";
import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    sitemap: `${siteOrigin()}/sitemap.xml`,
  };
}
