import Link from "next/link";
import { TeamForm } from "@/components/dashboard/forms";
import { requestToJoin } from "@/app/admin/team-actions";
import { departments } from "@/lib/workspace";
export const metadata = {
  title: "Join the studio",
  robots: { index: false, follow: false },
};
export default function Join() {
  return (
    <section className="container section-space join-page">
      <p className="eyebrow">THE NEXT CHAPTER / TOGETHER</p>
      <h1>
        Make your mark.
        <br />
        <span className="serif">Join the studio.</span>
      </h1>
      <p>
        Tell us what you do best. Founder Office reviews every request and
        assigns the right department and role.
      </p>
      <TeamForm
        action={requestToJoin}
        label="Send join request ↗"
        className="admin-panel"
      >
        <div className="form-grid">
          <label>
            Full name
            <input
              name="name"
              required
              minLength={2}
              maxLength={100}
              autoComplete="name"
            />
          </label>
          <label>
            Email
            <input
              type="email"
              name="email"
              required
              maxLength={254}
              autoComplete="email"
            />
          </label>
          <label>
            Preferred department
            <select name="department">
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Portfolio link (optional)
            <input
              name="portfolio"
              type="url"
              placeholder="https://…"
              maxLength={500}
            />
          </label>
          <label className="full">
            About your experience
            <textarea
              name="message"
              required
              minLength={10}
              maxLength={2000}
              rows={5}
            />
          </label>
          <label className="honeypot" aria-hidden="true">
            Leave blank
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <p className="form-help">
          Your details are shared with Founder Office to review your
          application. Access is granted only after approval.{" "}
          <Link href="/privacy">Privacy notice</Link>
        </p>
      </TeamForm>
      <p>
        Already part of the team?{" "}
        <Link href="/admin/login" className="text-link">
          Studio login ↗
        </Link>
      </p>
    </section>
  );
}
