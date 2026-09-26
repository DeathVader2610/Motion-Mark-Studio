import Link from "next/link";
import { query } from "@/lib/db";
import {
  departments,
  permissions,
  departmentName,
  isFounder,
  can,
  taskStatuses,
  type Member,
  type TeamRole,
} from "@/lib/workspace";
import { TeamForm } from "./forms";
import {
  renewInvitation,
  saveRole,
  deleteRole,
  updateMember,
  reviewRequest,
  saveTask,
  updateTask,
  saveDrive,
  postAnnouncement,
} from "@/app/admin/team-actions";
export async function PeoplePanel({ actor }: { actor: Member }) {
  const [members, roles] = await Promise.all([
    query<Member>(
      "SELECT a.*,r.name role_name,r.department_id FROM admins a LEFT JOIN team_roles r ON r.id=a.role_id ORDER BY a.active DESC,a.created_at",
    ),
    query<TeamRole>("SELECT * FROM team_roles ORDER BY department_id,name"),
  ]);
  return (
    <>
      <div className="panel-heading">
        <div>
          <h2>The people behind the work.</h2>
          <p>
            Assign roles, update profiles and suspend access. Membership changes
            apply immediately.
          </p>
        </div>
        <Link className="button small" href="/admin?tab=requests">
          Review join requests ↗
        </Link>
      </div>
      <div className="people-grid">
        {members.map((m) => (
          <article className="dash-panel" key={m.id}>
            <div className="person-head">
              <span className="avatar">
                {(m.display_name || m.email).slice(0, 2).toUpperCase()}
              </span>
              <div>
                <h3>{m.display_name || m.email.split("@")[0]}</h3>
                <p>{m.email}</p>
              </div>
              <span className={`pill ${m.active ? "live" : ""}`}>
                {m.active ? "Active" : "Suspended"}
              </span>
            </div>
            <p>
              {departmentName(m.department_id)} · {m.role_name}
            </p>
            {m.id === actor.id || m.role === "owner" ? (
              <p className="muted">Protected owner / current account</p>
            ) : (
              <TeamForm action={updateMember}>
                <input type="hidden" name="id" value={m.id} />
                <label>
                  Display name
                  <input
                    name="name"
                    defaultValue={m.display_name || m.email.split("@")[0]}
                    required
                    maxLength={100}
                  />
                </label>
                <label>
                  Department & role
                  <select name="role_id" defaultValue={m.role_id || ""}>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {departmentName(r.department_id)} / {r.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked={m.active}
                  />{" "}
                  Active employee
                </label>
              </TeamForm>
            )}
            {m.active && m.id !== actor.id && m.role !== "owner" && (
              <TeamForm
                action={renewInvitation}
                label="Create new sign-in invitation"
              >
                <input type="hidden" name="id" value={m.id} />
              </TeamForm>
            )}
          </article>
        ))}
      </div>
    </>
  );
}
function RoleFields({ role }: { role?: TeamRole }) {
  return (
    <>
      {role && <input type="hidden" name="id" value={role.id} />}
      <label>
        Role name
        <input
          name="name"
          defaultValue={role?.name}
          required
          minLength={2}
          maxLength={70}
        />
      </label>
      <label>
        Department
        {role ? (
          <>
            <input type="hidden" name="department" value={role.department_id} />
            <input readOnly value={departmentName(role.department_id)} />
          </>
        ) : (
          <select name="department">
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        )}
      </label>
      <div className="permission-list">
        {Object.entries(permissions).map(([key, label]) => (
          <label className="checkbox-label" key={key}>
            <input
              name="permissions"
              type="checkbox"
              value={key}
              defaultChecked={role?.permissions.includes(key)}
            />
            {label}
          </label>
        ))}
      </div>
      <p className="form-help">
        Founder Office roles always have full access, including employee
        management and private analytics. These checkboxes apply to other
        departments.
      </p>
    </>
  );
}
export async function RolesPanel() {
  const roles = await query<TeamRole>(
    "SELECT * FROM team_roles ORDER BY department_id,name",
  );
  return (
    <>
      <div className="panel-heading">
        <div>
          <h2>Access, with intention.</h2>
          <p>
            Define responsibilities per department. Website permissions apply to
            the public website; tasks and Drive stay within the employee’s
            department.
          </p>
        </div>
      </div>
      <div className="roles-grid">
        <article className="dash-panel">
          <p className="eyebrow">BUILD YOUR TEAM</p>
          <h3>Create a role</h3>
          <TeamForm action={saveRole} label="Create role">
            <RoleFields />
          </TeamForm>
        </article>
        {roles.map((r) => (
          <details key={r.id} className="dash-panel">
            <summary>
              <span className="eyebrow">{departmentName(r.department_id)}</span>
              <h3>{r.name}</h3>
              <p>
                {r.department_id === "founder-office"
                  ? "Full studio access"
                  : `${r.permissions.length} permissions`}{" "}
                · Edit permissions ↗
              </p>
            </summary>
            <TeamForm action={saveRole}>
              <RoleFields role={r} />
            </TeamForm>
            {r.department_id !== "founder-office" && (
              <TeamForm
                action={deleteRole}
                label="Delete unassigned role"
                className="subtle-form"
              >
                <input type="hidden" name="id" value={r.id} />
              </TeamForm>
            )}
          </details>
        ))}
      </div>
    </>
  );
}
export async function RequestsPanel() {
  const [requests, roles] = await Promise.all([
    query<{
      id: string;
      name: string;
      email: string;
      department_id: string;
      portfolio: string;
      message: string;
      status: string;
      created_at: string;
    }>(
      "SELECT * FROM join_requests ORDER BY CASE WHEN status='pending' THEN 0 ELSE 1 END,created_at DESC LIMIT 100",
    ),
    query<TeamRole>("SELECT * FROM team_roles ORDER BY department_id,name"),
  ]);
  return (
    <>
      <div className="panel-heading">
        <div>
          <h2>New perspectives. New possibilities.</h2>
          <p>
            Requests appear here automatically. Confirm the applicant’s identity
            before sharing an invitation. No role is granted until approval.
          </p>
        </div>
        <Link href="/join" className="button small secondary">
          Open join form ↗
        </Link>
      </div>
      {!requests.length && (
        <Empty
          title="Room for the next great collaborator."
          text="Share the join page with your future team. New requests will appear here."
        />
      )}
      <div className="people-grid">
        {requests.map((r) => (
          <article className="dash-panel" key={r.id}>
            <span className={`pill ${r.status === "pending" ? "warm" : ""}`}>
              {r.status}
            </span>
            <h3>{r.name}</h3>
            <p>{r.email}</p>
            <p className="eyebrow">
              {departmentName(r.department_id)} ·{" "}
              {new Date(r.created_at).toLocaleDateString("en-IN")}
            </p>
            <p className="pre-line">{r.message}</p>
            {r.portfolio && (
              <a
                className="text-link"
                href={r.portfolio}
                target="_blank"
                rel="noopener noreferrer"
              >
                View portfolio ↗
              </a>
            )}
            {r.status !== "rejected" && (
              <TeamForm
                action={reviewRequest}
                buttons
                completed={r.status === "approved"}
              >
                <input type="hidden" name="id" value={r.id} />
                <label>
                  Assign department & role
                  <select
                    name="role_id"
                    defaultValue={
                      roles.find(
                        (role) => role.department_id === r.department_id,
                      )?.id
                    }
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {departmentName(role.department_id)} / {role.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Internal decision note
                  <textarea name="note" rows={2} maxLength={1000} />
                </label>
                <div className="button-row">
                  <button
                    className="button small"
                    name="decision"
                    value="approve"
                  >
                    Approve & create invite
                  </button>
                  <button
                    className="button small secondary"
                    name="decision"
                    value="reject"
                  >
                    Decline
                  </button>
                </div>
              </TeamForm>
            )}
          </article>
        ))}
      </div>
    </>
  );
}
export type Task = {
  id: string;
  title: string;
  description: string;
  department_id: string;
  assignee_id: string;
  assignee_name: string;
  status: string;
  priority: string;
  due_date: string | null;
};
export async function TasksPanel({
  actor,
  department,
}: {
  actor: Member;
  department: string;
}) {
  const scope = isFounder(actor) ? department : actor.department_id;
  const [tasks, members] = await Promise.all([
    query<Task>(
      "SELECT t.*,COALESCE(NULLIF(a.display_name,''),a.email,'Unassigned') assignee_name FROM team_tasks t LEFT JOIN admins a ON a.id=t.assignee_id WHERE ($1='' OR t.department_id=$1) ORDER BY t.created_at DESC LIMIT 150",
      [scope],
    ),
    query<Member>(
      "SELECT a.*,r.department_id FROM admins a JOIN team_roles r ON r.id=a.role_id WHERE a.active AND ($1='' OR r.department_id=$1)",
      [scope],
    ),
  ]);
  return (
    <>
      <div className="panel-heading">
        <div>
          <h2>From idea to delivery.</h2>
          <p>
            {scope ? departmentName(scope) : "All departments"} · Track
            assignments, deadlines and review.
          </p>
        </div>
      </div>
      {can(actor, "tasks.manage") && (
        <details className="dash-panel task-create">
          <summary>
            Create a task <span>＋</span>
          </summary>
          <TeamForm action={saveTask} label="Create task">
            <div className="form-grid">
              <label>
                Task title
                <input name="title" required minLength={3} maxLength={160} />
              </label>
              <label>
                Department
                <select
                  name="department"
                  defaultValue={scope || departments[0].id}
                >
                  {departments
                    .filter(
                      (d) => isFounder(actor) || d.id === actor.department_id,
                    )
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Assign to
                <select name="assignee">
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.display_name || m.email} /{" "}
                      {departmentName(m.department_id)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Due date
                <input name="due" type="date" />
              </label>
              <label>
                Priority
                <select name="priority">
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </label>
              <label className="full">
                Brief
                <textarea name="description" maxLength={3000} rows={3} />
              </label>
            </div>
          </TeamForm>
        </details>
      )}
      <div className="task-board">
        {taskStatuses.map((status) => (
          <section className="task-column" key={status}>
            <h3>
              {status.replace("-", " ")}{" "}
              <span>{tasks.filter((t) => t.status === status).length}</span>
            </h3>
            {tasks
              .filter((t) => t.status === status)
              .map((t) => (
                <article className="task-card" key={t.id}>
                  <div className="task-meta">
                    <span>{departmentName(t.department_id)}</span>
                    <span
                      className={`pill ${t.priority === "urgent" ? "warm" : ""}`}
                    >
                      {t.priority}
                    </span>
                  </div>
                  <h4>{t.title}</h4>
                  <p className="pre-line">{t.description}</p>
                  <p className="task-assignee">{t.assignee_name}</p>
                  {t.due_date && (
                    <p className="task-due">
                      Due {new Date(t.due_date).toLocaleDateString("en-IN")}
                    </p>
                  )}
                  {(can(actor, "tasks.manage") ||
                    t.assignee_id === actor.id) && (
                    <TeamForm action={updateTask} label="Update">
                      <input type="hidden" name="id" value={t.id} />
                      <label className="sr-only" htmlFor={`status-${t.id}`}>
                        Task status
                      </label>
                      <select
                        id={`status-${t.id}`}
                        name="status"
                        defaultValue={t.status}
                      >
                        {taskStatuses.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </TeamForm>
                  )}
                </article>
              ))}
            {!tasks.some((t) => t.status === status) && (
              <p className="column-empty">A little breathing room.</p>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
export async function DrivePanel({ actor }: { actor: Member }) {
  const rows = await query<{ id: string; name: string; drive_url: string }>(
    "SELECT * FROM departments WHERE ($1 OR id=$2) ORDER BY name",
    [isFounder(actor), actor.department_id],
  );
  return (
    <>
      <div className="panel-heading">
        <div>
          <h2>A place for every frame.</h2>
          <p>
            Department folders open directly in Google Drive. Keep folders
            restricted and share them with the relevant employees’ Google
            accounts.
          </p>
        </div>
      </div>
      {isFounder(actor) && (
        <a
          className="drive-root dash-panel"
          href="https://drive.google.com/drive/folders/1YHeocd7p8b2IUTqy4LsTVeum-N5ntOPU"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="eyebrow">FOUNDER OFFICE / ROOT FOLDER</span>
          <h3>Motion Mark Studio ↗</h3>
          <p>Open the studio’s main folder</p>
        </a>
      )}
      <div className="roles-grid">
        {rows.map((d) => (
          <article className="dash-panel" key={d.id}>
            <p className="eyebrow">DEPARTMENT LIBRARY</p>
            <h3>{d.name}</h3>
            {d.drive_url ? (
              <a
                className="button small secondary"
                href={d.drive_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open folder ↗
              </a>
            ) : (
              <p>Your department folder hasn’t been linked yet.</p>
            )}
            {isFounder(actor) && (
              <TeamForm action={saveDrive} label="Save folder">
                <input type="hidden" name="department" value={d.id} />
                <label>
                  Department subfolder URL
                  <input
                    name="url"
                    type="url"
                    defaultValue={d.drive_url}
                    placeholder="https://drive.google.com/drive/folders/…"
                  />
                </label>
              </TeamForm>
            )}
          </article>
        ))}
      </div>
      <p className="form-help">
        Dashboard access does not change Google Drive permissions. Removing an
        employee here does not remove their Google sharing access; update both
        when someone leaves.
      </p>
    </>
  );
}
export async function Announcements({ actor }: { actor: Member }) {
  const rows = await query<{
    id: string;
    title: string;
    body: string;
    department_id: string | null;
    created_at: string;
  }>(
    "SELECT * FROM announcements WHERE $1 OR department_id IS NULL OR department_id=$2 ORDER BY created_at DESC LIMIT 15",
    [isFounder(actor), actor.department_id],
  );
  return (
    <>
      <div className="panel-heading">
        <div>
          <h2>From the studio.</h2>
          <p>Updates that keep everyone on the same page.</p>
        </div>
      </div>
      {isFounder(actor) && (
        <details className="dash-panel">
          <summary>Post an announcement ＋</summary>
          <TeamForm action={postAnnouncement} label="Publish announcement">
            <label>
              Title
              <input name="title" required minLength={3} maxLength={120} />
            </label>
            <label>
              Audience
              <select name="department">
                <option value="">Everyone</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Message
              <textarea
                name="body"
                rows={4}
                required
                minLength={3}
                maxLength={2000}
              />
            </label>
          </TeamForm>
        </details>
      )}
      <div className="people-grid">
        {rows.map((r) => (
          <article className="dash-panel" key={r.id}>
            <p className="eyebrow">
              {r.department_id
                ? departmentName(r.department_id)
                : "Studio-wide"}{" "}
              · {new Date(r.created_at).toLocaleDateString("en-IN")}
            </p>
            <h3>{r.title}</h3>
            <p className="pre-line">{r.body}</p>
          </article>
        ))}
      </div>
      {!rows.length && (
        <Empty
          title="A quiet moment."
          text="Studio announcements will appear here."
        />
      )}
    </>
  );
}
export function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="dash-empty">
      <span aria-hidden="true">✳</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
