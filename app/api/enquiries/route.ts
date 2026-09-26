import { randomUUID, createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { enquirySchema } from "@/lib/schema";
import { getContact } from "@/lib/data";
import { query } from "@/lib/db";
import { rateLimit, hashToken, sameOrigin } from "@/lib/auth";
import { deliverEnquiry } from "@/lib/email";
import { boundedForm, validateBrief } from "@/lib/uploads";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  if (!process.env.DATABASE_URL)
    return NextResponse.json(
      {
        error:
          "Online enquiries are not available yet. Please contact us using the email, phone or WhatsApp links on this page.",
      },
      { status: 503 },
    );
  try {
    const ip = process.env.VERCEL
      ? request.headers.get("x-vercel-forwarded-for") || "unknown"
      : "local";
    if (!(await rateLimit(`enquiry:${hashToken(ip)}`, 5, 3600)))
      return NextResponse.json(
        { error: "Too many requests. Please call or email the studio." },
        { status: 429 },
      );
    const form = await boundedForm(request);
    if (form.get("companyWebsite"))
      return NextResponse.json(
        { error: "Unable to submit this enquiry." },
        { status: 400 },
      );
    const parsed = enquirySchema.safeParse({
      ...Object.fromEntries(form),
      consent: form.get("consent") === "on",
    });
    if (!parsed.success)
      return NextResponse.json(
        {
          error: parsed.error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; "),
        },
        { status: 400 },
      );
    if (process.env.TURNSTILE_SECRET_KEY) {
      const result = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          body: new URLSearchParams({
            secret: process.env.TURNSTILE_SECRET_KEY,
            response: String(form.get("cf-turnstile-response") || ""),
          }),
          signal: AbortSignal.timeout(10000),
        },
      );
      const verification = await result.json();
      const hostname =
        process.env.TURNSTILE_HOSTNAME ||
        new URL(process.env.SITE_URL || request.url).hostname;
      if (
        !verification.success ||
        verification.hostname !== hostname ||
        verification.action !== "enquiry"
      )
        return NextResponse.json(
          { error: "Please complete the spam check again." },
          { status: 400 },
        );
    } else if (process.env.NODE_ENV === "production")
      return NextResponse.json(
        {
          error:
            "Online enquiries are temporarily unavailable. Please email or call us.",
        },
        { status: 503 },
      );
    const file = form.get("brief");
    let attachment: Buffer | null = null;
    let name: string | null = null;
    let type: string | null = null;
    if (file instanceof File && file.size) {
      attachment = Buffer.from(await file.arrayBuffer());
      type = file.type;
      name = validateBrief(file.name, type, attachment);
    }
    const contact = await getContact();
    let id: string = randomUUID();
    const requestKey = String(form.get("requestKey") || "");
    if (
      !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(
        requestKey,
      )
    )
      return NextResponse.json(
        { error: "Invalid submission. Please reload the page." },
        { status: 400 },
      );
    const payloadHash = createHash("sha256")
      .update(JSON.stringify(parsed.data))
      .update(attachment || "")
      .digest("hex");
    const inserted = await query(
      "INSERT INTO enquiries(id,request_key,payload_hash,data,attachment,attachment_name,attachment_type,notification_email,contact_snapshot) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(request_key) DO NOTHING RETURNING id",
      [
        id,
        requestKey,
        payloadHash,
        JSON.stringify(parsed.data),
        attachment,
        name,
        type,
        contact.email,
        JSON.stringify(contact),
      ],
    );
    if (!inserted.length) {
      const [existing] = await query<{ id: string; payload_hash: string }>(
        "SELECT id,payload_hash FROM enquiries WHERE request_key=$1",
        [requestKey],
      );
      if (existing.payload_hash !== payloadHash)
        return NextResponse.json(
          {
            error: "This submission has changed. Please reload and try again.",
          },
          { status: 409 },
        );
      id = existing.id;
    }

    let emailed = false;
    try {
      emailed = await deliverEnquiry(id);
    } catch {
      console.error("Email pending for enquiry", id);
    }
    return NextResponse.json(
      {
        message: emailed
          ? "Your enquiry is with us. Check your inbox for a confirmation."
          : "Your enquiry has been saved. Email confirmation is pending; you can also reach us directly below.",
        id,
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error &&
      /Brief must|Upload a valid|Request too large/.test(error.message)
        ? error.message
        : "We couldn’t submit your enquiry. Please try again or contact us directly.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
