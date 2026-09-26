# Studio team dashboard

## Departments and access

The dashboard at `/admin` contains Videography, Photography, Editing, Social Media and Founder Office. Initial department roles are seeded once; founders can create and edit roles in Roles & permissions. Changes are checked on every server action/API request, not only in navigation.

Founder Office and the original owner have full access, including website analytics, employee administration, applicant decisions, settings, exports and audit logs. Original owner membership and the current user's membership cannot be suspended through the dashboard. A department role can grant website content editing, public media uploads, enquiry reading/managing, task creation and Drive links. Website content permissions are studio-wide; task and Drive access remain department-scoped. Staff may update their own assigned tasks without the task-management permission.

## Joining and offboarding

1. Share `/join`. An applicant submits their name, email, preferred department, portfolio and experience. No account or permission is granted on submission.
2. Founder Office receives a pending badge and request in Join requests. An open dashboard refreshes every 45 seconds while visible.
3. Review the applicant, select an actual department/role, and approve or decline. Approval creates a one-time invitation, shown only to the approving founder. No email is sent automatically; privately share the link with the verified applicant.
4. The recipient opens the link, sets a password and signs in. Invitations expire according to Supabase settings. Contact Founder Office for a new invitation if necessary.
5. Suspend employees to revoke dashboard access on their next request. Google Drive access must be removed separately in Google's sharing settings.

Team data, tasks, join requests and analytics have RLS enabled and no public client grants. Supabase authentication alone does not grant dashboard access: a matching active employee entry is mandatory.

## Google Drive: existing studio folder

Root folder: https://drive.google.com/drive/folders/1YHeocd7p8b2IUTqy4LsTVeum-N5ntOPU

The root link is visible only to Founder Office. Inside Google Drive, create subfolders for the five departments. Keep General access set to Restricted. Share the root only with founders; share each department subfolder with its own members' Google accounts. Access inherited from a shared parent cannot be removed by hiding a dashboard link, so do not share the root with the whole team.

In Founder Office → Drive library, paste each subfolder's sharing URL. Other departments see only their own saved link when their role has Drive access. These are authenticated dashboard links opening Google Drive; the website does not list, copy, upload or synchronize Drive contents and does not manage Google permissions.

## Optional Google sign-in

Email/password works without Google. To enable Google sign-in:

1. Create/select a Google Cloud project. Configure its OAuth consent screen and add an OAuth client of type Web application. Use your studio name and the production website's privacy URL.
2. Copy the exact callback URL from Supabase → Authentication → Sign In / Providers → Google into Google's Authorized redirect URIs. For this project it is `https://qmjxqvjoyeimvhcvbclo.supabase.co/auth/v1/callback`.
3. Paste Google's client ID and secret into the Google provider settings in Supabase. Keep the secret there, never in browser code or chat.
4. Set Supabase Site URL to `https://motion-mark-studio.vercel.app` and allow `https://motion-mark-studio.vercel.app/auth/callback` and `/admin/setup` as redirect URLs. Include localhost callback only for development.
5. Keep public signups disabled for this invitation-only workspace. Invite/approve employees before their first Google sign-in; they must use the same email as their approved account.
6. Set server-only `GOOGLE_LOGIN_ENABLED=true` in Vercel and redeploy. The login screen will show Continue with Google. Test with an approved employee and an unapproved account.

Google sign-in verifies identity; it does not grant Drive API access. Direct folder links need no Drive API credentials. Browsing/uploading files inside the website would be a separate integration using Google Picker and the narrow `drive.file` OAuth scope, with further configuration and verification as required by Google.

Official references:

- https://supabase.com/docs/guides/auth/social-login/auth-google
- https://developers.google.com/workspace/drive/api/guides/api-specific-auth
- https://developers.google.com/workspace/drive/picker/guides/overview

## Visitor statistics

Set a random server-only `ANALYTICS_SALT`. Public visitors choose whether to allow anonymous visit counts. Browser-tab identifiers are hashed with a daily salt; visit rows include only event ID, day, hashed session, public page path and time. Admin/auth routes, URL query parameters and raw IPs are excluded. A hashed IP is used separately for rate limiting. The collector ignores common bot user agents, deduplicates events and deletes visit rows older than 90 days on collection.

Only founders can query and view the last 30 days of page views, visits and top pages. Visits count browser-tab sessions per day, not distinct people. Declined consent, blockers and failures reduce totals. Figures start at deployment, with no fabricated historical data. Consent can be changed on Privacy.

## Setup and validation

Run `npm run db:migrate` after setting Supabase credentials to apply the idempotent migration and seed the roles. Configure a verified production database connection, deploy, then test an actual founder and restricted employee session. Google OAuth needs external provider configuration; Drive permissions must be tested using real Google accounts. The admin uploader accepts images, not raw MOV files.
