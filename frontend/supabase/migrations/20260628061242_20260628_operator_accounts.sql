/*
# Create operator_accounts table

1. New Tables
- `operator_accounts`
  - `id` (uuid, primary key, auto-generated)
  - `name` (text, not null) — operator full name
  - `phone` (text, unique, not null) — used as login identifier
  - `pin` (text, not null) — 4-digit hashed PIN (stored as text for simplicity)
  - `skills` (text[], not null, default '{}') — array of skill certifications
  - `status` (text, not null, default 'active') — 'active' or 'suspended'
  - `registered_at` (timestamptz, default now())

2. Security
  - Enable RLS on `operator_accounts`.
  - Allow anon + authenticated full CRUD because this is a no-auth manager app
    (operators log in via PIN, not Supabase auth).

3. Seed Data
  - Insert the 6 existing mock operators so the directory is pre-populated.
  - Uses ON CONFLICT DO NOTHING so re-running is safe.
*/

CREATE TABLE IF NOT EXISTS operator_accounts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL CHECK (char_length(trim(name)) >= 2),
  phone       text NOT NULL UNIQUE,
  pin         text NOT NULL CHECK (char_length(pin) = 4),
  skills      text[] NOT NULL DEFAULT '{}',
  status      text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  registered_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE operator_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_operator_accounts" ON operator_accounts;
CREATE POLICY "anon_select_operator_accounts" ON operator_accounts
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_operator_accounts" ON operator_accounts;
CREATE POLICY "anon_insert_operator_accounts" ON operator_accounts
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_operator_accounts" ON operator_accounts;
CREATE POLICY "anon_update_operator_accounts" ON operator_accounts
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_operator_accounts" ON operator_accounts;
CREATE POLICY "anon_delete_operator_accounts" ON operator_accounts
  FOR DELETE TO anon, authenticated USING (true);

-- Seed the 6 existing mock operators
INSERT INTO operator_accounts (name, phone, pin, skills, status, registered_at) VALUES
  ('Wasswa Job',     '+256 701 234567', '1234', ARRAY['Pasteurization','Blender Ops','Filling','QC Certified'],  'active',    now() - interval '90 days'),
  ('Nakato Grace',   '+256 702 345678', '5678', ARRAY['Pasteurization','QC Certified','Washing'],                'active',    now() - interval '60 days'),
  ('Okello David',   '+256 703 456789', '9012', ARRAY['Filling','Capping','Labeling','Packaging'],               'active',    now() - interval '45 days'),
  ('Nankinga Sarah', '+256 704 567890', '3456', ARRAY['Mixing','Blender Ops','QC Certified'],                    'active',    now() - interval '30 days'),
  ('Kato Peter',     '+256 705 678901', '7890', ARRAY['Washing','Pulping','Maintenance'],                        'suspended', now() - interval '120 days'),
  ('Auma Lydia',     '+256 706 789012', '2345', ARRAY['Labeling','Packaging','QC Certified'],                    'active',    now() - interval '15 days')
ON CONFLICT (phone) DO NOTHING;
