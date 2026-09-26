"use server";
import { supabaseConfigured, supabaseServer } from "@/lib/supabase";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { audit, requireAdmin, hashToken, rateLimit } from "@/lib/auth";
import { contactSchema } from "@/lib/contact";
import { contentSchema } from "@/lib/schema";
import { deliverEnquiry } from "@/lib/email";
export type Result = { error?: string; success?: string };
export async function login(_: Result, form: FormData): Promise<Result> {
  if (!supabaseConfigured())
    return {
      error: "Studio login will be available once Supabase is connected.",
    };
  const email = String(form.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(form.get("password") || "");
  if (email.length > 254 || password.length > 256)
    return { error: "Invalid credentials." };
  if (
    !(await rateLimit(`login:${hashToken(email)}`, 8, 900)) ||
    !(await rateLimit("login-global", 100, 900))
  )
    return { error: "Please wait before trying again." };
  const client = await supabaseServer();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user) return { error: "Invalid email or password." };
  const [admin] = await query("SELECT id FROM admins WHERE id=$1", [
    data.user.id,
  ]);
  if (!admin) {
    await client.auth.signOut();
    return { error: "This account does not have studio access." };
  }
  redirect("/admin");
}
export async function logout() {
  if (supabaseConfigured()) await (await supabaseServer()).auth.signOut();
  redirect("/admin/login");
}
export async function saveContact(_: Result, form: FormData): Promise<Result> {
  const admin = await requireAdmin(true);
  const parsed = contactSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  await query(
    "INSERT INTO settings(key,value) VALUES($1,$2) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=now()",
    ["contact", JSON.stringify(parsed.data)],
  );
  await audit(admin.email, "updated contact settings", "contact");
  revalidatePath("/", "layout");
  return {
    success:
      "Contact details updated across the website and for new enquiry notifications.",
  };
}
export async function saveContent(_: Result, form: FormData): Promise<Result> {
  const admin = await requireAdmin();
  const data = Object.fromEntries(
    [
      "description",
      "category",
      "image",
      "imageAlt",
      "video",
      "captions",
      "url",
      "client",
      "brief",
      "challenge",
      "approach",
      "deliverables",
      "outcome",
      "date",
      "relatedSlug",
      "seoTitle",
      "seoDescription",
    ].map((k) => [k, String(form.get(k) || "")]),
  );
  const parsed = contentSchema.safeParse({
    id: form.get("id") || undefined,
    kind: form.get("kind"),
    slug: form.get("slug"),
    title: form.get("title"),
    status: form.get("status"),
    data: {
      ...data,
      highlights: String(form.get("highlights") || "").split("\n").map(s => s.trim()).filter(Boolean),
      sortOrder: Number(form.get("sortOrder") || 100),
      portraitPosition: form.get("portraitPosition") || "top",
      featured: form.get("featured") === "on",
      gallery: String(form.get("gallery") || "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    },
  });
  if (!parsed.success)
    return {
      error: parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join(", "),
    };
  const {
    id = randomUUID(),
    kind,
    slug,
    title,
    status,
    data: payload,
  } = parsed.data;
  try {
    await query(
      "INSERT INTO content(id,kind,slug,title,status,data) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(id) DO UPDATE SET slug=EXCLUDED.slug,title=EXCLUDED.title,status=EXCLUDED.status,data=EXCLUDED.data,updated_at=now()",
      [id, kind, slug, title, status, JSON.stringify(payload)],
    );
  } catch {
    return {
      error:
        "Could not save. Check that this URL slug is unique for the content type.",
    };
  }
  await audit(admin.email, `saved ${kind}`, id);
  revalidatePath("/", "layout");
  return { success: "Content saved." };
}
export async function updateEnquiry(form: FormData) {
  const admin = await requireAdmin();
  const id = String(form.get("id"));
  const status = String(form.get("status"));
  if (!["new", "contacted", "in-progress", "closed"].includes(status))
    throw new Error("Invalid status");
  await query("UPDATE enquiries SET status=$1,updated_at=now() WHERE id=$2", [
    status,
    id,
  ]);
  await audit(admin.email, "updated enquiry status", id);
  revalidatePath("/admin");
}
export async function retryEmail(_: Result, form: FormData): Promise<Result> {
  const admin = await requireAdmin(true);
  const id = String(form.get("id"));
  try {
    const sent = await deliverEnquiry(id);
    if (!sent)
      return {
        error: "Configure RESEND_API_KEY and EMAIL_FROM on the server first.",
      };
    await audit(admin.email, "retried enquiry email", id);
    revalidatePath("/admin");
    return { success: "Pending emails sent." };
  } catch {
    return {
      error:
        "Delivery failed. Check the email service configuration and sender domain.",
    };
  }
}
export async function changePassword(
  _: Result,
  form: FormData,
): Promise<Result> {
  const admin = await requireAdmin();
  const current = String(form.get("current"));
  const password = String(form.get("password"));
  if (current.length > 256 || password.length < 14 || password.length > 128)
    return { error: "Use a password between 14 and 128 characters." };
  const client = await supabaseServer();
  const result = await client.auth.signInWithPassword({
    email: admin.email,
    password: current,
  });
  if (result.error) return { error: "Current password is incorrect." };
  const updated = await client.auth.updateUser({ password });
  if (updated.error) return { error: "Could not update your password." };
  await client.auth.signOut({ scope: "global" });
  redirect("/admin/login");
}
