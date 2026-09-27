import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  Aperture,
  Receipt,
  Contact,
  LayoutDashboard,
  Users,
  ShieldCheck,
  Bell,
  CheckSquare,
  FolderOpen,
  BarChart3,
  Layers,
  Inbox,
  Settings,
  LogOut,
  Megaphone,
  History,
  Video,
  Camera,
  Scissors,
  Send,
} from "lucide-react";
import { getAdmin } from "@/lib/auth";
import { getContact } from "@/lib/data";
import { query } from "@/lib/db";
import {
  departments,
  departmentName,
  isFounder,
  can,
  canAccessDepartment,
} from "@/lib/workspace";
import { kinds } from "@/lib/schema";
import { ContactSettings, PasswordForm } from "@/components/admin-forms";
import { logout } from "./actions";
import { MediaUpload } from "@/components/media-upload";
import {
  ContentLibrary,
  Enquiries,
} from "@/components/dashboard/content-panel";
import {
  PeoplePanel,
  RolesPanel,
  RequestsPanel,
  TasksPanel,
  DrivePanel,
  Announcements,
} from "@/components/dashboard/team-panels";
import { DashboardLive, DashboardTheme } from "@/components/dashboard/forms";
import { AnalyticsPanel, Metric } from "@/components/dashboard/analytics";
import {
  ClientsPanel,
  BillingPanel,
  BillingSettings,
} from "@/components/dashboard/billing-panels";
export const metadata = {
  title: "Studio Workspace",
  robots: { index: false, follow: false },
};
const departmentIcons = {
  videography: Video,
  photography: Camera,
  editing: Scissors,
  "social-media": Send,
  "founder-office": Aperture,
};
export default async function Admin({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    department?: string;
    kind?: string;
    id?: string;
    client?: string;
    q?: string;
    status?: string;
    page?: string;
  }>;
}) {
  const actor = await getAdmin();
  if (!actor) redirect("/admin/login");
  const founder = isFounder(actor),
    search = await searchParams,
    tab = search.tab || "overview";
  const department = search.department || (founder ? "" : actor.department_id);
  if (
    department &&
    (!departments.some((d) => d.id === department) ||
      !canAccessDepartment(actor, department))
  )
    notFound();
  const nav = [
    { id: "overview", name: "Overview", icon: LayoutDashboard, allowed: true },
    { id: "tasks", name: "Task board", icon: CheckSquare, allowed: true },
    {
      id: "announcements",
      name: "Studio updates",
      icon: Megaphone,
      allowed: true,
    },
    {
      id: "drive",
      name: "Drive library",
      icon: FolderOpen,
      allowed: can(actor, "drive.view"),
    },
    { id: "clients", name: "Clients", icon: Contact, allowed: founder },
    {
      id: "billing",
      name: "Billing & invoices",
      icon: Receipt,
      allowed: founder,
    },
    {
      id: "billing-settings",
      name: "Invoice settings",
      icon: Settings,
      allowed: founder,
    },
    { id: "people", name: "Employees", icon: Users, allowed: founder },
    { id: "requests", name: "Join requests", icon: Bell, allowed: founder },
    {
      id: "roles",
      name: "Roles & permissions",
      icon: ShieldCheck,
      allowed: founder,
    },
    {
      id: "analytics",
      name: "Website analytics",
      icon: BarChart3,
      allowed: founder,
    },
    {
      id: "content",
      name: "Website content",
      icon: Layers,
      allowed: can(actor, "content.edit"),
    },
    {
      id: "media",
      name: "Media uploads",
      icon: Camera,
      allowed: can(actor, "media.upload"),
    },
    {
      id: "enquiries",
      name: "Enquiries",
      icon: Inbox,
      allowed: can(actor, "enquiries.read"),
    },
    {
      id: "contact",
      name: "Studio settings",
      icon: Settings,
      allowed: founder,
    },
    { id: "activity", name: "Activity log", icon: History, allowed: founder },
    { id: "account", name: "My account", icon: ShieldCheck, allowed: true },
  ];
  if (!nav.some((n) => n.id === tab && n.allowed)) notFound();
  const [pending] = founder
    ? await query<{ count: number }>(
        "SELECT count(*)::int count FROM join_requests WHERE status='pending'",
      )
    : [{ count: 0 }];
  const kind = kinds.includes(search.kind as (typeof kinds)[number])
    ? search.kind!
    : "project";
  return (
    <div className="studio-dashboard">
      <DashboardLive />
      <aside className="dash-sidebar">
        <Link href="/admin" className="dash-brand">
          <span className="brand-icon" />
          <span>
            MOTION MARK<small>STUDIO WORKSPACE</small>
          </span>
        </Link>
        <p className="sidebar-label">YOUR WORKSPACE</p>
        <nav aria-label="Workspace navigation">
          {nav
            .filter((n) => n.allowed)
            .map((n) => (
              <Link
                key={n.id}
                className={tab === n.id ? "selected" : ""}
                href={`/admin?tab=${n.id}${department ? `&department=${department}` : ""}`}
                aria-current={tab === n.id ? "page" : undefined}
              >
                <n.icon size={17} />
                {n.name}
                {n.id === "requests" && pending.count > 0 && (
                  <span className="notification-count">{pending.count}</span>
                )}
              </Link>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <Link href="/" target="_blank">
            View website ↗
          </Link>
          <form action={logout}>
            <button>
              <LogOut size={16} />
              Sign out
            </button>
          </form>
          <p>GOOD WORK STARTS HERE.</p>
        </div>
      </aside>
      <div className="dash-main">
        <header className="dash-topbar">
          <div>
            <span className="status-dot" />
            <span>Studio workspace</span>
            <span className="breadcrumb">
              / {department ? departmentName(department) : "Founder Office"}
            </span>
          </div>
          <div className="dash-top-actions">
            <DashboardTheme />
            <form action={logout}>
              <button className="dash-icon" aria-label="Sign out of workspace">
                <LogOut size={18} />
              </button>
            </form>
            {founder && (
              <Link
                href="/admin?tab=requests"
                className="dash-icon"
                aria-label={`${pending.count} pending join requests`}
              >
                <Bell size={19} />
                {pending.count > 0 && <span className="bell-dot" />}
              </Link>
            )}
            <span className="avatar small-avatar">
              {(actor.display_name || actor.email).slice(0, 2).toUpperCase()}
            </span>
          </div>
        </header>
        <div className="dash-body">
          <div className="dash-page-heading">
            <div>
              <p className="eyebrow">
                {departmentName(actor.department_id)} / {actor.role_name}
              </p>
              <h1>
                {tab === "overview"
                  ? `Welcome back${actor.display_name ? `, ${actor.display_name.split(" ")[0]}` : ""}.`
                  : nav.find((n) => n.id === tab)?.name}
              </h1>
              <p>
                {tab === "overview"
                  ? "A clear view of the work. More room for the ideas."
                  : `Motion Mark Studio · ${founder ? "Founder Office" : "Your department"}`}
              </p>
            </div>
            {founder && (
              <Link
                className="button small secondary"
                href="/join"
                target="_blank"
              >
                Invite someone to apply ↗
              </Link>
            )}
          </div>
          {tab === "overview" && (
            <>
              <OverviewMetrics founder={founder} department={department} />
              <div className="section-label">
                <h2>{founder ? "Your departments" : "Your department"}</h2>
                <span className="eyebrow">ONE STUDIO. MANY PERSPECTIVES.</span>
              </div>
              <div className="department-grid">
                {departments
                  .filter((d) => canAccessDepartment(actor, d.id))
                  .map((d, i) => {
                    const Icon = departmentIcons[d.id];
                    return (
                      <Link
                        key={d.id}
                        href={`/admin?tab=tasks&department=${d.id}`}
                        className="department-card"
                        style={{ animationDelay: `${i * 55}ms` }}
                      >
                        <span className="department-number">0{i + 1}</span>
                        <Icon size={27} strokeWidth={1.3} />
                        <h3>{d.name}</h3>
                        <p>{d.description}</p>
                        <span className="department-open">
                          Open workspace <span>↗</span>
                        </span>
                      </Link>
                    );
                  })}
              </div>
              <div className="dashboard-callout">
                <Aperture size={38} strokeWidth={1} />
                <div>
                  <h3>Make the next thing worth watching.</h3>
                  <p>
                    Keep briefs, assignments and creative assets together in
                    your department workspace.
                  </p>
                </div>
                <Link href="/admin?tab=tasks" className="text-link">
                  See the task board ↗
                </Link>
              </div>
              <Announcements actor={actor} />
            </>
          )}
          {tab === "tasks" && (
            <TasksPanel actor={actor} department={department} />
          )}
          {tab === "clients" && founder && (
            <ClientsPanel id={search.id} search={search.q} page={search.page} />
          )}
          {tab === "billing" && founder && (
            <BillingPanel
              id={search.id}
              clientId={search.client}
              search={search.q}
              status={search.status}
              page={search.page}
            />
          )}
          {tab === "billing-settings" && founder && <BillingSettings />}
          {tab === "people" && founder && <PeoplePanel actor={actor} />}
          {tab === "roles" && founder && <RolesPanel />}
          {tab === "requests" && founder && <RequestsPanel />}
          {tab === "analytics" && founder && <AnalyticsPanel />}
          {tab === "drive" && <DrivePanel actor={actor} />}
          {tab === "announcements" && <Announcements actor={actor} />}
          {tab === "activity" && founder && <ActivityPanel />}
          {tab === "contact" && founder && (
            <ContactSettings contact={await getContact()} />
          )}
          {tab === "account" && (
            <>
              <div className="dash-panel">
                <h2>{actor.display_name || actor.email}</h2>
                <p>
                  {actor.email} · {departmentName(actor.department_id)} ·{" "}
                  {actor.role_name}
                </p>
                <p>
                  Contact Founder Office to update your name, department or
                  access.
                </p>
              </div>
              <PasswordForm />
            </>
          )}
          {tab === "media" && (
            <div className="dash-panel">
              <h2>Portfolio assets</h2>
              <p>
                Upload JPG/PNG images for approved public portfolio use.
                Original video files are prepared separately for web playback.
              </p>
              <MediaUpload />
            </div>
          )}
          {tab === "content" && (
            <>
              <nav className="admin-tabs" aria-label="Content types">
                {kinds.map((k) => (
                  <Link
                    key={k}
                    href={`/admin?tab=content&kind=${k}`}
                    className={kind === k ? "active" : ""}
                  >
                    {k}
                  </Link>
                ))}
              </nav>
              {can(actor, "media.upload") && <MediaUpload />}
              <ContentLibrary kind={kind} id={search.id} />
            </>
          )}
          {tab === "enquiries" && (
            <Enquiries
              owner={founder}
              manage={can(actor, "enquiries.manage")}
            />
          )}
        </div>
        <footer className="dash-footer">
          <span>Motion Mark Studio © {new Date().getFullYear()}</span>
          <span>Access is checked on every request.</span>
        </footer>
      </div>
    </div>
  );
}
async function OverviewMetrics({
  founder,
  department,
}: {
  founder: boolean;
  department: string;
}) {
  const [task] = await query<{ open: number; review: number; overdue: number }>(
    "SELECT count(*) FILTER(WHERE status<>'done')::int open,count(*) FILTER(WHERE status='review')::int review,count(*) FILTER(WHERE status<>'done' AND due_date<current_date)::int overdue FROM team_tasks WHERE ($1='' OR department_id=$1)",
    [department],
  );
  const [members] = await query<{ count: number }>(
    "SELECT count(*)::int count FROM admins a JOIN team_roles r ON r.id=a.role_id WHERE a.active AND ($1='' OR r.department_id=$1)",
    [department],
  );
  return (
    <div className="metric-grid four">
      <Metric
        label={founder ? "Active team" : "Department team"}
        value={members.count}
        detail="People making it happen"
      />
      <Metric label="Open tasks" value={task.open} detail="Work in motion" />
      <Metric
        label="Ready for review"
        value={task.review}
        detail="The next set of eyes"
      />
      <Metric
        label="Past due"
        value={task.overdue}
        detail="A little attention needed"
      />
    </div>
  );
}
async function ActivityPanel() {
  const rows = await query<{
    id: string;
    actor: string;
    action: string;
    target: string;
    created_at: string;
  }>("SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 100");
  return (
    <section className="dash-panel">
      <h2>A record of the work.</h2>
      <p>
        The latest 100 administrative changes. Invitation secrets and passwords
        are never recorded here.
      </p>
      <div className="table-scroll">
        <table className="dash-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Who</th>
              <th>Action</th>
              <th>Item</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{new Date(r.created_at).toLocaleString("en-IN")}</td>
                <td>{r.actor}</td>
                <td>{r.action}</td>
                <td>{r.target}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && <p>No administrative changes yet.</p>}
    </section>
  );
}
