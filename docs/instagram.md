# Instagram connection

1. Connect a professional Instagram account to a Meta developer app supporting **Instagram API with Instagram Login**. Obtain the permissions needed to read that account’s media (currently `instagram_business_basic` for this integration). Complete Meta approval requirements for your intended account/app mode. Verify the requirements in Meta’s current documentation before rollout.
2. Store a permitted account access token in `INSTAGRAM_ACCESS_TOKEN` and its numeric account ID in `INSTAGRAM_USER_ID`. Keep both server-side. Set a supported `INSTAGRAM_API_VERSION` (the supplied default is `v23.0`; confirm availability for your app).
3. The server fetches `/{account-id}/media` on `graph.instagram.com`, requesting id, caption, media type, media/thumbnail URL, permalink and timestamp. It reads up to the 24 latest accessible items, caches responses for 15 minutes and applies a 10-second request timeout.
4. Under **Admin → Instagram connection**, inspect fetched media IDs and save the IDs approved for the website. Only approved items appear publicly. A newly fetched item is never automatically published without approval.
5. Add collaboration names, dates, captions, thumbnails and permalinks manually using the Instagram content library if needed. Manual entries take precedence over matching API permalinks.
6. Meta’s API does not promise access to every coauthored post or a complete collaborator list. This implementation displays only fields actually returned and user-approved manual information.
7. A missing token uses the manual feed. Expired/invalid tokens or API errors fall back to published manual entries and an appropriate public empty/error state. Tokens and provider errors are never sent to the browser.
8. Token renewal is an operator task; automatic OAuth onboarding or scheduled renewal is not implemented. Rotate the environment token, redeploy/restart and allow the cache to expire. Monitor connection status in Admin.

The studio’s Instagram CTA always uses the clean profile URL derived from the central contact record.
