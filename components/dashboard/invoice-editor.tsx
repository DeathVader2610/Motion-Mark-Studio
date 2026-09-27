"use client";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { TeamForm } from "./forms";
import { saveInvoice } from "@/app/admin/billing-actions";
import {
  minor,
  totals,
  money,
  amountInput,
  today,
  type Client,
  type Invoice,
  type BillingProfile,
} from "@/lib/billing";
export function InvoiceEditor({
  invoice,
  clients,
  profile,
  draftId,
  clientId,
}: {
  invoice?: Invoice;
  clients: Client[];
  profile: BillingProfile;
  draftId: string;
  clientId?: string;
}) {
  const [initialDate] = useState(today);
  const [rows, setRows] = useState(
    () =>
      invoice?.items.map((i, index) => ({
        ...i,
        key: String(index),
        rate: amountInput(i.rate),
      })) || [{ key: "first", description: "", quantity: 1, rate: "0.00" }],
  );
  const [discount, setDiscount] = useState(
    invoice ? amountInput(invoice.discount) : "0.00",
  );
  let preview: { subtotal: number; discount: number; total: number } | null =
    null;
  let items: unknown[] = [];
  try {
    items = rows.map((r) => ({
      description: r.description,
      quantity: r.quantity,
      rate: minor(r.rate),
    }));
    preview = totals(items as Invoice["items"], minor(discount));
  } catch {}
  function update(key: string, value: Partial<(typeof rows)[number]>) {
    setRows((v) => v.map((r) => (r.key === key ? { ...r, ...value } : r)));
  }
  return (
    <section className="dash-panel invoice-editor">
      <div className="section-label">
        <div>
          <p className="eyebrow">INVOICE BUILDER</p>
          <h2>{invoice ? "Edit draft" : "A new beginning."}</h2>
        </div>
        <span className="role-pill">INR · No tax</span>
      </div>
      <p>
        Save a draft, review the PDF, then issue it. Issued invoices preserve
        these details.
      </p>
      <TeamForm action={saveInvoice} label="Save invoice draft">
        <input type="hidden" name="id" value={invoice?.id || draftId} />
        <input type="hidden" name="version" value={invoice?.version || 0} />
        <input type="hidden" name="items" value={JSON.stringify(items)} />
        <div className="form-grid">
          <label>
            Client
            <select
              name="client_id"
              required
              defaultValue={invoice?.client_id || clientId || ""}
            >
              <option value="">Select a client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company ? c.company + " — " : ""}
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Project / invoice title
            <input
              name="title"
              required
              minLength={2}
              maxLength={180}
              defaultValue={invoice?.title}
            />
          </label>
          <label>
            Invoice date
            <input
              name="issued_on"
              type="date"
              required
              defaultValue={invoice?.issued_on || initialDate}
            />
          </label>
          <label>
            Payment due
            <input
              name="due_on"
              type="date"
              required
              defaultValue={
                invoice?.due_on ||
                new Date(Date.parse(initialDate) + 14 * 86400000)
                  .toISOString()
                  .slice(0, 10)
              }
            />
          </label>
        </div>
        <div className="invoice-line-items">
          {rows.map((r, index) => (
            <div className="invoice-line-editor" key={r.key}>
              <label>
                Item {index + 1} · description
                <textarea
                  required
                  maxLength={400}
                  value={r.description}
                  onChange={(e) =>
                    update(r.key, { description: e.target.value })
                  }
                />
              </label>
              <label>
                Quantity
                <input
                  type="number"
                  required
                  min="1"
                  max="10000"
                  step="1"
                  value={r.quantity || ""}
                  onChange={(e) =>
                    update(r.key, { quantity: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                Rate · INR
                <input
                  required
                  type="number"
                  min="0"
                  max="10000000"
                  step="0.01"
                  value={r.rate}
                  onChange={(e) => update(r.key, { rate: e.target.value })}
                />
              </label>
              <button
                type="button"
                className="dash-icon"
                aria-label={`Remove item ${index + 1}`}
                disabled={rows.length === 1}
                onClick={() => setRows((v) => v.filter((x) => x.key !== r.key))}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="button small secondary"
          disabled={rows.length >= 40}
          onClick={() =>
            setRows((v) => [
              ...v,
              {
                key: crypto.randomUUID(),
                description: "",
                quantity: 1,
                rate: "0.00",
              },
            ])
          }
        >
          <Plus size={15} />
          Add line item
        </button>
        <div className="invoice-editor-bottom">
          <div>
            <label>
              Client-facing notes
              <textarea
                name="notes"
                maxLength={2000}
                defaultValue={invoice?.notes}
              />
            </label>
            <label>
              Terms
              <textarea
                name="terms"
                maxLength={1500}
                defaultValue={invoice?.terms ?? profile.terms}
              />
            </label>
          </div>
          <div className="invoice-total-preview">
            <label>
              Discount · INR
              <input
                name="discount"
                required
                type="number"
                min="0"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </label>
            <p>
              Subtotal{" "}
              <strong>{preview ? money(preview.subtotal) : "—"}</strong>
            </p>
            <p className="total">
              Total <strong>{preview ? money(preview.total) : "—"}</strong>
            </p>
            <small>
              Amounts are calculated on the server. Taxes are disabled.
            </small>
          </div>
        </div>
      </TeamForm>
    </section>
  );
}
