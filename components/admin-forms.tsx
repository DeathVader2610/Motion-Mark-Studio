"use client";
import { useActionState } from "react";
import {
  saveContact,
  saveContent,
  login,
  retryEmail,
  changePassword,
  type Result,
} from "@/app/admin/actions";
import type { Contact } from "@/lib/contact";
import { contactLinks } from "@/lib/contact";
import type { Content } from "@/lib/schema";
export function Feedback({ state }: { state: Result }) {
  return (
    <>
      {state.error && (
        <p role="alert" className="form-error">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="form-success">
          {state.success}
        </p>
      )}
    </>
  );
}
export function LoginForm() {
  const [state, action, pending] = useActionState(login, {});
  return (
    <form action={action} className="login-form">
      <p className="eyebrow">BEHIND THE SCENES</p>
      <h1>Studio login.</h1>
      <p>Your space to shape the next chapter.</p>
      <label>
        Email
        <input name="email" type="email" autoComplete="username" required />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={256}
        />
      </label>
      <Feedback state={state} />
      <button className="button" disabled={pending}>
        {pending ? "Signing in…" : "Sign in ↗"}
      </button>
    </form>
  );
}
export function ContactSettings({ contact }: { contact: Contact }) {
  const [state, action, pending] = useActionState(saveContact, {});
  return (
    <form action={action} className="admin-panel">
      <h2>One studio. One source of truth.</h2>
      <p>
        These details appear in the footer, Contact page, enquiry sections and
        search metadata. New enquiry notifications go to the saved email
        address. Existing enquiries retain their original notification
        recipient.
      </p>
      <div className="form-grid">
        <label>
          Business phone
          <input name="phone" defaultValue={contact.phone} required />
        </label>
        <label>
          Business / notification email
          <input
            name="email"
            type="email"
            defaultValue={contact.email}
            required
          />
        </label>
        <label>
          Instagram handle
          <input
            name="instagramHandle"
            defaultValue={contact.instagramHandle}
            required
            pattern="@[a-zA-Z0-9._]{1,30}"
          />
        </label>
        <label>
          Studio location
          <input name="location" defaultValue={contact.location} required />
        </label>
        <label className="full">
          Business hours (optional)
          <input name="hours" defaultValue={contact.hours} />
        </label>
      </div>
      <p style={{ marginTop: 20 }}>
        Instagram URL is generated from the handle, without tracking parameters:{" "}
        {contactLinks(contact).instagram}
      </p>
      <Feedback state={state} />
      <button className="button" disabled={pending}>
        {pending ? "Saving…" : "Update website contact details ↗"}
      </button>
    </form>
  );
}
const labels: Record<string, string> = {
  description: "Description / bio / quote / page text",
  category: "Category / role",
  image: "Cover / portrait / logo image URL",
  video: "Video URL (YouTube, Vimeo, MP4 or WebM)",
  captions: "Caption file URL (.vtt, for hosted videos)",
  url: "External profile / Instagram link",
  client: "Client / collaborator name",
  brief: "Project brief / suitable client types",
  challenge: "Challenges",
  approach: "Creative approach / expertise",
  deliverables: "Deliverables / what’s included",
  outcome: "Final outcome",
  date: "Date",
  relatedSlug: "Related portfolio project slug",
  seoTitle: "SEO title",
  seoDescription: "SEO description",
};
export function ContentEditor({
  item,
  kind,
}: {
  item?: Content;
  kind: string;
}) {
  const [state, action, pending] = useActionState(saveContent, {});
  const fields =
    kind === "project"
      ? Object.keys(labels)
      : kind === "service"
        ? [
            "description",
            "brief",
            "deliverables",
            "category",
            "seoTitle",
            "seoDescription",
          ]
        : kind === "page"
          ? ["description", "seoTitle", "seoDescription"]
          : kind === "founder"
            ? [
                "description",
                "category",
                "image",
                "url",
                "imageAlt",
              ]
            : kind === "video"
              ? [
                  "description",
                  "category",
                  "image",
                  "video",
                  "captions",
                  "relatedSlug",
                ]
              : kind === "instagram"
                ? [
                    "description",
                    "category",
                    "image",
                    "url",
                    "date",
                    "client",
                    "relatedSlug",
                  ]
                : kind === "stat"
                  ? ["description"]
                  : ["description", "category", "image", "url", "relatedSlug"];
  return (
    <form action={action} className="admin-panel">
      <input type="hidden" name="kind" value={kind} />
      {item && <input type="hidden" name="id" value={item.id} />}
      <h2>
        {item ? "Edit" : "Add"} {kind}
      </h2>
      <div className="form-grid">
        <label>
          Title / name
          <input
            name="title"
            defaultValue={item?.title}
            required
            maxLength={180}
          />
        </label>
        <label>
          URL slug
          <input
            name="slug"
            defaultValue={item?.slug}
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            placeholder="a-story-worth-telling"
          />
        </label>
        <label>
          Status
          <select name="status" defaultValue={item?.status || "draft"}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={item?.data.featured}
          />
          <span>Feature on homepage / main showreel</span>
        </label>
        {fields.map((field) => (
          <label
            className={
              [
                "description",
                "brief",
                "challenge",
                "approach",
                "deliverables",
                "outcome",
              ].includes(field)
                ? "full"
                : ""
            }
            key={field}
          >
            {kind === "founder" ? ({description: "Biography", category: "Full role", image: "Portrait URL (upload above or use /founders/filename.jpg)", imageAlt: "Portrait description for accessibility", url: "Instagram profile URL (optional)"} as Record<string, string>)[field] : labels[field]}
            {[
              "description",
              "brief",
              "challenge",
              "approach",
              "deliverables",
              "outcome",
            ].includes(field) ? (
              <textarea
                name={field}
                defaultValue={String(
                  item?.data[field as keyof Content["data"]] || "",
                )}
                rows={field === "description" ? 5 : 3}
              />
            ) : (
              <input
                name={field}
                defaultValue={String(
                  item?.data[field as keyof Content["data"]] || "",
                )}
              />
            )}
          </label>
        ))}
        {kind === "founder" && <>
          <label className="full">Highlights (one per line)
            <textarea name="highlights" rows={3} defaultValue={item?.data.highlights?.join("\n")} />
          </label>
          <label>Display order (lower numbers appear first)
            <input type="number" name="sortOrder" min={0} max={999} defaultValue={item?.data.sortOrder ?? 100} />
          </label>
          <label>Portrait crop position
            <select name="portraitPosition" defaultValue={item?.data.portraitPosition || "top"}>
              <option value="top">Top</option><option value="center">Center</option><option value="bottom">Bottom</option>
            </select>
          </label>
          <p className="full">Published founders appear on the homepage and founders page. Leave the Instagram URL blank to hide the profile link. Experience highlights describe the individual, not the age of the studio.</p>
        </>}
        {kind === "project" && (
          <label className="full">
            Gallery image URLs (one per line)
            <textarea
              name="gallery"
              rows={4}
              defaultValue={item?.data.gallery?.join("\n")}
            />
          </label>
        )}
      </div>
      {(kind === "video" || kind === "project") && <p>Use a hosted MP4 or WebM for website playback. Original MOV files should be converted before publishing. Add the client name and link the matching portfolio project.</p>}
      {(kind === "client" || kind === "collaborator") && <p>Add the supplied client name, biography, profile picture URL and full Instagram profile URL. These details are managed here manually.</p>}
      <Feedback state={state} />
      <button className="button" disabled={pending}>
        {pending ? "Saving…" : "Save content ↗"}
      </button>
    </form>
  );
}
export function RetryEmail({ id }: { id: string }) {
  const [state, action, pending] = useActionState(retryEmail, {});
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <Feedback state={state} />
      <button disabled={pending} className="button small secondary">
        {pending ? "Sending…" : "Retry pending emails"}
      </button>
    </form>
  );
}
export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, {});
  return (
    <form action={action} className="admin-panel">
      <h2>Change password</h2>
      <div className="form-grid">
        <label>
          Current password
          <input
            type="password"
            name="current"
            required
            autoComplete="current-password"
            maxLength={256}
          />
        </label>
        <label>
          New password
          <input
            type="password"
            name="password"
            required
            minLength={14}
            maxLength={128}
            autoComplete="new-password"
          />
        </label>
      </div>
      <Feedback state={state} />
      <button disabled={pending} className="button">
        Update password and sign out
      </button>
    </form>
  );
}
