"use client";
import { useRef, useState } from "react";
import { Turnstile } from "./turnstile";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { enquirySchema } from "@/lib/schema";
export function EnquiryForm({ services }: { services: string[] }) {
  const [attempt, setAttempt] = useState(0);
  const submission = useRef({ key: "", fingerprint: "" });
  const [state, setState] = useState<{
    error?: string;
    message?: string;
    id?: string;
  }>({});
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const fingerprint = JSON.stringify(
      [...data.entries()]
        .filter(([k]) => k !== "cf-turnstile-response")
        .map(([k, v]) => [
          k,
          v instanceof File ? `${v.name}:${v.size}:${v.lastModified}` : v,
        ]),
    );
    if (submission.current.fingerprint !== fingerprint)
      submission.current = { key: crypto.randomUUID(), fingerprint };
    data.set("requestKey", submission.current.key);
    const parsed = enquirySchema.safeParse({
      ...Object.fromEntries(data),
      consent: data.get("consent") === "on",
    });
    if (!parsed.success) {
      setState({
        error: parsed.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      });
      return;
    }
    setPending(true);
    setState({});
    try {
      const result = await fetch("/api/enquiries", {
        method: "POST",
        body: data,
      });
      const body = await result.json();
      setState(body);
      if (result.ok) formRef.current?.reset();
    } catch {
      setState({
        error: "Could not connect. Please try again or contact us directly.",
      });
    } finally {
      setPending(false);
      setAttempt((n) => n + 1);
    }
  }
  return state.message ? (
    <div className="success-panel" role="status">
      <CheckCircle2 size={38} />
      <h2>A good beginning.</h2>
      <p>{state.message}</p>
      <small>Reference: {state.id}</small>
      <button
        className="text-link"
        onClick={() => {
          setState({});
          submission.current = { key: "", fingerprint: "" };
        }}
      >
        Send another enquiry <ArrowUpRight size={16} />
      </button>
    </div>
  ) : (
    <form ref={formRef} className="enquiry-form" onSubmit={submit}>
      <div className="form-heading">
        <span className="eyebrow">TELL US A LITTLE ABOUT IT</span>
        <span>* REQUIRED</span>
      </div>
      <div className="form-grid">
        <label>
          Full name *
          <input
            name="fullName"
            autoComplete="name"
            required
            minLength={2}
            maxLength={100}
            placeholder="Your name"
          />
        </label>
        <label>
          Business / brand
          <input
            name="business"
            autoComplete="organization"
            maxLength={150}
            placeholder="Your brand name"
          />
        </label>
        <label>
          Email address *
          <input
            name="email"
            autoComplete="email"
            type="email"
            required
            maxLength={254}
            placeholder="you@company.com"
          />
        </label>
        <label>
          Phone number *
          <input
            name="phone"
            autoComplete="tel"
            type="tel"
            required
            maxLength={25}
            placeholder="+91"
          />
        </label>
        <label>
          Preferred contact method *
          <select name="contactMethod" defaultValue="Email">
            <option>Email</option>
            <option>Phone</option>
            <option>WhatsApp</option>
          </select>
        </label>
        <label>
          Instagram / website URL
          <input
            name="website"
            type="url"
            placeholder="https://"
            maxLength={500}
          />
        </label>
        <label>
          Service you’re interested in *
          <select name="service" required defaultValue="">
            <option value="" disabled>
              Select a service
            </option>
            {services.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Project type *
          <input
            name="projectType"
            required
            maxLength={100}
            placeholder="A launch, an event, an ongoing partnership…"
          />
        </label>
        <label>
          Estimated budget *
          <select name="budget" defaultValue="Let’s discuss">
            {[
              "Let’s discuss",
              "Under ₹25,000",
              "₹25,000–₹50,000",
              "₹50,000–₹1 lakh",
              "₹1 lakh+",
            ].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Desired deadline
          <input name="deadline" type="date" />
        </label>
        <label className="full">
          Shoot / project location
          <input
            name="location"
            maxLength={200}
            placeholder="Where will the story happen?"
          />
        </label>
        <label className="full">
          Tell us about your project *
          <textarea
            name="description"
            required
            minLength={20}
            maxLength={5000}
            rows={5}
            placeholder="The idea, your goals, and anything else we should know…"
          />
        </label>
        <label className="full upload-label">
          Attach a brief <span>Optional · PDF, JPG or PNG · Max 3 MB</span>
          <input
            name="brief"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.setCustomValidity(
                file && file.size > 3 * 1024 * 1024
                  ? "Maximum file size is 3 MB."
                  : "",
              );
            }}
          />
        </label>
      </div>
      <div className="honeypot" aria-hidden="true">
        <label>
          Leave blank
          <input name="companyWebsite" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label className="checkbox-label">
        <input name="consent" type="checkbox" required />
        <span>
          I agree to be contacted about this enquiry and have read the{" "}
          <Link href="/privacy">Privacy Policy</Link>. *
        </span>
      </label>
      {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
        <Turnstile attempt={attempt} />
      )}
      {state.error && (
        <p role="alert" className="form-error">
          {state.error}
        </p>
      )}
      <button className="button" disabled={pending} type="submit">
        {pending ? "Sending your story…" : "Send your enquiry"}
        <ArrowUpRight size={18} />
      </button>
    </form>
  );
}
