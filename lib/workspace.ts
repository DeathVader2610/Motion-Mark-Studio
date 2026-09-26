import { z } from "zod";
export const departments = [
  {
    id: "videography",
    name: "Videography",
    description: "Plan the shoot. Capture the story.",
    icon: "video",
  },
  {
    id: "photography",
    name: "Photography",
    description: "Every detail, in its best light.",
    icon: "camera",
  },
  {
    id: "editing",
    name: "Editing",
    description: "Shape the footage. Find the feeling.",
    icon: "scissors",
  },
  {
    id: "social-media",
    name: "Social Media",
    description: "Build the calendar. Start conversations.",
    icon: "send",
  },
  {
    id: "founder-office",
    name: "Founder Office",
    description: "The whole studio, in perspective.",
    icon: "aperture",
  },
] as const;
export const permissions = {
  "content.edit": "Edit and publish website content",
  "media.upload": "Upload public portfolio images",
  "enquiries.read": "Read enquiries and download briefs",
  "enquiries.manage": "Update enquiry status (also requires read)",
  "tasks.manage": "Create and assign department tasks",
  "drive.view": "Open department Drive folders",
} as const;
export type Permission = keyof typeof permissions;
export type Member = {
  id: string;
  email: string;
  role: "owner" | "editor";
  display_name: string;
  active: boolean;
  role_id: string | null;
  role_name: string;
  department_id: string;
  permissions: string[];
};
export type TeamRole = {
  id: string;
  name: string;
  department_id: string;
  permissions: string[];
};
export const isFounder = (m: Member) =>
  m.active && (m.role === "owner" || m.department_id === "founder-office");
export const can = (m: Member, permission: Permission) =>
  m.active && (isFounder(m) || m.permissions.includes(permission));
export const canAccessDepartment = (m: Member, department: string) =>
  m.active && (isFounder(m) || m.department_id === department);
export const departmentName = (id: string) =>
  departments.find((d) => d.id === id)?.name || "Studio";
export const roleSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().trim().min(2).max(70),
    department_id: z.enum([
      "videography",
      "photography",
      "editing",
      "social-media",
      "founder-office",
    ]),
    permissions: z
      .array(z.enum(Object.keys(permissions) as [Permission, ...Permission[]]))
      .max(6),
  })
  .refine(
    (r) =>
      !r.permissions.includes("enquiries.manage") ||
      r.permissions.includes("enquiries.read"),
    { message: "Managing enquiries also requires read access." },
  );
export const joinSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((s) => s.toLowerCase()),
  department: z.enum([
    "videography",
    "photography",
    "editing",
    "social-media",
    "founder-office",
  ]),
  portfolio: z.union([
    z.literal(""),
    z
      .string()
      .url()
      .max(500)
      .refine((s) => s.startsWith("https://")),
  ]),
  message: z.string().trim().min(10).max(2000),
});
export const taskSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(3000),
  department: z.enum([
    "videography",
    "photography",
    "editing",
    "social-media",
    "founder-office",
  ]),
  assignee: z.union([z.literal(""), z.string().uuid()]),
  due: z.union([z.literal(""), z.string().date()]),
  priority: z.enum(["normal", "high", "urgent"]),
});
export const taskStatuses = ["todo", "in-progress", "review", "done"] as const;
export function driveFolder(value: string) {
  if (!value) return "";
  try {
    const u = new URL(value);
    if (
      u.protocol !== "https:" ||
      u.hostname !== "drive.google.com" ||
      u.username ||
      u.password ||
      u.port
    )
      return null;
    const m = u.pathname.match(
      /^\/drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)\/?$/,
    );
    return m ? `https://drive.google.com/drive/folders/${m[1]}` : null;
  } catch {
    return null;
  }
}
