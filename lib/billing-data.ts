import "server-only";
import { query } from "./db";
import { getContact } from "./data";
import { profileSchema, type BillingProfile, type Invoice } from "./billing";
export async function getBillingProfile(): Promise<BillingProfile> {
  const [row] = await query<{ value: unknown }>(
    "SELECT value FROM settings WHERE key='billing_profile'",
  );
  if (row) return profileSchema.parse(row.value);
  const c = await getContact();
  return {
    name: "Motion Mark Studio",
    address: "",
    email: c.email,
    phone: c.phone,
    paymentInstructions: "",
    terms: "Payment is due by the date shown on this invoice.",
  };
}
export const invoiceSelect = `SELECT i.id,i.client_id,i.number,i.status,i.title,i.currency,i.items,i.subtotal,i.discount,i.total,i.client_snapshot,i.studio_snapshot,i.notes,i.terms,i.void_reason,i.version,i.created_by,i.created_at,i.updated_at,to_char(i.issued_on,'YYYY-MM-DD') AS issued_on,to_char(i.due_on,'YYYY-MM-DD') AS due_on,COALESCE((SELECT sum(p.amount)::int FROM invoice_payments p WHERE p.invoice_id=i.id AND p.reversed_at IS NULL),0) AS paid FROM invoices i`;
export async function getInvoice(id: string) {
  return (
    (await query<Invoice>(invoiceSelect + " WHERE i.id=$1", [id]))[0] || null
  );
}
