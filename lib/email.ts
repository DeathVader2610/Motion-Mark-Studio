import "server-only";
import { Resend } from "resend";
import { query } from "./db";
import { contactLinks, type Contact } from "./contact";
import type { EnquiryInput } from "./schema";
export async function deliverEnquiry(id: string) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return false;
  const [row] = await query<{
    data: EnquiryInput;
    notification_email: string;
    contact_snapshot: Contact;
    studio_sent: boolean;
    client_sent: boolean;
  }>(
    "SELECT data,notification_email,contact_snapshot,studio_sent,client_sent FROM enquiries WHERE id=$1",
    [id],
  );
  if (!row) throw new Error("Enquiry not found");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const details = Object.entries(row.data)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join("\n");
  if (!row.studio_sent) {
    const result = await resend.emails.send(
      {
        from: process.env.EMAIL_FROM,
        to: row.notification_email,
        replyTo: row.data.email,
        subject: `New project enquiry · ${row.data.fullName}`,
        text: `Motion Mark Studio\nNew enquiry: ${id}\n\n${details}\n\nReview the enquiry and any brief attachment in your secure admin dashboard.`,
      },
      { idempotencyKey: `studio-${id}` },
    );
    if (result.error) throw new Error("Notification delivery is pending");
    await query(
      "UPDATE enquiries SET studio_sent=true,updated_at=now() WHERE id=$1",
      [id],
    );
  }
  if (!row.client_sent) {
    const links = contactLinks(row.contact_snapshot);
    const result = await resend.emails.send(
      {
        from: process.env.EMAIL_FROM,
        to: row.data.email,
        replyTo: row.notification_email,
        subject: "Your next story starts here · Motion Mark Studio",
        text: `Hi ${row.data.fullName},\n\nThank you for reaching out to Motion Mark Studio. We’ve received your ${row.data.service} enquiry and will review your brief before getting in touch.\n\nReference: ${id}\n\nYou can reach us at ${row.notification_email} or ${row.contact_snapshot.phone}.\nInstagram: ${links.instagram}\n\nMotion Mark Studio\nStories in motion. Brands that leave a mark.`,
      },
      { idempotencyKey: `client-${id}` },
    );
    if (result.error) throw new Error("Confirmation delivery is pending");
    await query(
      "UPDATE enquiries SET client_sent=true,updated_at=now() WHERE id=$1",
      [id],
    );
  }
  return true;
}
