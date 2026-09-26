# Verification and launch checklist

## Automated source checks

- TypeScript, ESLint, security/contact unit tests and production build.
- Tests cover exact contact hrefs, propagation after settings changes, malicious settings values, consent/enquiry validation, CSV formula escaping, file spoofing/size checks and unsafe content URLs.

## Public browser checks

- Load Home, Services, Work, About, Founders, Collaborations, Instagram, Videos, Contact, Privacy and Terms.
- Verify `tel:+919546960044`, `mailto:motionmarkstudio1@gmail.com` and `https://www.instagram.com/motionmark.studio/` in footer, Contact and enquiry CTA.
- Test dark/light switch, retained preference after navigation/reload, and initial system preference.
- Check 390 px mobile, 768 px tablet and desktop widths for overflow, navigation and form readability.
- Test the mobile menu and keyboard focus; enable reduced motion.
- Confirm unpublished project URL is 404, `/admin` redirects to sign-in, and admin API routes reject unauthenticated access.
- With missing Supabase credentials, submitting an enquiry must display an unavailable message and must not claim success.

## Live checks requiring supplied credentials (not yet run)

1. Apply the migration to the intended Supabase project. Confirm all six application tables have RLS enabled. Confirm anon and authenticated Data API reads/writes are denied, including `settings`, `admins` and `enquiries`.
2. Create owner and editor accounts. Verify owner can update contact settings; editor cannot. Verify disabled/deleted role loses access even with an existing auth session. Verify password change and session refresh.
3. Change the phone/email/Instagram handle in Admin. Verify all public routes and structured data update without deployment. Restore official details afterward.
4. Create a draft project with an uploaded image, confirm it is private, publish, verify filtering/case study/gallery/video, feature on Home, then archive and verify public removal. Check relevant service links and dynamic sitemap.
5. Upload valid image assets; reject spoofed, oversized and non-image assets. Confirm private enquiry files are inaccessible without login.
6. Submit a valid enquiry from the deployed origin with Turnstile completed. Confirm one saved record, studio notification to the saved contact email, client confirmation and correct reply-to addresses. No live test email was sent during development.
7. Retry the same request key and data; confirm it does not create a duplicate enquiry. Reject a changed payload with the same key.
8. Simulate provider failure and verify enquiry remains saved/pending, then retry the failed emails from Admin. Check the intended recipient snapshot is retained after a later contact-setting change.
9. Test rejected consent, malformed fields, unsafe file types, invalid/expired Turnstile, bad origin and rate-limit responses. Confirm the Turnstile widget resets after a failed attempt.
10. Update enquiry status, download its brief and export CSV; verify spreadsheet formula escaping.
11. Publish and archive a manual Instagram entry. Verify the homepage and Instagram page reflect its status without any Instagram API connection. Verify client profiles and hosted videos use supplied content.
12. Set the final SITE_URL, review metadata/sitemap/Open Graph, replace logo with approved original artwork, add actual content and arrange legal review. Test production HTTPS, image optimisation and Lighthouse. No numerical performance/accessibility score is claimed without measurement.

No live Supabase permissions, external email delivery or Meta integration can be certified until their credentials are configured.

## Results recorded during this build

- All 11 public pages returned HTTP 200 and contained all three exact official contact URLs.
- Unknown project returned 404. Admin redirected to login. Unauthenticated export and attachment requests returned 403.
- Bad-origin enquiry request returned 403. With no database configuration, enquiry returned 503; the browser displayed the unavailable message without clearing the entered brief or claiming success.
- Theme switching and persisted preference after navigation verified in the browser.
- Home inspected at 390, 768 and 1280 px; Contact inspected at 390 px. Measured page width matched viewport width, with no horizontal overflow.
- Mobile menu open/close and home navigation verified. Reduced-motion stylesheet disables animations/transitions.
- axe scan of Contact in light mode found one contrast issue, which was fixed. Repeat scan: zero WCAG A/AA violations detected. Home in mobile dark mode: zero detected. These limited scans are not a full accessibility certification.
- TypeScript, ESLint, seven automated tests and production compilation passed. No live database, provider delivery, production deployment or Instagram account was available to verify.
- Browser screenshots saved locally under `artifacts/` (excluded from source control).
