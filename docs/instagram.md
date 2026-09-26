# Manual videos and client profiles

Instagram API fetching, connection settings, media-ID approval and token configuration have been removed. The site makes no Instagram API requests. Public profile links remain available.

## Supply content

Place original MOV files in `artifacts/content-inbox/videos/`, client portraits/logos in `artifacts/content-inbox/clients/`, and fill in `artifacts/content-inbox/clients.csv`. This inbox is excluded from Git and deployment. Use one row per video/client association.

MOV is an input/master format. Convert each supplied movie to a browser-compatible H.264/AAC MP4 (with fast-start metadata), prepare a poster image and captions as appropriate, and verify playback before publishing. Do not merely rename `.mov` to `.mp4`.

## Publish

- Host the optimized MP4/WebM on a video-capable host, then enter its HTTPS URL under Admin → Content library → video. The current admin uploader accepts images only, not video files.
- Add the title, description, category, poster image and related portfolio project slug. Mark featured to use as the main showreel.
- Create a project entry for its client and production details, linking the video URL.
- Under client/collaborator, enter the supplied name, biography, portrait/logo URL and full Instagram profile URL. Upload images through the admin image uploader.
- Optional instagram entries are manually entered thumbnails and links. Publishing or archiving controls visibility.

No Meta developer app, Instagram access token or client Instagram login is needed.
