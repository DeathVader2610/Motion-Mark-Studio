# Motion Mark Studio

A responsive Next.js App Router website with TypeScript, Tailwind, Motion, **Supabase PostgreSQL, Supabase Auth, Supabase Storage**, and Resend. Vercel compatible.

## Run the preview

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. With no credentials, public pages show official contact information, the studio’s service offering and honest empty states. The preview does **not** save enquiries or allow admin login. It never pretends to send email. No Supabase project or external account has been created automatically.

## Connect Supabase

1. Create/select your Supabase project. Copy the project URL and publishable key into `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`.
2. From **Connect**, copy the transaction pooler PostgreSQL URL into `DATABASE_URL` for Vercel. Use a direct or session-pooler connection when applying migrations. Preserve provider TLS settings; do not disable certificate verification. Database passwords with reserved URL characters must be URL-encoded.
3. Set `SUPABASE_SERVICE_ROLE_KEY` on the server. This key provisions admin users and uploads portfolio assets. Never make it public.
4. Apply schema and seed services/contact defaults:

   ```sh
   npm run db:migrate
   ```

   The script reads `.env.local` and `.env`. The SQL migration is in `migrations/001_initial.sql`; it can also be run in Supabase’s SQL Editor, followed by `npm run db:migrate` to seed content. Re-running seeding never overwrites edited content or contact settings.

5. Disable public signups in Supabase Auth. Create your first owner locally:

   ```sh
   npm run admin:create -- motionmarkstudio1@gmail.com owner
   ```

   This provisions a Supabase Auth user without sending an email, assigns an application role, and prints a generated password once. Store it securely. Sign in at `/admin/login`, then change the password under **Account**. Additional users can be created with the `editor` role. If the email already exists in Supabase Auth, assign that user’s UUID in the `admins` table instead of creating a duplicate.

6. Set the Supabase Auth Site URL and allowed redirect URLs to your deployment domain. No public signup route is exposed.

Database access is server-side via Supabase’s PostgreSQL pooler. RLS is enabled on every application table, and `anon`/`authenticated` privileges are revoked. No table contents are exposed through the browser SDK. The database server connection uses the owner role; every admin action performs a verified Supabase Auth `getUser()` check plus a database-backed role check. Contact settings, notification retries, CSV export and Instagram approval require the owner role. Editors can maintain content and review enquiries. Revoking a user’s `admins` row immediately revokes application access.

Supabase Storage’s `portfolio` bucket is public for intentionally published images. Uploads use server-side authorisation, MIME/signature checks and a 3 MB limit. Client enquiry attachments are stored privately in PostgreSQL and downloaded only through authenticated routes, never in the public bucket.

## Contact details: one source of truth

Initial values in `lib/contact.ts` seed the `settings` row with key `contact`:

- Phone: **+91 9546960044** → `tel:+919546960044`
- Email: **motionmarkstudio1@gmail.com** → `mailto:motionmarkstudio1@gmail.com`
- Instagram: **@motionmark.studio** → `https://www.instagram.com/motionmark.studio/`
- Location: Jamshedpur, Jharkhand, India

Use **Admin → Contact settings** to update them. Footer, Contact page, enquiry CTAs, Instagram buttons, WhatsApp links, structured data and new email notifications read the same saved record. The Instagram URL is derived from the handle and cannot include tracking parameters. No recipient comes from a visitor’s request or browser input. Existing enquiries preserve their original contact snapshot and recipient, including email retries.

## Email and spam protection

Set `RESEND_API_KEY` and `EMAIL_FROM` using a sender on a domain verified with Resend. **The studio’s Gmail is the recipient/reply-to, not an unverified sending address.** For example, a verified `hello@yourdomain.com` sender can notify `motionmarkstudio1@gmail.com`.

Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, and `TURNSTILE_HOSTNAME` for your domain. Production submissions fail closed without Turnstile. Development can exercise validation without Turnstile. The server verifies the challenge hostname and action, uses a honeypot and database-backed rate limits, and bounds request bodies before parsing uploads. Vercel uses its platform-provided client-IP header; outside Vercel the rate limiter intentionally shares one bucket until you configure a trusted reverse-proxy IP source.

Enquiries are saved **before** email is attempted. The request key prevents repeated submissions from creating duplicate database records. Resend idempotency keys protect immediate delivery retries. Studio/client delivery flags are tracked separately. Missing credentials or provider failure leave a saved enquiry marked pending; owners can retry under **Admin → Enquiries**. There is no automatic email retry scheduler. Resend’s idempotency retention is limited, so review provider logs before retrying an ambiguous send older than 24 hours.

File briefs support PDF, JPG and PNG up to 3 MB, with filename, MIME and magic-byte validation. Attachments download as non-inline binary. Antivirus/content scanning is not included; treat incoming files as untrusted.

## Manage content

**Admin → Content library** supports drafts, published items and archives for:

- Projects: title, category, client, cover, brief, challenge, approach, deliverables, outcome, gallery, video, external link, related project and SEO.
- Services: descriptions, suitable client types, included deliverables and SEO.
- Clients and collaborators: name, category, portrait/logo, description, profile and project link.
- Founders: name, role, biography, portrait, expertise, Instagram and personal project link.
- Testimonials, homepage statistics, Instagram posts and videos.
- Pages: use `home`, `services`, `work`, `about`, `founders`, `collaborations`, `instagram`, `videos`, `contact`, `privacy`, `terms` for editable page SEO. `about` also customises the studio story; `privacy` and `terms` replace draft legal copy.

Use the upload control for public portfolio images; copy its returned Supabase URL into image/gallery fields. Videos use hosted HTTPS MP4/WebM, YouTube or Vimeo URLs. Mark a video featured to make it the main showreel; the homepage links to Videos. Keep files optimised; use the caption URL field for hosted WebVTT captions and the video provider’s caption controls for embeds. External video players load only after a visitor clicks. Do not upload private briefs into the public media bucket.

Feature projects on the homepage with the checkbox. Use matching service/category names to display related work on service pages. Dates, collaborator names and external links can be entered for manually approved Instagram stories. Archive to remove an entry from public pages without deleting its record. Audit timestamps are recorded for writes.

## Instagram

The optional integration uses the official Instagram API with Instagram Login, never scraping. See `docs/instagram.md` for account permissions, token configuration, explicit media approval, caching and manual fallback. No claim is made that every collaborative post is exposed by the API.

## Design and content status

Both themes follow the supplied monochrome brand direction, with warm neutrals, restrained motion, responsive layouts, semantic navigation and reduced-motion support. The logo in `public/mark.svg` is a hand-traced **vector interpretation** of the chat image, not the original uploaded bitmap. Replace this file with the approved original vector artwork for pixel-exact brand fidelity. No client logos, project imagery, testimonials, performance numbers, founder names or biographies were invented. Portfolio empty states are intentional. Founder biographies, individual experience highlights and original portraits were supplied by the studio. Run `npm run db:migrate` after configuring Supabase to seed both approved profiles without overwriting existing entries. Admin → founders edits names, roles, biographies, highlights, display order, portrait URL/alt text/crop and Instagram links. Blank Instagram URLs hide the profile buttons. Original portraits live in `public/founders/`.

Legal pages are editable drafts explicitly marked for professional review. No analytics or advertising cookies are enabled. Theme preference uses local storage and admin auth uses essential cookies. If analytics are later added, integrate consent before loading nonessential scripts.

## Deploy to Vercel

1. Push this source to a repository and import it into Vercel as Next.js.
2. Set the environment variables from `.env.example` in the intended environment. `SITE_URL` must be the final HTTPS origin; public environment variables must be present at build time.
3. Run the migration against the same Supabase project and provision the owner.
4. Configure Supabase Auth URLs, Turnstile allowed domains and a verified Resend sender.
5. Run checks below, deploy, then complete the live checks in `docs/testing.md`.

No Vercel deployment, production database migration or real email was performed during development because external credentials were not provided. The site remains preview-only until connected.

## Verification

```sh
npm run typecheck
npm run lint
npm run test
npm run build
```

`docs/testing.md` separates verified preview behaviour from checks requiring Supabase, Resend and Meta credentials. A successful production build verifies compilation, not live integration readiness.

## Key files

- `lib/contact.ts`: validated official defaults and link generation.
- `lib/data.ts`: shared server reads; honest read-only preview fallback.
- `lib/supabase.ts`, `proxy.ts`, `lib/auth.ts`: authentication, refresh and roles.
- `app/admin/actions.ts`: authorised CMS/contact mutations and revalidation.
- `app/api/enquiries/route.ts`: validation, spam checks, persistence and notifications.
- `lib/email.ts`: server-only Resend delivery with stored recipient snapshots.
- `migrations/001_initial.sql`: Supabase schema, RLS and media bucket.
