import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import { getContact } from "@/lib/data";
import { query } from "@/lib/db";
import { kinds, type Content, type EnquiryInput } from "@/lib/schema";
import {
  ContactSettings,
  ContentEditor,
  RetryEmail,
  InstagramApproval,
  PasswordForm,
} from "@/components/admin-forms";
import { getInstagramCandidates } from "@/lib/instagram";
import { logout, updateEnquiry } from "./actions";
import { MediaUpload } from "@/components/media-upload";
export const metadata = {
  title: "Studio Dashboard",
  robots: { index: false, follow: false },
};
export default async function Admin({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; kind?: string; id?: string }>;
}) {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  const search = await searchParams;
  const tab = search.tab || "contact";
  const kind = kinds.includes(search.kind as (typeof kinds)[number])
    ? search.kind!
    : "project";
  return (
    <section className="container admin-layout">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">MOTION MARK / BEHIND THE SCENES</p>
          <h1>The studio dashboard.</h1>
          <p>
            {admin.email} · {admin.role}
          </p>
        </div>
        <form action={logout}>
          <button className="button small secondary">Sign out ↗</button>
        </form>
      </div>
      <nav className="admin-tabs" aria-label="Admin sections">
        {[
          ["contact", "Contact settings"],
          ["content", "Content library"],
          ["enquiries", "Enquiries"],
          ["instagram", "Instagram connection"],
          ["account", "Account"],
        ].map(([key, label]) => (
          <Link
            className={tab === key ? "active" : ""}
            key={key}
            href={`/admin?tab=${key}`}
          >
            {label}
          </Link>
        ))}
      </nav>
      {tab === "contact" &&
        (admin.role === "owner" ? (
          <ContactSettings contact={await getContact()} />
        ) : (
          <p>Contact settings are managed by the studio owner.</p>
        ))}
      {tab === "content" && (
        <>
          <nav className="admin-tabs" aria-label="Content types">
            {kinds.map((k) => (
              <Link
                className={kind === k ? "active" : ""}
                href={`/admin?tab=content&kind=${k}`}
                key={k}
              >
                {k}
              </Link>
            ))}
          </nav>
          <p className="admin-warning">
            Publish only approved, real content. Legal pages use slugs “privacy”
            and “terms”; page SEO uses the route slug (use “home” for the
            homepage). Keep claims and statistics verifiable.
          </p>
          <MediaUpload />
          <ContentLibrary kind={kind} id={search.id} />
        </>
      )}
      {tab === "enquiries" && <Enquiries owner={admin.role === "owner"} />}
      {tab === "instagram" && <InstagramPanel owner={admin.role === "owner"} />}
      {tab === "account" && <PasswordForm />}
    </section>
  );
}
async function ContentLibrary({ kind, id }: { kind: string; id?: string }) {
  const items = await query<Content>(
    "SELECT * FROM content WHERE kind=$1 ORDER BY created_at DESC",
    [kind],
  );
  const item = items.find((i) => i.id === id);
  return (
    <div className="admin-content-layout">
      <aside className="content-list">
        <Link
          href={`/admin?tab=content&kind=${kind}`}
          className={!id ? "active" : ""}
        >
          + Add {kind}
        </Link>
        {items.map((i) => (
          <Link
            key={i.id}
            className={i.id === id ? "active" : ""}
            href={`/admin?tab=content&kind=${kind}&id=${i.id}`}
          >
            {i.title}
            <small>
              {i.status} · {new Date(i.updated_at).toLocaleDateString("en-IN")}
            </small>
          </Link>
        ))}
      </aside>
      <ContentEditor key={item?.id || kind} item={item} kind={kind} />
    </div>
  );
}
async function Enquiries({ owner }: { owner: boolean }) {
  const items = await query<{
    id: string;
    data: EnquiryInput;
    status: string;
    studio_sent: boolean;
    client_sent: boolean;
    notification_email: string;
    created_at: string;
    attachment_name: string;
  }>(
    "SELECT id,data,status,studio_sent,client_sent,notification_email,created_at,attachment_name FROM enquiries ORDER BY created_at DESC LIMIT 200",
  );
  return (
    <div className="admin-panel">
      <h2>Project enquiries</h2>
      <p>Showing the most recent 200 enquiries. Export includes all records.</p>
      {owner && (
        <a href="/api/admin/export" className="button secondary">
          Export enquiries as CSV ↗
        </a>
      )}
      <p className="admin-warning">
        {process.env.RESEND_API_KEY && process.env.EMAIL_FROM
          ? "Email service configured. Pending deliveries can be retried below."
          : "Email delivery is not connected. Add RESEND_API_KEY and EMAIL_FROM on the server. Enquiries remain saved here."}
      </p>
      {!items.length && <p>No enquiries yet.</p>}
      {items.map((e) => (
        <details className="enquiry-card" key={e.id}>
          <summary>
            {e.data.fullName} — {e.data.service}
            <small>
              {e.status} · {new Date(e.created_at).toLocaleDateString("en-IN")}
            </small>
          </summary>
          <dl>
            {Object.entries(e.data).map(([k, v]) => (
              <div key={k} style={{ display: "contents" }}>
                <dt>{k}</dt>
                <dd>{String(v)}</dd>
              </div>
            ))}
          </dl>
          {e.attachment_name && (
            <a className="text-link" href={`/api/admin/attachment/${e.id}`}>
              Download brief: {e.attachment_name} ↗
            </a>
          )}
          <form action={updateEnquiry} className="status-form">
            <input type="hidden" name="id" value={e.id} />
            <label>
              Enquiry status
              <select name="status" defaultValue={e.status}>
                {["new", "contacted", "in-progress", "closed"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <button className="button small">Update status</button>
          </form>
          <p className="delivery-state">
            Studio notification: {e.studio_sent ? "Sent" : "Pending"} · Client
            confirmation: {e.client_sent ? "Sent" : "Pending"}
            <br />
            Notification recipient: {e.notification_email}
          </p>
          {owner && (!e.studio_sent || !e.client_sent) && (
            <RetryEmail id={e.id} />
          )}
        </details>
      ))}
    </div>
  );
}
async function InstagramPanel({ owner }: { owner: boolean }) {
  const feed = await getInstagramCandidates();
  const [settings] = await query<{ value: string[] }>(
    "SELECT value FROM settings WHERE key=$1",
    ["instagram-approved"],
  );
  return (
    <div className="admin-panel">
      <h2>Approved Instagram stories</h2>
      <p>
        Connection status: {feed.status}. Only account media explicitly approved
        below is shown on the site. The API may not expose every collaboration.
        Add missing approved posts in the Instagram content library.
      </p>
      {feed.posts.map((p) => (
        <p key={p.id}>
          <strong>{p.id}</strong> ·{" "}
          {p.caption?.slice(0, 120) || "Instagram media"} ·{" "}
          <a href={p.permalink} target="_blank" rel="noopener noreferrer">
            View ↗
          </a>
        </p>
      ))}
      {owner ? (
        <InstagramApproval ids={settings?.value || []} />
      ) : (
        <p>The owner manages feed approvals.</p>
      )}
    </div>
  );
}
