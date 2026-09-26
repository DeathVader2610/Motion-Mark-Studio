import Link from "next/link";
import { query } from "@/lib/db";
import type { Content, EnquiryInput } from "@/lib/schema";
import { ContentEditor, RetryEmail } from "@/components/admin-forms";
import { updateEnquiry } from "@/app/admin/actions";
export async function ContentLibrary({
  kind,
  id,
}: {
  kind: string;
  id?: string;
}) {
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
export async function Enquiries({
  owner,
  manage,
}: {
  owner: boolean;
  manage: boolean;
}) {
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
          {manage && (
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
          )}
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
