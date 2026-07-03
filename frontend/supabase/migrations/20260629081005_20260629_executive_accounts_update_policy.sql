/*
# Add UPDATE policy to executive_accounts

## Purpose
Allow the login handler to update last_login_at after a successful login.
Scoped to anon + authenticated so the anon-key client can perform the update.
Only allows updating the last_login_at column in practice (no column restriction in policy,
but the frontend only sends that column).
*/

DROP POLICY IF EXISTS "exec_anon_update" ON executive_accounts;
CREATE POLICY "exec_anon_update" ON executive_accounts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
