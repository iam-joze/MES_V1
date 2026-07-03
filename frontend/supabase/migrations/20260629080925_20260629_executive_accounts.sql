/*
# Create executive_accounts table

## Purpose
Stores executive user credentials so the login screen can authenticate
against the database rather than hard-coded mock values.

## Changes
- New table: executive_accounts
  - id: uuid primary key
  - full_name: text
  - email: text unique not null
  - password_hash: text (plain text for demo; hashed in production)
  - title: text (job title, e.g. "Plant Director")
  - is_active: boolean default true
  - created_at, last_login_at: timestamps

## Security
- RLS enabled
- anon + authenticated SELECT so the anon-key login query can validate credentials
- No INSERT/UPDATE/DELETE from the client (admin-managed table)

## Seed data
One default executive account: exec@dojohubug.com / exec2024
*/

CREATE TABLE IF NOT EXISTS executive_accounts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name     text NOT NULL,
  email         text UNIQUE NOT NULL,
  password      text NOT NULL,
  title         text NOT NULL DEFAULT 'Executive',
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  last_login_at timestamptz
);

ALTER TABLE executive_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "exec_anon_select" ON executive_accounts;
CREATE POLICY "exec_anon_select" ON executive_accounts FOR SELECT
  TO anon, authenticated USING (true);

-- Seed the default executive account
INSERT INTO executive_accounts (full_name, email, password, title)
VALUES ('Director General', 'exec@dojohubug.com', 'exec2024', 'Plant Director')
ON CONFLICT (email) DO NOTHING;
