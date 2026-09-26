import { contentSchema, type Content } from "./schema";

export function instagramProfile(value: string | undefined): string {
  if (!value) return "";
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !["instagram.com", "www.instagram.com"].includes(url.hostname) || url.username || url.password || url.port) return "";
    const match = url.pathname.match(/^\/([a-zA-Z0-9._]{1,30})\/?$/);
    return match ? `https://www.instagram.com/${match[1]}/` : "";
  } catch { return ""; }
}

export const defaultFounders: Content[] = [
  {
    id: "08970351-5eca-48d9-a046-ed34731e7cf8",
    slug: "sameer-thripathi", title: "Sameer Thripathi",
    data: {
      category: "Co-Founder | Influencer, Videographer & Editor",
      highlights: ["10+ Years of Experience", "16K+ Instagram Followers"],
      description: "Sameer Thripathi is an influencer, videographer and editor with more than a decade of experience. With an Instagram community of over 16,000 followers, he brings both a creator’s perspective and production expertise to Motion Mark Studio—combining visual storytelling with an understanding of what connects with audiences.",
      image: "/founders/sameer-thripathi.jpg", imageAlt: "Sameer Thripathi in a tan waistcoat and sunglasses outdoors",
      url: "https://www.instagram.com/iamsameer07_/", sortOrder: 1,
    },
  },
  {
    id: "8c65ef4e-74bf-471e-af19-f22710d66e8c",
    slug: "shrey-ranjan", title: "Shrey Ranjan",
    data: {
      category: "Co-Founder | Videographer, Editor & Social Media Manager",
      highlights: ["5+ Years of Experience"],
      description: "Shrey Ranjan is a videographer, editor and social media manager with more than five years of experience in videography and editing. At Motion Mark Studio, he combines content creation with social media management to help businesses and creators build a consistent, professional digital presence.",
      image: "/founders/shrey-ranjan.jpg", imageAlt: "Shrey Ranjan smiling in a dark suit and tie",
      url: "https://www.instagram.com/shrxyy_/", sortOrder: 2,
    },
  },
].map(founder => ({ ...contentSchema.parse({ ...founder, kind: "founder", status: "published" }), id: founder.id, updated_at: "2026-09-23T00:00:00Z" }));

export function publishedFounders(items: Content[]) {
  return items.filter(item => item.kind === "founder" && item.status === "published").sort((a, b) => (a.data.sortOrder ?? 100) - (b.data.sortOrder ?? 100) || a.title.localeCompare(b.title));
}
