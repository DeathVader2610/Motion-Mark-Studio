import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { Users, Receipt, ArrowUpRight, Plus, Download } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import {
  invoiceSelect,
  getInvoice,
  getBillingProfile,
} from "@/lib/billing-data";
import {
  money,
  invoiceState,
  today,
  type Client,
  type Invoice,
  type Payment,
} from "@/lib/billing";
import {
  saveClient,
  saveBillingProfile,
  issueInvoice,
  recordPayment,
  reversePayment,
  voidInvoice,
  emailInvoice,
} from "@/app/admin/billing-actions";
import { TeamForm } from "./forms";
import { InvoiceEditor } from "./invoice-editor";
function Field({
  label,
  name,
  value = "",
  area = false,
  required = false,
  type = "text",
  max = 700,
}: {
  label: string;
  name: string;
  value?: string;
  area?: boolean;
  required?: boolean;
  type?: string;
  max?: number;
}) {
  return (
    <label>
      {label}
      {area ? (
        <textarea
          name={name}
          maxLength={max}
          defaultValue={value}
          required={required}
        />
      ) : (
        <input
          name={name}
          type={type}
          maxLength={max}
          defaultValue={value}
          required={required}
        />
      )}
    </label>
  );
}
function Badge({ invoice }: { invoice: Invoice }) {
  const state = invoiceState(invoice);
  return <span className={`billing-badge ${state}`}>{state}</span>;
}
function Metric({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <article className="metric">
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}
function InvoiceTable({ invoices }: { invoices: Invoice[] }) {
  return invoices.length ? (
    <div className="table-scroll">
      <table className="billing-table">
        <thead>
          <tr>
            <th>Invoice / project</th>
            <th>Client</th>
            <th>Due</th>
            <th>Status</th>
            <th>Total</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((i) => (
            <tr key={i.id}>
              <td>
                <Link href={"/admin?tab=billing&id=" + i.id}>
                  <strong>{i.number || "Draft invoice"}</strong>
                  <small>{i.title}</small>
                </Link>
              </td>
              <td>{i.client_snapshot.company || i.client_snapshot.name}</td>
              <td>{i.due_on}</td>
              <td>
                <Badge invoice={i} />
              </td>
              <td>{money(i.total)}</td>
              <td>{money(i.status === "void" ? 0 : i.total - i.paid)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <div className="billing-empty">
      <Receipt size={35} />
      <h3>Your next project starts here.</h3>
      <p>
        Create an invoice from a client profile. Drafts stay private until you
        issue them.
      </p>
    </div>
  );
}
export async function ClientsPanel({
  id,
  search = "",
  page = "1",
}: {
  id?: string;
  search?: string;
  page?: string;
}) {
  await requireAdmin(true);
  let client: Client | undefined;
  if (id && id !== "new") {
    if (!z.string().uuid().safeParse(id).success) notFound();
    client = (
      await query<Client>("SELECT * FROM clients WHERE id=$1", [id])
    )[0];
    if (!client) notFound();
  }
  if (id) {
    const invoices = client
      ? await query<Invoice>(
          invoiceSelect +
            " WHERE i.client_id=$1 ORDER BY i.created_at DESC LIMIT 100",
          [client.id],
        )
      : [];
    return (
      <>
        <div className="billing-toolbar">
          <Link href="/admin?tab=clients" className="text-link">
            ← All clients
          </Link>
          {client?.active && (
            <Link
              className="button small"
              href={"/admin?tab=billing&id=new&client=" + client.id}
            >
              <Plus size={15} />
              Create invoice
            </Link>
          )}
        </div>
        <div className="billing-client-layout">
          <section className="dash-panel">
            <p className="eyebrow">CLIENT PROFILE</p>
            <h2>
              {client?.company ||
                client?.name ||
                "Meet your next collaborator."}
            </h2>
            <TeamForm
              action={saveClient}
              label={client ? "Save client" : "Add client"}
            >
              {client && <input type="hidden" name="id" value={client.id} />}
              <div className="form-grid">
                <Field
                  label="Contact name"
                  name="name"
                  value={client?.name}
                  required
                  max={120}
                />
                <Field
                  label="Business / company"
                  name="company"
                  value={client?.company}
                  max={160}
                />
                <Field
                  label="Billing email"
                  name="email"
                  type="email"
                  value={client?.email}
                  required
                  max={254}
                />
                <Field
                  label="Phone"
                  name="phone"
                  value={client?.phone}
                  max={40}
                />
              </div>
              <Field
                label="Billing address"
                name="address"
                value={client?.address}
                area
              />
              <div className="form-grid">
                <Field
                  label="Instagram handle"
                  name="instagram"
                  value={client?.instagram}
                  max={80}
                />
                <Field
                  label="Profile photo URL · HTTPS"
                  name="photo"
                  value={client?.photo}
                  max={1500}
                />
              </div>
              <Field
                label="Client bio"
                name="bio"
                value={client?.bio}
                area
                max={1000}
              />
              <Field
                label="Internal notes · never included on invoices"
                name="notes"
                value={client?.notes}
                area
                max={2500}
              />
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={client?.active ?? true}
                />
                Active client
              </label>
              <small>
                Archiving retains invoice and payment history. Changes apply to
                newly saved drafts.
              </small>
            </TeamForm>
          </section>
          <aside className="billing-client-aside">
            <div className="dash-panel">
              <Users size={25} />
              <h3>One client. One clear picture.</h3>
              <p>
                Contact information and billing stay linked. Issued documents
                retain the details they were created with.
              </p>
              {client?.photo && (
                <Image
                  src={client.photo}
                  alt={client.name}
                  width={96}
                  height={96}
                  className="client-profile-photo"
                  unoptimized
                  referrerPolicy="no-referrer"
                />
              )}
              {client?.instagram && (
                <a
                  className="text-link"
                  href={"https://www.instagram.com/" + client.instagram + "/"}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @{client.instagram} ↗
                </a>
              )}
            </div>
            <Metric
              label="Outstanding"
              value={money(
                invoices
                  .filter((i) => i.status === "issued")
                  .reduce((n, i) => n + i.total - i.paid, 0),
              )}
              note="From the most recent 100 invoices"
            />
          </aside>
        </div>
        {client && (
          <section className="dash-panel">
            <div className="section-label">
              <h2>Invoice history</h2>
              <span>Latest 100</span>
            </div>
            <InvoiceTable invoices={invoices} />
          </section>
        )}
      </>
    );
  }
  const q = search.trim().slice(0, 120),
    offset =
      Math.max(0, Math.min(100000, (Number.parseInt(page) || 1) - 1)) * 24;
  const clients = await query<Client & { balance: string }>(
    `SELECT c.*,COALESCE((SELECT sum(i.total-COALESCE((SELECT sum(p.amount) FROM invoice_payments p WHERE p.invoice_id=i.id AND p.reversed_at IS NULL),0)) FROM invoices i WHERE i.client_id=c.id AND i.status='issued'),0) AS balance FROM clients c WHERE ($1='' OR c.name ILIKE $2 OR c.company ILIKE $2 OR c.email ILIKE $2) ORDER BY c.active DESC,c.updated_at DESC LIMIT 25 OFFSET $3`,
    [q, "%" + q.replace(/[\\%_]/g, "\\$&") + "%", offset],
  );
  const counts = (
    await query<{ active: number; total: number }>(
      "SELECT count(*)::int AS total,count(*) FILTER(WHERE active)::int AS active FROM clients",
    )
  )[0];
  return (
    <>
      <div className="billing-toolbar">
        <div>
          <p className="eyebrow">RELATIONSHIPS THAT LAST</p>
          <h2>Your client book.</h2>
          <p>
            {counts.active} active · {counts.total} total clients
          </p>
        </div>
        <Link className="button small" href="/admin?tab=clients&id=new">
          <Plus size={15} />
          Add client
        </Link>
      </div>
      <form className="billing-search">
        <input type="hidden" name="tab" value="clients" />
        <label className="sr-only" htmlFor="client-search">
          Search clients
        </label>
        <input
          id="client-search"
          name="q"
          defaultValue={q}
          placeholder="Search name, company or email"
        />
        <button className="button small secondary">Search</button>
      </form>
      <div className="client-grid">
        {clients.slice(0, 24).map((c) => (
          <Link
            key={c.id}
            className="client-card"
            href={"/admin?tab=clients&id=" + c.id}
          >
            <div className="client-card-top">
              <span className="avatar">{c.name.slice(0, 2).toUpperCase()}</span>
              <ArrowUpRight size={19} />
            </div>
            <span className="eyebrow">
              {c.active ? "ACTIVE CLIENT" : "ARCHIVED"}
            </span>
            <h3>{c.company || c.name}</h3>
            <p>{c.company ? c.name : c.email}</p>
            <div className="client-card-balance">
              <span>Outstanding</span>
              <strong>{money(Number(c.balance))}</strong>
            </div>
          </Link>
        ))}
      </div>
      {!clients.length && (
        <div className="billing-empty">
          <Users size={35} />
          <h3>
            {q ? "No matching clients." : "Good relationships start here."}
          </h3>
          <p>Add a client to connect their details, invoices and payments.</p>
        </div>
      )}
      <div className="billing-toolbar">
        {offset > 0 && (
          <Link
            href={
              "/admin?tab=clients&q=" +
              encodeURIComponent(q) +
              "&page=" +
              offset / 24
            }
          >
            ← Previous
          </Link>
        )}
        {clients.length > 24 && (
          <Link
            href={
              "/admin?tab=clients&q=" +
              encodeURIComponent(q) +
              "&page=" +
              (offset / 24 + 2)
            }
          >
            Next →
          </Link>
        )}
      </div>
    </>
  );
}
export async function BillingPanel({
  id,
  clientId,
  search = "",
  status = "",
  page = "1",
}: {
  id?: string;
  clientId?: string;
  search?: string;
  status?: string;
  page?: string;
}) {
  await requireAdmin(true);
  if (id === "new") {
    const clients = await query<Client>(
      "SELECT * FROM clients WHERE active=true ORDER BY name",
    );
    return (
      <>
        <Link href="/admin?tab=billing" className="text-link">
          ← Billing overview
        </Link>
        {clients.length ? (
          <InvoiceEditor
            clients={clients}
            profile={await getBillingProfile()}
            draftId={randomUUID()}
            clientId={clientId}
          />
        ) : (
          <div className="dash-panel">
            <h2>Add your first client.</h2>
            <p>Each invoice belongs to a saved client.</p>
            <Link className="button small" href="/admin?tab=clients&id=new">
              Add client ↗
            </Link>
          </div>
        )}
      </>
    );
  }
  if (id) {
    if (!z.string().uuid().safeParse(id).success) notFound();
    const i = await getInvoice(id);
    if (!i) notFound();
    return <InvoiceDetail invoice={i} />;
  }
  const q = search.trim().slice(0, 120),
    filter = [
      "draft",
      "issued",
      "void",
      "paid",
      "overdue",
      "partial",
      "unpaid",
    ].includes(status)
      ? status
      : "";
  const offset =
    Math.max(0, Math.min(100000, (Number.parseInt(page) || 1) - 1)) * 30;
  const rows = await query<Invoice>(
    `SELECT * FROM (${invoiceSelect}) b WHERE ($1='' OR title ILIKE $2 OR COALESCE(number,'') ILIKE $2 OR client_snapshot->>'name' ILIKE $2 OR client_snapshot->>'company' ILIKE $2) AND ($3='' OR status=$3 OR (status='issued' AND (($3='paid' AND paid>=total) OR ($3='overdue' AND paid<total AND due_on<$4) OR ($3='partial' AND paid>0 AND paid<total AND due_on>=$4) OR ($3='unpaid' AND paid=0 AND due_on>=$4)))) ORDER BY created_at DESC LIMIT 31 OFFSET $5`,
    [q, "%" + q.replace(/[\\%_]/g, "\\$&") + "%", filter, today(), offset],
  );
  const s = (
    await query<{
      outstanding: string;
      paid: string;
      overdue: string;
      drafts: number;
    }>(
      `SELECT COALESCE(sum(total-paid) FILTER(WHERE status='issued'),0) AS outstanding,COALESCE(sum(paid) FILTER(WHERE status='issued'),0) AS paid,COALESCE(sum(total-paid) FILTER(WHERE status='issued' AND due_on<$1),0) AS overdue,count(*) FILTER(WHERE status='draft')::int AS drafts FROM (${invoiceSelect}) b`,
      [today()],
    )
  )[0];
  return (
    <>
      <div className="billing-toolbar">
        <div>
          <p className="eyebrow">THE BUSINESS BEHIND THE WORK</p>
          <h2>Keep every project accounted for.</h2>
        </div>
        <Link className="button small" href="/admin?tab=billing&id=new">
          <Plus size={15} />
          Create invoice
        </Link>
      </div>
      <div className="metric-grid four billing-metrics">
        <Metric
          label="Outstanding"
          value={money(Number(s.outstanding))}
          note="Issued invoices, less recorded payments"
        />
        <Metric
          label="Collected"
          value={money(Number(s.paid))}
          note="Recorded payments across issued invoices"
        />
        <Metric
          label="Overdue"
          value={money(Number(s.overdue))}
          note="Unpaid balances past their due date"
        />
        <Metric
          label="Draft invoices"
          value={String(s.drafts)}
          note="Private drafts, not yet issued"
        />
      </div>
      <section className="dash-panel">
        <div className="section-label">
          <h2>Invoice register</h2>
          <Link className="text-link" href="/admin?tab=billing-settings">
            Invoice settings ↗
          </Link>
        </div>
        <form className="billing-search">
          <input type="hidden" name="tab" value="billing" />
          <label className="sr-only" htmlFor="invoice-search">
            Search invoices
          </label>
          <input
            id="invoice-search"
            name="q"
            defaultValue={q}
            placeholder="Search invoice, project or client"
          />
          <label className="sr-only" htmlFor="invoice-filter">
            Status
          </label>
          <select id="invoice-filter" name="status" defaultValue={filter}>
            <option value="">All statuses</option>
            {[
              "draft",
              "issued",
              "unpaid",
              "partial",
              "paid",
              "overdue",
              "void",
            ].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <button className="button small secondary">Filter</button>
        </form>
        <InvoiceTable invoices={rows.slice(0, 30)} />
        <div className="billing-toolbar">
          {offset > 0 && (
            <Link
              href={`/admin?tab=billing&q=${encodeURIComponent(q)}&status=${filter}&page=${offset / 30}`}
            >
              ← Previous
            </Link>
          )}
          {rows.length > 30 && (
            <Link
              href={`/admin?tab=billing&q=${encodeURIComponent(q)}&status=${filter}&page=${offset / 30 + 2}`}
            >
              Next →
            </Link>
          )}
        </div>
      </section>
    </>
  );
}
async function InvoiceDetail({ invoice: i }: { invoice: Invoice }) {
  const payments = await query<Payment>(
    "SELECT *,to_char(paid_on,'YYYY-MM-DD') AS paid_on FROM invoice_payments WHERE invoice_id=$1 ORDER BY created_at DESC",
    [i.id],
  );
  const [delivery] = await query<{
    status: string;
    recipient: string;
    error: string;
  }>("SELECT * FROM invoice_deliveries WHERE invoice_id=$1", [i.id]);
  const testSender =
    !process.env.RESEND_API_KEY ||
    !process.env.EMAIL_FROM ||
    /@resend\.dev\b/i.test(process.env.EMAIL_FROM);
  return (
    <>
      <div className="billing-toolbar">
        <Link href="/admin?tab=billing" className="text-link">
          ← All invoices
        </Link>
        <div className="billing-actions">
          <Badge invoice={i} />
          <a
            className="button small secondary"
            href={`/api/admin/invoices/${i.id}/pdf`}
          >
            <Download size={15} />
            Download PDF
          </a>
        </div>
      </div>
      <section className="dash-panel invoice-summary">
        <div>
          <p className="eyebrow">{i.number || "DRAFT INVOICE"}</p>
          <h2>{i.title}</h2>
          <Link href={"/admin?tab=clients&id=" + i.client_id}>
            {i.client_snapshot.company || i.client_snapshot.name} ↗
          </Link>
          <p>{i.client_snapshot.email}</p>
          <small>
            Invoice date {i.issued_on} · Due {i.due_on}
          </small>
        </div>
        <div className="invoice-summary-total">
          <span>Balance due</span>
          <strong>{money(i.status === "void" ? 0 : i.total - i.paid)}</strong>
          <small>
            Total {money(i.total)} · Paid {money(i.paid)}
          </small>
        </div>
      </section>
      {i.status === "draft" ? (
        <>
          <InvoiceEditor
            key={i.version}
            invoice={i}
            clients={await query<Client>(
              "SELECT * FROM clients WHERE active=true ORDER BY name",
            )}
            profile={await getBillingProfile()}
            draftId={i.id}
          />
          <section className="dash-panel">
            <h3>Ready to issue?</h3>
            <p>
              Download and review the draft first. Issuing assigns a unique
              invoice number and locks the client, studio details and amounts.
            </p>
            <TeamForm action={issueInvoice} label="Issue invoice">
              <input type="hidden" name="id" value={i.id} />
              <input type="hidden" name="version" value={i.version} />
              <label className="checkbox-row">
                <input type="checkbox" name="confirmed" required />I have
                reviewed the client details, dates and total of {money(i.total)}
                .
              </label>
            </TeamForm>
            <Link href="/admin?tab=billing-settings" className="text-link">
              Edit studio billing address & payment details ↗
            </Link>
          </section>
        </>
      ) : (
        <>
          <section className="dash-panel">
            <h3>Invoice details</h3>
            <div className="table-scroll">
              <table className="billing-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Rate</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {i.items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.description}</td>
                      <td>{item.quantity}</td>
                      <td>{money(item.rate)}</td>
                      <td>{money(item.rate * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              Subtotal {money(i.subtotal)} · Discount {money(i.discount)} ·
              Total {money(i.total)}
            </p>
            <p className="pre-line">{i.notes}</p>
            <small className="pre-line">{i.terms}</small>
            {i.status === "void" && <p>Void reason: {i.void_reason}</p>}
          </section>
          {i.status === "issued" && (
            <div className="billing-two-column">
              <section className="dash-panel">
                <h3>Record a payment</h3>
                <p>
                  Log money received by bank transfer, UPI, cash or another
                  method. This does not charge the client.
                </p>
                {i.paid < i.total ? (
                  <TeamForm
                    key={payments.length}
                    action={recordPayment}
                    label="Record payment"
                  >
                    <input type="hidden" name="invoice_id" value={i.id} />
                    <input
                      type="hidden"
                      name="payment_id"
                      value={randomUUID()}
                    />
                    <div className="form-grid">
                      <label>
                        Amount · INR
                        <input
                          type="number"
                          name="amount"
                          min="0.01"
                          max={(i.total - i.paid) / 100}
                          step="0.01"
                          required
                        />
                      </label>
                      <label>
                        Payment date
                        <input
                          type="date"
                          name="paid_on"
                          defaultValue={today()}
                          max={today()}
                          required
                        />
                      </label>
                      <label>
                        Method
                        <select name="method">
                          {[
                            "Bank transfer",
                            "UPI",
                            "Cash",
                            "Card",
                            "Other",
                          ].map((m) => (
                            <option key={m}>{m}</option>
                          ))}
                        </select>
                      </label>
                      <Field
                        label="Transaction reference"
                        name="reference"
                        max={180}
                      />
                    </div>
                    <Field
                      label="Internal payment note"
                      name="notes"
                      area
                      max={700}
                    />
                  </TeamForm>
                ) : (
                  <p className="form-success">Paid in full. Thank you.</p>
                )}
              </section>
              <section className="dash-panel">
                <h3>Send to your client</h3>
                <p>
                  To: <strong>{i.client_snapshot.email}</strong>
                </p>
                <p>Subject: Invoice {i.number} | Motion Mark Studio</p>
                <p>
                  A branded PDF with the invoice details and payment
                  instructions will be attached.
                </p>
                {delivery && (
                  <p>
                    Email status:{" "}
                    <strong>
                      {delivery.status === "sent"
                        ? "Accepted by email provider"
                        : delivery.status}
                    </strong>
                    {delivery.error && " · " + delivery.error}
                  </p>
                )}
                {testSender ? (
                  <p className="billing-notice">
                    Email sending needs a verified Resend domain. Download the
                    PDF to share it manually for now.
                  </p>
                ) : delivery?.status === "sent" ? null : (
                  <TeamForm action={emailInvoice} label="Email invoice">
                    <input type="hidden" name="id" value={i.id} />
                    <label className="checkbox-row">
                      <input type="checkbox" name="confirmed" required />
                      Send this invoice PDF to {i.client_snapshot.email}.
                    </label>
                  </TeamForm>
                )}
              </section>
            </div>
          )}
        </>
      )}
      {payments.length > 0 && (
        <section className="dash-panel">
          <h3>Payment history</h3>
          {payments.map((p) => (
            <article className="payment-row" key={p.id}>
              <div>
                <strong>{money(p.amount)}</strong>
                <p>
                  {p.paid_on} · {p.method} {p.reference && "· " + p.reference}
                </p>
                <small>{p.notes}</small>
              </div>
              {p.reversed_at ? (
                <div className="billing-notice">
                  Reversed · {p.reversal_reason}
                </div>
              ) : (
                <details>
                  <summary>Correct this entry</summary>
                  <TeamForm
                    action={reversePayment}
                    label="Reverse ledger entry"
                  >
                    <input type="hidden" name="invoice_id" value={i.id} />
                    <input type="hidden" name="payment_id" value={p.id} />
                    <Field
                      label="Reason · required"
                      name="reason"
                      required
                      max={500}
                    />
                    <small>
                      This records a correction. It does not refund money.
                    </small>
                  </TeamForm>
                </details>
              )}
            </article>
          ))}
        </section>
      )}
      {i.status === "issued" && (
        <details className="dash-panel">
          <summary>Void this invoice</summary>
          <p>
            Use for an incorrect invoice. The original number and history
            remain. Recorded payments must be reversed first.
          </p>
          <TeamForm action={voidInvoice} label="Void invoice">
            <input type="hidden" name="id" value={i.id} />
            <Field label="Reason · required" name="reason" required max={500} />
          </TeamForm>
        </details>
      )}
    </>
  );
}
export async function BillingSettings() {
  await requireAdmin(true);
  const p = await getBillingProfile();
  return (
    <section className="dash-panel">
      <p className="eyebrow">YOUR STUDIO ON EVERY INVOICE</p>
      <h2>Billing identity.</h2>
      <p>
        Enter your actual billing identity and payment instructions before
        issuing invoices. This version creates INR invoices with no tax.
      </p>
      <TeamForm action={saveBillingProfile}>
        <Field
          label="Business / legal name"
          name="name"
          required
          value={p.name}
          max={160}
        />
        <Field
          label="Full billing address"
          name="address"
          area
          required
          value={p.address}
        />
        <div className="form-grid">
          <Field
            label="Billing email"
            name="email"
            required
            type="email"
            value={p.email}
            max={254}
          />
          <Field label="Phone" name="phone" value={p.phone} max={40} />
        </div>
        <Field
          label="Payment instructions · bank / UPI details"
          name="paymentInstructions"
          value={p.paymentInstructions}
          area
          max={1500}
        />
        <Field
          label="Default invoice terms"
          name="terms"
          value={p.terms}
          area
          max={1500}
        />
        <small>
          These details appear on invoices. Only enter payment details you
          intend to share with clients.
        </small>
      </TeamForm>
    </section>
  );
}
