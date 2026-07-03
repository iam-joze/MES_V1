/*
# Fix RLS policies on production_jobs, job_process_stages, and work_orders

## Problem
The original migration scoped all RLS policies to `TO authenticated` only.
This app uses the anon key (no Supabase auth — operators log in via PIN,
managers via a mock credential). With `authenticated`-only policies, every
insert/update/delete from the frontend silently fails the RLS check because
the anon key has `auth.uid() = null`.

## Fix
Recreate all CRUD policies as `TO anon, authenticated` so the anon-key
client can read and write. This matches the no-auth pattern used by
operator_accounts and blueprints.

## Tables affected
- work_orders
- production_jobs
- job_process_stages

## Changes
- Drop and recreate 4 policies per table (select/insert/update/delete).
- No schema changes, no data changes, no column changes.
*/

-- ── work_orders ──────────────────────────────────────────────
DROP POLICY IF EXISTS "select_work_orders" ON work_orders;
CREATE POLICY "select_work_orders" ON work_orders
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_work_orders" ON work_orders;
CREATE POLICY "insert_work_orders" ON work_orders
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_work_orders" ON work_orders;
CREATE POLICY "update_work_orders" ON work_orders
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_work_orders" ON work_orders;
CREATE POLICY "delete_work_orders" ON work_orders
  FOR DELETE TO anon, authenticated USING (true);

-- ── production_jobs ──────────────────────────────────────────
DROP POLICY IF EXISTS "select_production_jobs" ON production_jobs;
CREATE POLICY "select_production_jobs" ON production_jobs
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_production_jobs" ON production_jobs;
CREATE POLICY "insert_production_jobs" ON production_jobs
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_production_jobs" ON production_jobs;
CREATE POLICY "update_production_jobs" ON production_jobs
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_production_jobs" ON production_jobs;
CREATE POLICY "delete_production_jobs" ON production_jobs
  FOR DELETE TO anon, authenticated USING (true);

-- ── job_process_stages ──────────────────────────────────────
DROP POLICY IF EXISTS "select_job_stages" ON job_process_stages;
CREATE POLICY "select_job_stages" ON job_process_stages
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_job_stages" ON job_process_stages;
CREATE POLICY "insert_job_stages" ON job_process_stages
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_job_stages" ON job_process_stages;
CREATE POLICY "update_job_stages" ON job_process_stages
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_job_stages" ON job_process_stages;
CREATE POLICY "delete_job_stages" ON job_process_stages
  FOR DELETE TO anon, authenticated USING (true);
