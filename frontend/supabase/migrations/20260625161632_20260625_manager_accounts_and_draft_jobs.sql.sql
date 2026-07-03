-- Manager Accounts table for Executive Administration (E2)
CREATE TABLE manager_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  assigned_line TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_login_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE manager_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "select_manager_accounts" ON manager_accounts FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_manager_accounts" ON manager_accounts FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "update_manager_accounts" ON manager_accounts FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_manager_accounts" ON manager_accounts FOR DELETE
  TO authenticated USING (true);

-- Index
CREATE INDEX idx_manager_accounts_active ON manager_accounts(is_active);

-- Seed manager accounts
INSERT INTO manager_accounts (full_name, email, phone, assigned_line, is_active, created_at, last_login_at) VALUES
  ('Babirye Janet', 'janet.babirye@dojohubug.com', '+256 700 111 222', 'Line A - Mango Juice', true, now() - interval '90 days', now() - interval '2 hours'),
  ('Ssentongo Mark', 'mark.ssentongo@dojohubug.com', '+256 700 333 444', 'Line B - Pineapple Juice', true, now() - interval '60 days', now() - interval '30 minutes'),
  ('Okware James', 'james.okware@dojohubug.com', '+256 700 555 666', 'Line C - Mixed Fruit', true, now() - interval '45 days', now() - interval '1 day'),
  ('Nalwoga Susan', 'susan.nalwoga@dojohubug.com', '+256 700 777 888', null, true, now() - interval '15 days', null),
  ('Tumusiime Robert', 'robert.tumusiime@dojohubug.com', '+256 700 999 000', 'Line D - Dairy', false, now() - interval '120 days', now() - interval '30 days');

-- Add draft (unassigned) production jobs for "Lines Needing Attention"
INSERT INTO production_jobs (job_id, name, product_name, target_quantity, unit, status, notes) VALUES
  ('JOB-405', 'Mango Juice Line C - Batch 15', 'Mango Juice 500ml', 5000, 'Bottles', 'draft', 'Awaiting manager assignment'),
  ('JOB-406', 'Pineapple Juice Line D - Batch 02', 'Pineapple Juice 1L', 3000, 'Cartons', 'draft', 'Newly initialized — no manager assigned'),
  ('JOB-407', 'Mixed Fruit Juice - Batch 08', 'Mixed Fruit Juice 250ml', 8000, 'Bottles', 'draft', 'Pending line provisioning')
ON CONFLICT (job_id) DO NOTHING;
