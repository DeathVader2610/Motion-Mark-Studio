CREATE TABLE IF NOT EXISTS settings (key text PRIMARY KEY, value jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS content (id uuid PRIMARY KEY, kind text NOT NULL, slug text NOT NULL, title text NOT NULL, status text NOT NULL CHECK (status IN ('draft','published','archived')), data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(kind, slug));
CREATE TABLE IF NOT EXISTS admins (id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, email text UNIQUE NOT NULL, role text NOT NULL CHECK (role IN ('owner','editor')), created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS enquiries (id uuid PRIMARY KEY, request_key uuid UNIQUE NOT NULL, payload_hash text NOT NULL, data jsonb NOT NULL, status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','in-progress','closed')), attachment bytea, attachment_name text, attachment_type text, studio_sent boolean NOT NULL DEFAULT false, client_sent boolean NOT NULL DEFAULT false, notification_email text NOT NULL, contact_snapshot jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS rate_limits (key text PRIMARY KEY, count integer NOT NULL, expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS audit_log (id uuid PRIMARY KEY, actor text NOT NULL, action text NOT NULL, target text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS content_public ON content(kind, status);
CREATE INDEX IF NOT EXISTS enquiries_created ON enquiries(created_at DESC);
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
-- No browser/public SQL policies. The server connects as the table owner.
-- RLS denies access to non-owner database roles. Never expose DATABASE_URL to the browser.

REVOKE ALL ON settings,content,admins,enquiries,rate_limits,audit_log FROM anon,authenticated;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES ('portfolio','portfolio',true,3145728,ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT(id) DO NOTHING;
-- All writes use authenticated, server-authorised routes and the server-only service key.
-- The public portfolio bucket contains only intentionally published media, never enquiry briefs.
