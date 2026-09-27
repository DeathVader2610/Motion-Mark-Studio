"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Resend } from "resend";
import { requireAdmin } from "@/lib/auth";
import { query, transaction } from "@/lib/db";
import {
  clientSchema,
  invoiceSchema,
  profileSchema,
  minor,
  totals,
  dateSchema,
  today,
  type Client,
  type Invoice,
} from "@/lib/billing";
import { getBillingProfile, getInvoice } from "@/lib/billing-data";
import { invoicePdf } from "@/lib/invoice-pdf";
import type { TeamResult } from "./team-actions";
class BillingError extends Error {}
const id = (v: FormDataEntryValue | null) => z.string().uuid().parse(v);
const finish = () => revalidatePath("/admin", "layout");
const fail = (e: unknown): TeamResult => ({
  error:
    e instanceof BillingError
      ? e.message
      : e instanceof z.ZodError
        ? "Check the required fields and amounts."
        : "Could not save this change. Refresh and try again.",
});
async function log(
  c: import("pg").PoolClient,
  email: string,
  action: string,
  target: string,
) {
  await c.query(
    "INSERT INTO audit_log(id,actor,action,target) VALUES($1,$2,$3,$4)",
    [randomUUID(), email, action, target],
  );
}
export async function saveClient(
  _: TeamResult,
  form: FormData,
): Promise<TeamResult> {
  const a = await requireAdmin(true);
  let target = "";
  try {
    const d = clientSchema.parse({
      ...Object.fromEntries(form),
      active: form.get("active") === "on",
    });
    target = form.get("id") ? id(form.get("id")) : randomUUID();
    await transaction(async (c) => {
      if (form.get("id")) {
        const r = await c.query(
          "UPDATE clients SET name=$2,company=$3,email=$4,phone=$5,address=$6,instagram=$7,bio=$8,photo=$9,notes=$10,active=$11,updated_at=now() WHERE id=$1 RETURNING id",
          [
            target,
            d.name,
            d.company,
            d.email,
            d.phone,
            d.address,
            d.instagram.replace(/^@/, ""),
            d.bio,
            d.photo,
            d.notes,
            d.active,
          ],
        );
        if (!r.rowCount) throw new BillingError("Client not found.");
      } else
        await c.query(
          "INSERT INTO clients(id,name,company,email,phone,address,instagram,bio,photo,notes,active) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
          [
            target,
            d.name,
            d.company,
            d.email,
            d.phone,
            d.address,
            d.instagram.replace(/^@/, ""),
            d.bio,
            d.photo,
            d.notes,
            d.active,
          ],
        );
      await log(c, a.email, "Saved client", target);
    });
  } catch (e) {
    return fail(e);
  }
  finish();
  redirect("/admin?tab=clients&id=" + target);
}
export async function saveBillingProfile(
  _: TeamResult,
  form: FormData,
): Promise<TeamResult> {
  const a = await requireAdmin(true);
  try {
    const p = profileSchema.parse(Object.fromEntries(form));
    await transaction(async (c) => {
      await c.query(
        "INSERT INTO settings(key,value) VALUES('billing_profile',$1) ON CONFLICT(key) DO UPDATE SET value=$1",
        [JSON.stringify(p)],
      );
      await log(c, a.email, "Updated invoice profile", "billing_profile");
    });
    finish();
    return { success: "Invoice profile saved. Issued invoices are unchanged." };
  } catch (e) {
    return fail(e);
  }
}
export async function saveInvoice(
  _: TeamResult,
  form: FormData,
): Promise<TeamResult> {
  const a = await requireAdmin(true);
  let target = "";
  try {
    let discount: number;
    try {
      discount = minor(String(form.get("discount") || "0"));
    } catch (e) {
      throw new BillingError((e as Error).message);
    }
    const d = invoiceSchema.parse({
      ...Object.fromEntries(form),
      version: Number(form.get("version")),
      items: JSON.parse(String(form.get("items"))),
      discount,
    });
    let total;
    try {
      total = totals(d.items, d.discount);
    } catch (e) {
      throw new BillingError((e as Error).message);
    }
    target = d.id;
    const profile = await getBillingProfile();
    await transaction(async (c) => {
      const client = (
        await c.query<Client>(
          "SELECT * FROM clients WHERE id=$1 AND active=true FOR SHARE",
          [d.client_id],
        )
      ).rows[0];
      if (!client) throw new BillingError("Select an active client.");
      const existing = (
        await c.query<Invoice>(
          "SELECT * FROM invoices WHERE id=$1 FOR UPDATE",
          [d.id],
        )
      ).rows[0];
      if (
        existing &&
        (existing.status !== "draft" || existing.version !== d.version)
      )
        throw new BillingError(
          "This invoice changed or has been issued. Refresh before editing.",
        );
      if (!existing && d.version !== 0)
        throw new BillingError("Invoice not found.");
      const values = [
        d.id,
        d.client_id,
        d.title,
        d.issued_on,
        d.due_on,
        JSON.stringify(d.items),
        total.subtotal,
        total.discount,
        total.total,
        JSON.stringify(client),
        JSON.stringify(profile),
        d.notes,
        d.terms,
      ];
      if (existing)
        await c.query(
          "UPDATE invoices SET client_id=$2,title=$3,issued_on=$4,due_on=$5,items=$6,subtotal=$7,discount=$8,total=$9,client_snapshot=$10,studio_snapshot=$11,notes=$12,terms=$13,version=version+1,updated_at=now() WHERE id=$1",
          values,
        );
      else
        await c.query(
          "INSERT INTO invoices(id,client_id,title,issued_on,due_on,items,subtotal,discount,total,client_snapshot,studio_snapshot,notes,terms,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)",
          [...values, a.id],
        );
      await log(c, a.email, "Saved draft invoice", d.id);
    });
  } catch (e) {
    return fail(e);
  }
  finish();
  redirect("/admin?tab=billing&id=" + target);
}
export async function issueInvoice(
  _: TeamResult,
  form: FormData,
): Promise<TeamResult> {
  const a = await requireAdmin(true);
  try {
    if (form.get("confirmed") !== "on")
      throw new BillingError("Review the invoice and confirm before issuing.");
    const invoiceId = id(form.get("id"));
    await transaction(async (c) => {
      const i = (
        await c.query<Invoice>(
          "SELECT *,to_char(issued_on,'YYYY-MM-DD') AS issued_on FROM invoices WHERE id=$1 FOR UPDATE",
          [invoiceId],
        )
      ).rows[0];
      if (!i || i.status !== "draft")
        throw new BillingError("Only draft invoices can be issued.");
      if (i.version !== Number(form.get("version")))
        throw new BillingError(
          "The draft changed. Refresh and review the latest version.",
        );
      if (!i.studio_snapshot.address || !i.client_snapshot.address)
        throw new BillingError(
          "Add the studio billing address and client billing address, then save this draft again.",
        );
      if (i.issued_on > today())
        throw new BillingError(
          "The invoice date cannot be in the future when issuing.",
        );
      const year = Number(i.issued_on.slice(0, 4));
      const count = (
        await c.query<{ value: number }>(
          "INSERT INTO invoice_counters(year,value) VALUES($1,1) ON CONFLICT(year) DO UPDATE SET value=invoice_counters.value+1 RETURNING value",
          [year],
        )
      ).rows[0].value;
      const number = `MMS-${year}-${String(count).padStart(4, "0")}`;
      await c.query(
        "UPDATE invoices SET status='issued',number=$2,version=version+1,updated_at=now() WHERE id=$1",
        [invoiceId, number],
      );
      await log(c, a.email, "Issued invoice " + number, invoiceId);
    });
    finish();
    return {
      success:
        "Invoice issued. Its details are now locked; download the PDF or send it to the client.",
    };
  } catch (e) {
    return fail(e);
  }
}
export async function recordPayment(
  _: TeamResult,
  form: FormData,
): Promise<TeamResult> {
  const a = await requireAdmin(true);
  try {
    const invoiceId = id(form.get("invoice_id")),
      paymentId = id(form.get("payment_id"));
    let amount;
    try {
      amount = minor(String(form.get("amount")));
    } catch (e) {
      throw new BillingError((e as Error).message);
    }
    if (amount <= 0)
      throw new BillingError("Enter an amount greater than zero.");
    const date = dateSchema.parse(form.get("paid_on"));
    if (date > today())
      throw new BillingError("Payment date cannot be in the future.");
    const method = z
      .enum(["Bank transfer", "UPI", "Cash", "Card", "Other"])
      .parse(form.get("method"));
    const reference = z.string().trim().max(180).parse(form.get("reference"));
    const notes = z.string().trim().max(700).parse(form.get("notes"));
    await transaction(async (c) => {
      const i = (
        await c.query<Invoice>(
          "SELECT * FROM invoices WHERE id=$1 FOR UPDATE",
          [invoiceId],
        )
      ).rows[0];
      if (!i || i.status !== "issued")
        throw new BillingError(
          "Payments can only be recorded for issued invoices.",
        );
      const previous = (
        await c.query("SELECT invoice_id FROM invoice_payments WHERE id=$1", [
          paymentId,
        ])
      ).rows[0];
      if (previous) {
        if (previous.invoice_id !== invoiceId)
          throw new BillingError("Payment reference conflict.");
        return;
      }
      const paid = Number(
        (
          await c.query(
            "SELECT COALESCE(sum(amount),0) AS paid FROM invoice_payments WHERE invoice_id=$1 AND reversed_at IS NULL",
            [invoiceId],
          )
        ).rows[0].paid,
      );
      if (amount > i.total - paid)
        throw new BillingError("Payment exceeds the remaining balance.");
      await c.query(
        "INSERT INTO invoice_payments(id,invoice_id,amount,paid_on,method,reference,notes,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
        [paymentId, invoiceId, amount, date, method, reference, notes, a.id],
      );
      await log(c, a.email, "Recorded invoice payment", invoiceId);
    });
    finish();
    return { success: "Payment recorded. The balance has been updated." };
  } catch (e) {
    return fail(e);
  }
}
export async function reversePayment(
  _: TeamResult,
  form: FormData,
): Promise<TeamResult> {
  const a = await requireAdmin(true);
  try {
    const paymentId = id(form.get("payment_id")),
      invoiceId = id(form.get("invoice_id"));
    const reason = z.string().trim().min(5).max(500).parse(form.get("reason"));
    await transaction(async (c) => {
      await c.query("SELECT id FROM invoices WHERE id=$1 FOR UPDATE", [
        invoiceId,
      ]);
      const r = await c.query(
        "UPDATE invoice_payments SET reversed_at=now(),reversal_reason=$3 WHERE id=$1 AND invoice_id=$2 AND reversed_at IS NULL RETURNING id",
        [paymentId, invoiceId, reason],
      );
      if (!r.rowCount)
        throw new BillingError("Payment is already reversed or unavailable.");
      await log(c, a.email, "Reversed payment: " + reason, invoiceId);
    });
    finish();
    return {
      success:
        "Payment reversed in the ledger. This does not transfer or refund money.",
    };
  } catch (e) {
    return fail(e);
  }
}
export async function voidInvoice(
  _: TeamResult,
  form: FormData,
): Promise<TeamResult> {
  const a = await requireAdmin(true);
  try {
    const invoiceId = id(form.get("id")),
      reason = z.string().trim().min(5).max(500).parse(form.get("reason"));
    await transaction(async (c) => {
      const i = (
        await c.query<Invoice>(
          "SELECT * FROM invoices WHERE id=$1 FOR UPDATE",
          [invoiceId],
        )
      ).rows[0];
      if (!i || i.status !== "issued")
        throw new BillingError("Only issued invoices can be voided.");
      const paid = Number(
        (
          await c.query(
            "SELECT COALESCE(sum(amount),0) AS paid FROM invoice_payments WHERE invoice_id=$1 AND reversed_at IS NULL",
            [invoiceId],
          )
        ).rows[0].paid,
      );
      if (paid)
        throw new BillingError(
          "Reverse recorded payments before voiding this invoice.",
        );
      const pending = (
        await c.query(
          "SELECT invoice_id FROM invoice_deliveries WHERE invoice_id=$1 AND status='pending'",
          [invoiceId],
        )
      ).rowCount;
      if (pending)
        throw new BillingError(
          "An email is pending. Resolve it before voiding.",
        );
      await c.query(
        "UPDATE invoices SET status='void',void_reason=$2,updated_at=now(),version=version+1 WHERE id=$1",
        [invoiceId, reason],
      );
      await log(c, a.email, "Voided invoice: " + reason, invoiceId);
    });
    finish();
    return { success: "Invoice voided. Its number and history are retained." };
  } catch (e) {
    return fail(e);
  }
}
export async function emailInvoice(
  _: TeamResult,
  form: FormData,
): Promise<TeamResult> {
  const a = await requireAdmin(true);
  const invoiceId = id(form.get("id"));
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM)
    return { error: "Configure the email service first." };
  if (/@resend\.dev\b/i.test(process.env.EMAIL_FROM))
    return {
      error:
        "Client email requires a verified sending domain. Download the PDF and share it manually for now.",
    };
  let attempt = "";
  try {
    if (form.get("confirmed") !== "on")
      throw new BillingError(
        "Confirm the recipient and attachment before sending.",
      );
    await transaction(async (c) => {
      const i = (
        await c.query<Invoice>(
          "SELECT * FROM invoices WHERE id=$1 FOR UPDATE",
          [invoiceId],
        )
      ).rows[0];
      if (!i || i.status !== "issued")
        throw new BillingError("Only issued invoices can be emailed.");
      const prior = (
        await c.query<{ status: string; attempt_id: string; updated_at: Date }>(
          "SELECT * FROM invoice_deliveries WHERE invoice_id=$1",
          [invoiceId],
        )
      ).rows[0];
      if (prior?.status === "sent")
        throw new BillingError("This invoice has already been sent.");
      if (prior?.status === "pending")
        throw new BillingError(
          "Sending is already in progress. Check the email log before trying again.",
        );
      attempt = prior?.attempt_id || randomUUID();
      await c.query(
        "INSERT INTO invoice_deliveries(invoice_id,attempt_id,recipient,status) VALUES($1,$2,$3,'pending') ON CONFLICT(invoice_id) DO UPDATE SET status='pending',error='',updated_at=now()",
        [invoiceId, attempt, i.client_snapshot.email],
      );
    });
    const i = (await getInvoice(invoiceId))!;
    const pdf = await invoicePdf(i);
    const result = await new Resend(process.env.RESEND_API_KEY).emails.send(
      {
        from: process.env.EMAIL_FROM,
        to: i.client_snapshot.email,
        replyTo: i.studio_snapshot.email,
        subject: `Invoice ${i.number} | Motion Mark Studio`,
        text: `Hi ${i.client_snapshot.name},\n\nPlease find attached invoice ${i.number} for ${i.title}.\nTotal: INR ${(i.total / 100).toFixed(2)}\nDue date: ${i.due_on}\n\n${i.studio_snapshot.paymentInstructions}\n\nThank you,\n${i.studio_snapshot.name}`,
        attachments: [
          { filename: `${i.number}.pdf`, content: Buffer.from(pdf) },
        ],
      },
      { idempotencyKey: `invoice-${attempt}` },
    );
    if (result.error)
      throw new BillingError(
        "The email service did not accept the invoice. Check the verified sender and recipient, then retry.",
      );
    await query(
      "UPDATE invoice_deliveries SET status='sent',provider_id=$2,error='',updated_at=now() WHERE invoice_id=$1",
      [invoiceId, result.data?.id],
    );
    await query(
      "INSERT INTO audit_log(id,actor,action,target) VALUES($1,$2,$3,$4)",
      [randomUUID(), a.email, "Emailed invoice", invoiceId],
    );
    finish();
    return {
      success:
        "Email accepted by the provider with the PDF attached. Acceptance does not confirm inbox delivery.",
    };
  } catch (e) {
    if (attempt)
      await query(
        "UPDATE invoice_deliveries SET status='failed',error='Email was not confirmed. Check provider logs before retrying.',updated_at=now() WHERE invoice_id=$1 AND status='pending'",
        [invoiceId],
      );
    finish();
    return fail(e);
  }
}
