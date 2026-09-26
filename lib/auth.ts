import { createHash, randomUUID } from "node:crypto";
import { supabaseConfigured, supabaseServer } from "./supabase";
import { isFounder, can, type Permission, type Member } from "./workspace";
import { query } from "./db";
export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export async function getAdmin() {
  if (!supabaseConfigured()) return null;
  const client = await supabaseServer();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) return null;
  const [admin] = await query<Member>(
    `SELECT a.*,COALESCE(r.name,'Unassigned') AS role_name,COALESCE(r.department_id,'') AS department_id,COALESCE(r.permissions,'{}') AS permissions FROM admins a LEFT JOIN team_roles r ON r.id=a.role_id WHERE a.id=$1 AND a.active=true`,
    [user.id],
  );
  return admin || null;
}
export async function requireAdmin(owner = false) {
  const admin = await getAdmin();
  if (!admin || (owner && !isFounder(admin))) throw new Error("Unauthorised");
  return admin;
}
export async function audit(actor: string, action: string, target: string) {
  await query(
    "INSERT INTO audit_log(id,actor,action,target) VALUES ($1,$2,$3,$4)",
    [randomUUID(), actor, action, target],
  );
}
export async function rateLimit(key: string, limit: number, seconds: number) {
  const [row] = await query<{ count: number }>(
    `INSERT INTO rate_limits(key,count,expires_at) VALUES ($1,1,now()+($2*interval '1 second')) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN rate_limits.expires_at<now() THEN 1 ELSE rate_limits.count+1 END, expires_at=CASE WHEN rate_limits.expires_at<now() THEN now()+($2*interval '1 second') ELSE rate_limits.expires_at END RETURNING count`,
    [key, seconds],
  );
  return row.count <= limit;
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return (
    origin === new URL(request.url).origin ||
    (!!process.env.SITE_URL && origin === new URL(process.env.SITE_URL).origin)
  );
}

export async function requirePermission(permission: Permission) {
  const admin = await requireAdmin();
  if (!can(admin, permission)) throw new Error("Unauthorised");
  return admin;
}
