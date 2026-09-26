BEGIN;
CREATE TABLE IF NOT EXISTS departments (id text PRIMARY KEY, name text NOT NULL, drive_url text NOT NULL DEFAULT '', updated_at timestamptz NOT NULL DEFAULT now());
INSERT INTO departments(id,name) VALUES ('videography','Videography'),('photography','Photography'),('editing','Editing'),('social-media','Social Media'),('founder-office','Founder Office') ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS team_roles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, department_id text NOT NULL REFERENCES departments(id), permissions text[] NOT NULL DEFAULT '{}', UNIQUE(department_id,name), CHECK (permissions <@ ARRAY['content.edit','media.upload','enquiries.read','enquiries.manage','tasks.manage','drive.view']::text[]));
INSERT INTO team_roles(name,department_id,permissions) VALUES
('Lead Videographer','videography',ARRAY['tasks.manage','media.upload','drive.view']),('Videographer','videography',ARRAY['media.upload','drive.view']),
('Lead Photographer','photography',ARRAY['tasks.manage','media.upload','drive.view']),('Photographer','photography',ARRAY['media.upload','drive.view']),
('Lead Editor','editing',ARRAY['tasks.manage','media.upload','drive.view']),('Editor','editing',ARRAY['media.upload','drive.view']),
('Social Media Manager','social-media',ARRAY['tasks.manage','content.edit','media.upload','drive.view']),('Content Coordinator','social-media',ARRAY['drive.view']),
('Founder','founder-office','{}'),('Operations Lead','founder-office','{}') ON CONFLICT DO NOTHING;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS display_name text NOT NULL DEFAULT '';
ALTER TABLE admins ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS role_id uuid REFERENCES team_roles(id);
UPDATE admins SET role_id=(SELECT id FROM team_roles WHERE department_id='founder-office' AND name='Founder') WHERE role='owner' AND role_id IS NULL;
UPDATE admins SET role_id=(SELECT id FROM team_roles WHERE department_id='editing' AND name='Editor') WHERE role='editor' AND role_id IS NULL;
CREATE INDEX IF NOT EXISTS admins_role_idx ON admins(role_id);
CREATE TABLE IF NOT EXISTS join_requests (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, email text NOT NULL, department_id text NOT NULL REFERENCES departments(id), portfolio text NOT NULL DEFAULT '', message text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')), decision_note text NOT NULL DEFAULT '', reviewed_by uuid REFERENCES admins(id), reviewed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
CREATE UNIQUE INDEX IF NOT EXISTS join_pending_email ON join_requests(lower(email)) WHERE status='pending';
CREATE INDEX IF NOT EXISTS join_status_created ON join_requests(status,created_at DESC);
CREATE TABLE IF NOT EXISTS team_tasks (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, description text NOT NULL DEFAULT '', department_id text NOT NULL REFERENCES departments(id), assignee_id uuid REFERENCES admins(id) ON DELETE SET NULL, created_by uuid REFERENCES admins(id), status text NOT NULL DEFAULT 'todo' CHECK(status IN ('todo','in-progress','review','done')), priority text NOT NULL DEFAULT 'normal' CHECK(priority IN ('normal','high','urgent')), due_date date, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS tasks_department ON team_tasks(department_id,status,due_date);
CREATE INDEX IF NOT EXISTS tasks_assignee ON team_tasks(assignee_id);
CREATE TABLE IF NOT EXISTS announcements (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, body text NOT NULL, department_id text REFERENCES departments(id), created_by uuid REFERENCES admins(id), created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS announcements_department ON announcements(department_id,created_at DESC);
CREATE TABLE IF NOT EXISTS site_visits (event_id uuid PRIMARY KEY, day date NOT NULL DEFAULT current_date, visitor_hash text NOT NULL, path text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS visits_day ON site_visits(day,visitor_hash);
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON departments,team_roles,join_requests,team_tasks,announcements,site_visits FROM anon,authenticated;
COMMIT;
