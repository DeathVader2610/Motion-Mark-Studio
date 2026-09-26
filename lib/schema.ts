import { z } from "zod";
export const kinds = [
  "project",
  "service",
  "client",
  "collaborator",
  "founder",
  "testimonial",
  "instagram",
  "video",
  "page",
  "stat",
] as const;
export const safeUrl = z.union([
  z.literal(""),
  z
    .string()
    .url()
    .refine((v) => { try { return new URL(v).protocol === "https:"; } catch { return false; } }, "Use an HTTPS URL"),
]);
export const contentSchema = z.object({
  id: z.string().uuid().optional(),
  kind: z.enum(kinds),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(100),
  title: z.string().trim().min(2).max(180),
  status: z.enum(["draft", "published", "archived"]),
  data: z.object({
    description: z.string().max(10000).default(""),
    category: z.string().max(120).default(""),
    image: z.union([safeUrl, z.string().regex(/^\/founders\/[a-z0-9-]+\.(jpg|jpeg|png|webp)$/)]).default(""),
    imageAlt: z.string().max(300).default(""),
    highlights: z.array(z.string().trim().min(1).max(120)).max(6).default([]),
    sortOrder: z.number().int().min(0).max(999).default(100),
    portraitPosition: z.enum(["top", "center", "bottom"]).default("top"),
    video: safeUrl.default(""),
    captions: safeUrl.default(""),
    url: safeUrl.default(""),
    featured: z.boolean().default(false),
    client: z.string().max(150).default(""),
    brief: z.string().max(5000).default(""),
    challenge: z.string().max(5000).default(""),
    approach: z.string().max(5000).default(""),
    deliverables: z.string().max(5000).default(""),
    outcome: z.string().max(5000).default(""),
    gallery: z.array(safeUrl).max(20).default([]),
    date: z.string().max(40).default(""),
    relatedSlug: z
      .string()
      .regex(/^[a-z0-9-]*$/)
      .max(100)
      .default(""),
    seoTitle: z.string().max(150).default(""),
    seoDescription: z.string().max(320).default(""),
  }),
});
export type ContentInput = z.infer<typeof contentSchema>;
export type Content = ContentInput & { id: string; updated_at: string };
export const enquirySchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  business: z.string().trim().max(150),
  email: z.string().trim().email().max(254),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d ()-]{7,25}$/),
  contactMethod: z.enum(["Email", "Phone", "WhatsApp"]),
  website: z.union([
    z.literal(""),
    z
      .string()
      .url()
      .max(500)
      .refine((v) => ["https:", "http:"].includes(new URL(v).protocol)),
  ]),
  service: z.string().trim().min(2).max(150),
  projectType: z.string().trim().min(2).max(100),
  budget: z.enum([
    "Let’s discuss",
    "Under ₹25,000",
    "₹25,000–₹50,000",
    "₹50,000–₹1 lakh",
    "₹1 lakh+",
  ]),
  deadline: z
    .string()
    .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), "Use a valid date"),
  location: z.string().trim().max(200),
  description: z.string().trim().min(20).max(5000),
  consent: z.literal(true),
});
export type EnquiryInput = z.infer<typeof enquirySchema>;
export function csvCell(value: unknown) {
  const s = String(value ?? "");
  return (
    '"' + (/^[\s]*[=+\-@]/.test(s) ? "'" : "") + s.replace(/"/g, '""') + '"'
  );
}
