BEGIN;
CREATE TABLE IF NOT EXISTS clients (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, company text NOT NULL DEFAULT '',
 email text NOT NULL, phone text NOT NULL DEFAULT '', address text NOT NULL DEFAULT '',
 instagram text NOT NULL DEFAULT '', bio text NOT NULL DEFAULT '', photo text NOT NULL DEFAULT '',
 notes text NOT NULL DEFAULT '', active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS clients_email_idx ON clients(lower(email));
CREATE TABLE IF NOT EXISTS invoice_counters (year integer PRIMARY KEY, value integer NOT NULL CHECK(value>0));
CREATE TABLE IF NOT EXISTS invoices (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), client_id uuid NOT NULL REFERENCES clients(id),
 number text UNIQUE, status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','issued','void')),
 title text NOT NULL, issued_on date NOT NULL, due_on date NOT NULL CHECK(due_on>=issued_on),
 currency text NOT NULL DEFAULT 'INR' CHECK(currency='INR'), items jsonb NOT NULL,
 subtotal integer NOT NULL CHECK(subtotal>=0), discount integer NOT NULL DEFAULT 0 CHECK(discount>=0 AND discount<=subtotal),
 total integer NOT NULL CHECK(total=subtotal-discount AND total>0),
 client_snapshot jsonb NOT NULL, studio_snapshot jsonb NOT NULL,
 notes text NOT NULL DEFAULT '', terms text NOT NULL DEFAULT '', void_reason text NOT NULL DEFAULT '',
 version integer NOT NULL DEFAULT 1, created_by uuid REFERENCES admins(id),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK((status='draft' AND number IS NULL) OR (status IN ('issued','void') AND number IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS invoices_client_idx ON invoices(client_id,created_at DESC);
CREATE INDEX IF NOT EXISTS invoices_due_idx ON invoices(status,due_on);
CREATE TABLE IF NOT EXISTS invoice_payments (
 id uuid PRIMARY KEY, invoice_id uuid NOT NULL REFERENCES invoices(id), amount integer NOT NULL CHECK(amount>0),
 paid_on date NOT NULL, method text NOT NULL, reference text NOT NULL DEFAULT '',
 notes text NOT NULL DEFAULT '', reversed_at timestamptz, reversal_reason text NOT NULL DEFAULT '',
 created_by uuid REFERENCES admins(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS invoice_payments_invoice_idx ON invoice_payments(invoice_id);
CREATE TABLE IF NOT EXISTS invoice_deliveries (
 invoice_id uuid PRIMARY KEY REFERENCES invoices(id), attempt_id uuid NOT NULL DEFAULT gen_random_uuid(),
 recipient text NOT NULL, status text NOT NULL CHECK(status IN ('pending','sent','failed')),
 provider_id text, error text NOT NULL DEFAULT '', updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON clients,invoices,invoice_counters,invoice_payments,invoice_deliveries FROM anon,authenticated;
COMMIT;
