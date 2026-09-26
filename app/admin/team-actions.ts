"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  requireAdmin,
  requirePermission,
  audit,
  hashToken,
  rateLimit,
} from "@/lib/auth";
import { query, transaction } from "@/lib/db";
import {
  canAccessDepartment,
  isFounder,
  can,
  roleSchema,
  joinSchema,
  taskSchema,
  taskStatuses,
  driveFolder,
  departments,
  type TeamRole,
} from "@/lib/workspace";
import {
  supabaseStorage,
  supabaseServer,
  supabaseConfigured,
} from "@/lib/supabase";
import { siteOrigin } from "@/lib/site-url";
export type TeamResult = {
  error?: string;
  success?: string;
  invitation?: string;
};
const id = (value: FormDataEntryValue | null) => z.string().uuid().parse(value);
const finish = () => revalidatePath("/admin", "layout");
export async function requestToJoin(
  _: TeamResult,
  form: FormData,
): Promise<TeamResult> {
  if (!process.env.DATABASE_URL)
    return {
      error:
        "Team applications are not connected yet. Please email the studio.",
    };
  if (form.get("website")) return { error: "Unable to submit this request." };
  const parsed = joinSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return { error: parsed.error.issues.map((i) => i.message).join(" ") };
  const h = await headers();
  const ip = process.env.VERCEL
    ? h.get("x-vercel-forwarded-for") || "unknown"
    : "local";
  if (
    !(await rateLimit(`join-ip:${hashToken(ip)}`, 5, 3600)) ||
    !(await rateLimit(`join-email:${hashToken(parsed.data.email)}`, 3, 86400))
  )
    return { error: "Please wait before submitting another request." };
  const d = parsed.data;
  await query(
    "INSERT INTO join_requests(name,email,department_id,portfolio,message) VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING",
    [d.name, d.email, d.department, d.portfolio, d.message],
  );
  finish();
  return {
    success:
      "Your request is with Founder Office. If approved, the studio will contact you with an invitation. Submitting a request does not grant access.",
  };
}
export async function saveRole(
  _: TeamResult,
  form: FormData,
): Promise<TeamResult> {
  const actor = await requireAdmin(true);
  const parsed = roleSchema.safeParse({
    id: form.get("id") || undefined,
    name: form.get("name"),
    department_id: form.get("department"),
    permissions: form.getAll("permissions"),
  });
  if (!parsed.success)
    return { error: parsed.error.issues.map((i) => i.message).join(" ") };
  const r = parsed.data;
  try {
    if (r.id) {
      const rows = await query(
        "UPDATE team_roles SET name=$2,permissions=$3 WHERE id=$1 AND department_id=$4 RETURNING id",
        [r.id, r.name, r.permissions, r.department_id],
      );
      if (!rows.length)
        return {
          error:
            "Role not found. A role’s department cannot be changed; create another role instead.",
        };
    } else
      await query(
        "INSERT INTO team_roles(name,department_id,permissions) VALUES($1,$2,$3)",
        [r.name, r.department_id, r.permissions],
      );
  } catch {
    return {
      error: "Could not save. Use a unique role name within the department.",
    };
  }
  await audit(actor.email, "updated team role", r.id || r.name);
  finish();
  return {
    success: "Role saved. Permission changes apply on the next request.",
  };
}
export async function deleteRole(
  _: TeamResult,
  form: FormData,
): Promise<TeamResult> {
  const actor = await requireAdmin(true);
  const roleId = id(form.get("id"));
  try {
    const rows = await query(
      "DELETE FROM team_roles WHERE id=$1 AND department_id <> 'founder-office' AND NOT EXISTS(SELECT 1 FROM admins WHERE role_id=$1) RETURNING id",
      [roleId],
    );
    if (!rows.length)
      return {
        error:
          "Reassign all members first. Founder Office roles are protected.",
      };
  } catch {
    return { error: "This role is in use." };
  }
  await audit(actor.email, "deleted unassigned role", roleId);
  finish();
  return { success: "Role removed." };
}
export async function updateMember(
  _: TeamResult,
  form: FormData,
): Promise<TeamResult> {
  const actor = await requireAdmin(true);
  const memberId = id(form.get("id"));
  const roleId = id(form.get("role_id"));
  const active = form.get("active") === "on";
  const name = z.string().trim().min(2).max(100).safeParse(form.get("name"));
  if (!name.success)
    return { error: "Enter a name between 2 and 100 characters." };
  if (memberId === actor.id)
    return {
      error:
        "Your own membership is protected. Ask another founder to change it.",
    };
  const rows = await query(
    "UPDATE admins SET role_id=$2,display_name=$3,active=$4 WHERE id=$1 AND role <> 'owner' RETURNING id",
    [memberId, roleId, name.data, active],
  );
  if (!rows.length)
    return {
      error:
        "The original owner is protected, or this employee no longer exists.",
    };
  await audit(
    actor.email,
    active ? "updated employee" : "suspended employee",
    memberId,
  );
  finish();
  return {
    success:
      "Employee updated. Suspended accounts lose dashboard access immediately.",
  };
}
export async function reviewRequest(
  _: TeamResult,
  form: FormData,
): Promise<TeamResult> {
  const actor = await requireAdmin(true);
  const requestId = id(form.get("id"));
  const decision = form.get("decision");
  const note = String(form.get("note") || "").slice(0, 1000);
  if (decision === "reject") {
    await query(
      "UPDATE join_requests SET status='rejected',decision_note=$2,reviewed_by=$3,reviewed_at=now() WHERE id=$1 AND status='pending'",
      [requestId, note, actor.id],
    );
    await audit(actor.email, "declined join request", requestId);
    finish();
    return { success: "Request declined." };
  }
  if (decision !== "approve") return { error: "Choose an approval decision." };
  const roleId = id(form.get("role_id"));
  try {
    const link = await transaction(async (db) => {
      const {
        rows: [r],
      } = await db.query(
        "SELECT * FROM join_requests WHERE id=$1 AND status='pending' FOR UPDATE",
        [requestId],
      );
      if (!r) throw new Error("Request already reviewed.");
      const {
        rows: [role],
      } = await db.query<TeamRole>("SELECT * FROM team_roles WHERE id=$1", [
        roleId,
      ]);
      if (!role) throw new Error("Select an existing role.");
      const { rows: members } = await db.query(
        "SELECT id FROM admins WHERE lower(email)=lower($1)",
        [r.email],
      );
      if (members.length)
        throw new Error(
          "This email already belongs to an employee. Use Employees to change their access.",
        );
      const { rows: users } = await db.query(
        "SELECT id FROM auth.users WHERE lower(email)=lower($1)",
        [r.email],
      );
      const client = supabaseStorage();
      const generated = await client.auth.admin.generateLink({
        type: users.length ? "magiclink" : "invite",
        email: r.email,
        options: { redirectTo: `${siteOrigin()}/admin/setup` },
      });
      if (generated.error || !generated.data.user)
        throw new Error(
          "Could not generate the invitation. Check Supabase configuration.",
        );
      await db.query(
        "INSERT INTO admins(id,email,role,display_name,role_id) VALUES($1,$2,'editor',$3,$4)",
        [generated.data.user.id, r.email, r.name, roleId],
      );
      await db.query(
        "UPDATE join_requests SET status='approved',decision_note=$2,reviewed_by=$3,reviewed_at=now() WHERE id=$1",
        [requestId, note, actor.id],
      );
      await db.query(
        "INSERT INTO audit_log(id,actor,action,target) VALUES($1,$2,$3,$4)",
        [randomUUID(), actor.email, "approved join request", requestId],
      );
      return `${siteOrigin()}/auth/confirm?token_hash=${encodeURIComponent(generated.data.properties.hashed_token)}&type=${users.length ? "magiclink" : "invite"}`;
    });
    finish();
    return {
      success:
        "Approved. Share this one-time invitation privately with the verified applicant. No email has been sent automatically.",
      invitation: link,
    };
  } catch (e) {
    return {
      error:
        e instanceof Error && !("code" in e)
          ? e.message
          : "Could not approve this request. Refresh and try again.",
    };
  }
}
export async function saveTask(
  _: TeamResult,
  form: FormData,
): Promise<TeamResult> {
  const actor = await requirePermission("tasks.manage");
  const parsed = taskSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return { error: parsed.error.issues.map((i) => i.message).join(" ") };
  const t = parsed.data;
  if (!canAccessDepartment(actor, t.department))
    return { error: "You cannot create tasks in this department." };
  if (t.assignee) {
    const rows = await query(
      "SELECT a.id FROM admins a JOIN team_roles r ON r.id=a.role_id WHERE a.id=$1 AND a.active AND r.department_id=$2",
      [t.assignee, t.department],
    );
    if (!rows.length)
      return { error: "Choose an active employee in this department." };
  }
  await query(
    "INSERT INTO team_tasks(title,description,department_id,assignee_id,created_by,due_date,priority) VALUES($1,$2,$3,$4,$5,$6,$7)",
    [
      t.title,
      t.description,
      t.department,
      t.assignee || null,
      actor.id,
      t.due || null,
      t.priority,
    ],
  );
  await audit(actor.email, "created department task", t.title);
  finish();
  return { success: "Task created." };
}
export async function updateTask(
  _: TeamResult,
  form: FormData,
): Promise<TeamResult> {
  const actor = await requireAdmin();
  const taskId = id(form.get("id"));
  const status = z.enum(taskStatuses).parse(form.get("status"));
  const [task] = await query<{ department_id: string; assignee_id: string }>(
    "SELECT department_id,assignee_id FROM team_tasks WHERE id=$1",
    [taskId],
  );
  if (
    !task ||
    !canAccessDepartment(actor, task.department_id) ||
    (!isFounder(actor) &&
      !can(actor, "tasks.manage") &&
      task.assignee_id !== actor.id)
  )
    return {
      error:
        "You can update only tasks assigned to you, unless your role manages tasks.",
    };
  await query("UPDATE team_tasks SET status=$2,updated_at=now() WHERE id=$1", [
    taskId,
    status,
  ]);
  await audit(actor.email, "changed task status", taskId);
  finish();
  return { success: "Task updated." };
}
export async function saveDrive(
  _: TeamResult,
  form: FormData,
): Promise<TeamResult> {
  const actor = await requireAdmin(true);
  const department = String(form.get("department"));
  if (!departments.some((d) => d.id === department))
    return { error: "Choose a department." };
  const url = driveFolder(String(form.get("url") || ""));
  if (url === null) return { error: "Use a Google Drive folder sharing URL." };
  await query(
    "UPDATE departments SET drive_url=$2,updated_at=now() WHERE id=$1",
    [department, url],
  );
  await audit(actor.email, "updated department Drive folder", department);
  finish();
  return {
    success:
      "Folder link saved. Google Drive sharing permissions must also be set in Google.",
  };
}
export async function postAnnouncement(
  _: TeamResult,
  form: FormData,
): Promise<TeamResult> {
  const actor = await requireAdmin(true);
  const title = String(form.get("title") || "").trim(),
    body = String(form.get("body") || "").trim(),
    dept = String(form.get("department") || "");
  if (
    title.length < 3 ||
    title.length > 120 ||
    body.length < 3 ||
    body.length > 2000 ||
    (dept && !departments.some((d) => d.id === dept))
  )
    return { error: "Enter a title, message and valid audience." };
  await query(
    "INSERT INTO announcements(title,body,department_id,created_by) VALUES($1,$2,$3,$4)",
    [title, body, dept || null, actor.id],
  );
  await audit(actor.email, "posted announcement", title);
  finish();
  return { success: "Announcement published." };
}
export async function googleLogin() {
  if (!supabaseConfigured() || process.env.GOOGLE_LOGIN_ENABLED !== "true")
    redirect("/admin/login?error=google-unavailable");
  const client = await supabaseServer();
  const { data, error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${siteOrigin()}/auth/callback` },
  });
  if (error || !data.url) redirect("/admin/login?error=google-unavailable");
  redirect(data.url);
}
export async function setInitialPassword(
  _: TeamResult,
  form: FormData,
): Promise<TeamResult> {
  await requireAdmin();
  const password = String(form.get("password") || "");
  if (password.length < 14 || password.length > 128)
    return { error: "Use 14–128 characters." };
  const c = await supabaseServer();
  const { error } = await c.auth.updateUser({ password });
  if (error) return { error: "Could not set your password." };
  redirect("/admin");
}
export async function renewInvitation(
  _: TeamResult,
  form: FormData,
): Promise<TeamResult> {
  const actor = await requireAdmin(true);
  const memberId = id(form.get("id"));
  const [member] = await query<{ email: string }>(
    "SELECT email FROM admins WHERE id=$1 AND active=true AND role<>'owner'",
    [memberId],
  );
  if (!member || memberId === actor.id)
    return { error: "Choose another active employee." };
  const result = await supabaseStorage().auth.admin.generateLink({
    type: "magiclink",
    email: member.email,
    options: { redirectTo: `${siteOrigin()}/admin/setup` },
  });
  if (result.error) return { error: "Could not create a new invitation." };
  await audit(actor.email, "renewed employee invitation", memberId);
  return {
    success:
      "Share this one-time sign-in link privately with the verified employee. No email was sent.",
    invitation: `${siteOrigin()}/auth/confirm?token_hash=${encodeURIComponent(result.data.properties.hashed_token)}&type=magiclink`,
  };
}
