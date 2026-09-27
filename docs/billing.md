# Client and billing workspace

Founder Office → **Clients**, **Billing & invoices**, **Invoice settings**. All pages, server actions and PDF endpoints require an active founder. Supabase client roles have no access to the billing tables. Client profiles here are private internal records, separate from public collaboration content; this release does not create client login accounts.

## First invoice

1. In Invoice settings, enter the real business/legal name, full billing address, billing email, phone, payment instructions (bank or UPI details) and default terms. These fields appear on PDFs. They are separate from public website contact settings.
2. Add an active client with their billing contact, email and full address. Optional fields include Instagram handle, photo URL, bio and internal notes. Internal notes never appear on invoices.
3. Create an invoice from the client's profile or the billing register. Add a project title, dates, line items, whole-number quantities and INR rates. Add an optional fixed INR discount. The server calculates totals in integer paise.
4. Save the draft and download its PDF for review. Save a draft again after changing the client or studio profile to refresh its snapshot. Drafts have no invoice number and are not issued documents.
5. Review and issue. This assigns a unique `MMS-YYYY-NNNN` number and locks the snapshot, dates, line items and amounts. Invoice numbers are never reused for voided invoices.
6. Download the PDF. The email action shows the recipient and attachment and requires an explicit send confirmation. It is available after a verified Resend sender is configured. The `onboarding@resend.dev` sender cannot deliver client invoices. The website can remain on its Vercel domain.

## Payments and corrections

Payment recording is a manual ledger, not a payment gateway. Record only money actually received. The outstanding balance is calculated from non-reversed payments. Overpayments are rejected, repeated requests with the same payment ID are idempotent, and invoice-level locks protect concurrent updates. Statuses distinguish draft, unpaid, partially paid, overdue, paid and void. Overdue takes precedence over partial in the register; the balance still shows the unpaid amount.

To correct a payment, reverse the ledger entry with a reason. This preserves the record and does not refund money. To correct an issued invoice, reverse any payments as appropriate, void it with a reason, and create a new invoice. Do not void an invoice merely to remove a late payment. The application does not supply credit notes or automatic refunds.

Client archival preserves invoice history and blocks new draft saves until reactivation. Client changes never alter an already-issued invoice. PDF payment totals reflect the current payment ledger; its issued line items and identity snapshots remain fixed.

## Email behavior

No invoice is automatically emailed when a client or draft is saved or an invoice is issued. A founder must review the displayed recipient and click Email invoice. The PDF is attached directly; there is no unauthenticated invoice link. Provider acceptance is shown as such, not as confirmed inbox delivery. The email delivery row records the recipient, provider ID and status. Retrying uses an idempotency key. If sending is stuck pending, inspect Resend logs before changing the state or attempting delivery again.

## Initial limits

- INR only, whole-number quantities, up to 40 items and INR 1 crore per invoice.
- Tax disabled. This is not a GST tax-invoice implementation; GSTIN, place of supply, HSN/SAC, CGST/SGST/IGST and credit notes need a separate configured workflow before GST billing.
- No automated bank reconciliation, payment collection, recurring billing or customer portal.
- Client list and invoice register are paginated. A client profile shows its latest 100 invoices; the global register includes the full history.
- PDF fonts: Noto Sans (SIL Open Font License), embedded locally. The logo is rendered from the site's studio mark. Basic Latin, extended Latin, Greek and Cyrillic are supported by the bundled font; other writing systems need additional fonts.

## Verification

Unit coverage checks exact totals, invalid amounts, dates, limits, URL validation and derived payment states. Browser verification uses temporary clients/accounts and invoices, then removes them. It checks draft creation, PDF download, required billing identity, issuance, frozen client data, payment/reversal/void history, department denial and anonymous PDF denial. Database roles are also tested directly and Supabase security advisors are run.
