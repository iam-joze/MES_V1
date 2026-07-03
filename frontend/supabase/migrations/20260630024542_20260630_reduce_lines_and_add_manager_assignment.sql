/*
# Reduce Production Lines to 5 + Add Manager Assignment

## Summary
This migration consolidates the production_jobs table down to 5 representative
production lines and adds the ability to assign a manager to each line.

## Changes
1. New column: `production_jobs.assigned_manager_id` (uuid, nullable, references manager_accounts)
   - Tracks which manager is responsible for a given production line.
   - One manager per line (enforced at the application layer).
2. Data cleanup: delete all production_jobs EXCEPT 5 representative lines
   (JOB-402 through JOB-406), so the executive Production Lines view shows
   exactly 5 lines.
3. Assign existing managers to the 5 kept lines where appropriate.
4. RLS: the existing permissive policies on production_jobs already allow
   authenticated users full CRUD, so no policy changes are needed. The new
   column is covered by the existing UPDATE policy.

## Notes
- The 5 retained lines span active, paused, and draft statuses to keep the
  dashboard visually representative.
- job_process_stages rows referencing deleted production_jobs are removed
  automatically via ON DELETE CASCADE.
*/

-- 1. Add assigned_manager_id column to production_jobs
ALTER TABLE production_jobs
  ADD COLUMN IF NOT EXISTS assigned_manager_id UUID REFERENCES manager_accounts(id) ON DELETE SET NULL;

-- 2. Delete all production_jobs except the 5 representative lines
DELETE FROM production_jobs
  WHERE job_id NOT IN ('JOB-402', 'JOB-403', 'JOB-404', 'JOB-405', 'JOB-406');

-- 3. Assign managers to the retained lines
-- Babirye Janet  -> Line A (JOB-402)
-- Ssentongo Mark -> Line B (JOB-403)
-- Okware James   -> Line C (JOB-404, paused)
-- JOB-405 and JOB-406 remain unassigned (draft) so the executive can demo assignment
UPDATE production_jobs
  SET assigned_manager_id = (
    SELECT id FROM manager_accounts WHERE email = 'janet.babirye@dojohubug.com'
  )
  WHERE job_id = 'JOB-402';

UPDATE production_jobs
  SET assigned_manager_id = (
    SELECT id FROM manager_accounts WHERE email = 'mark.ssentongo@dojohubug.com'
  )
  WHERE job_id = 'JOB-403';

UPDATE production_jobs
  SET assigned_manager_id = (
    SELECT id FROM manager_accounts WHERE email = 'james.okware@dojohubug.com'
  )
  WHERE job_id = 'JOB-404';

-- 4. Sync manager_accounts.assigned_line text to match the 5 lines
UPDATE manager_accounts SET assigned_line = 'Line A - Mango Juice' WHERE email = 'janet.babirye@dojohubug.com';
UPDATE manager_accounts SET assigned_line = 'Line B - Pineapple Juice' WHERE email = 'mark.ssentongo@dojohubug.com';
UPDATE manager_accounts SET assigned_line = 'Line C - Mixed Fruit' WHERE email = 'james.okware@dojohubug.com';
UPDATE manager_accounts SET assigned_line = NULL WHERE email = 'susan.nalwoga@dojohubug.com';
UPDATE manager_accounts SET assigned_line = NULL WHERE email = 'robert.tumusiime@dojohubug.com';
