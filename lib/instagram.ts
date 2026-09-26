import "server-only";
import { unstable_cache } from "next/cache";
import { getContent } from "./data";
import { query } from "./db";
import type { Content } from "./schema";
type InstagramMedia = {
  id: string;
  caption?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  media_type: string;
};
const fetchMedia = unstable_cache(
  async () => {
    const token = process.env.INSTAGRAM_ACCESS_TOKEN;
    const id = process.env.INSTAGRAM_USER_ID;
    if (!token || !id)
      return { posts: [] as InstagramMedia[], status: "manual" as const };
    try {
      const version = process.env.INSTAGRAM_API_VERSION || "v23.0";
      if (!/^v\d+\.\d+$/.test(version) || !/^\d+$/.test(id))
        throw new Error("Invalid configuration");
      const result = await fetch(
        `https://graph.instagram.com/${version}/${id}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=24`,
        {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(10000),
        },
      );
      if (!result.ok) throw new Error("Instagram unavailable");
      const body = await result.json();
      if (!Array.isArray(body.data)) throw new Error("Instagram unavailable");
      return {
        posts: body.data as InstagramMedia[],
        status: "connected" as const,
      };
    } catch {
      return { posts: [] as InstagramMedia[], status: "unavailable" as const };
    }
  },
  ["instagram-media"],
  { revalidate: 900 },
);
export async function getInstagram() {
  const [manual, remote, approval] = await Promise.all([
    getContent("instagram"),
    fetchMedia(),
    process.env.DATABASE_URL
      ? query<{ value: string[] }>("SELECT value FROM settings WHERE key=$1", [
          "instagram-approved",
        ])
      : Promise.resolve([]),
  ]);
  const allowed = new Set(approval[0]?.value || []);
  const automatic = remote.posts
    .filter((p) => allowed.has(p.id))
    .map(
      (p) =>
        ({
          id: p.id,
          kind: "instagram",
          slug: p.id,
          title: p.caption?.slice(0, 80) || "From the studio",
          status: "published",
          updated_at: p.timestamp,
          data: {
            description: p.caption || "",
            image: p.thumbnail_url || p.media_url || "",
            url: p.permalink,
            date: p.timestamp,
            category: p.media_type,
          },
        }) as Content,
    );
  const urls = new Set(manual.map((p) => p.data.url));
  return {
    items: [...manual, ...automatic.filter((p) => !urls.has(p.data.url))],
    status: remote.status,
  };
}
export async function getInstagramCandidates() {
  return fetchMedia();
}
