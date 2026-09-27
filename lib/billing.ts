import { z } from "zod";
const text = (max: number) => z.string().trim().max(max);
const optionalHttps = z.union([
  z.literal(""),
  z
    .string()
    .url()
    .max(1500)
    .refine((v) => new URL(v).protocol === "https:", "Use an HTTPS URL"),
]);
export const clientSchema = z.object({
  name: text(120).min(2),
  company: text(160),
  email: z.string().trim().email().max(254),
  phone: text(40),
  address: text(700),
  instagram: text(80).refine(
    (v) => !v || /^@?[a-zA-Z0-9._]+$/.test(v),
    "Enter an Instagram handle, not a URL",
  ),
  bio: text(1000),
  photo: optionalHttps,
  notes: text(2500),
  active: z.boolean(),
});
export type Client = z.infer<typeof clientSchema> & {
  id: string;
  updated_at: string;
};
export const profileSchema = z.object({
  name: text(160).min(2),
  address: text(700),
  email: z.string().trim().email().max(254),
  phone: text(40),
  paymentInstructions: text(1500),
  terms: text(1500),
});
export type BillingProfile = z.infer<typeof profileSchema>;
// All money is integer paise. Decimal input is parsed as text, never binary floats.
export function minor(value: string): number {
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(value))
    throw Error("Use a positive amount with at most two decimals.");
  const [a, b = ""] = value.split(".");
  const n = Number(a) * 100 + Number(b.padEnd(2, "0"));
  if (n > 1000000000) throw Error("Amount exceeds the invoice limit.");
  return n;
}
export const itemSchema = z.object({
  description: text(400).min(2),
  quantity: z.number().int().min(1).max(10000),
  rate: z.number().int().min(0).max(1000000000),
});
export type InvoiceItem = z.infer<typeof itemSchema>;
export function totals(items: InvoiceItem[], discount: number) {
  const parsed = z.array(itemSchema).min(1).max(40).parse(items);
  const subtotal = parsed.reduce((sum, i) => sum + i.quantity * i.rate, 0);
  if (!Number.isSafeInteger(subtotal) || subtotal > 1000000000)
    throw Error("Invoice exceeds INR 1 crore.");
  if (!Number.isInteger(discount) || discount < 0 || discount >= subtotal)
    throw Error("Discount must be less than the subtotal.");
  return { subtotal, discount, total: subtotal - discount };
}
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) =>
      Number.isFinite(Date.parse(v)) &&
      new Date(v).toISOString().slice(0, 10) === v,
    "Use a valid date",
  );
export const invoiceSchema = z
  .object({
    id: z.string().uuid(),
    client_id: z.string().uuid(),
    title: text(180).min(2),
    issued_on: dateSchema,
    due_on: dateSchema,
    notes: text(2000),
    terms: text(1500),
    items: z.array(itemSchema).min(1).max(40),
    discount: z.number().int().min(0),
    version: z.number().int().min(0),
  })
  .refine(
    (d) => d.due_on >= d.issued_on,
    "Due date must be on or after the invoice date.",
  );
export type Invoice = {
  id: string;
  client_id: string;
  number: string | null;
  status: "draft" | "issued" | "void";
  title: string;
  issued_on: string;
  due_on: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  total: number;
  client_snapshot: Client;
  studio_snapshot: BillingProfile;
  notes: string;
  terms: string;
  version: number;
  void_reason: string;
  paid: number;
  created_at: string;
};
export type Payment = {
  id: string;
  invoice_id: string;
  amount: number;
  paid_on: string;
  method: string;
  reference: string;
  notes: string;
  reversed_at: string | null;
  reversal_reason: string;
};
export const money = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    n / 100,
  );
export const amountInput = (n: number) => (n / 100).toFixed(2);
export const today = () => new Date().toISOString().slice(0, 10);
export function invoiceState(
  i: Pick<Invoice, "status" | "total" | "paid" | "due_on">,
) {
  if (i.status !== "issued") return i.status;
  if (i.paid >= i.total) return "paid";
  if (i.due_on < today()) return "overdue";
  return i.paid > 0 ? "partial" : "unpaid";
}
