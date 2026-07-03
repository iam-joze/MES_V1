-- Allow anon to SELECT manager_accounts (needed for login phone lookup)
DROP POLICY IF EXISTS "select_manager_accounts" ON manager_accounts;
CREATE POLICY "select_manager_accounts" ON manager_accounts
  FOR SELECT TO anon, authenticated USING (true);

-- Allow anon to UPDATE manager_accounts (needed to record last_login_at)
DROP POLICY IF EXISTS "update_manager_accounts" ON manager_accounts;
CREATE POLICY "update_manager_accounts" ON manager_accounts
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
