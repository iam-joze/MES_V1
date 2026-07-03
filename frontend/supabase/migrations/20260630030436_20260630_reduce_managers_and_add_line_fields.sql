/*
# Reduce to One Manager + Add Line Description & Target Date

## Summary
1. Deactivate all manager accounts except one (Babirye Janet) so the executive
   starts with a single manager and can create/test adding more.
2. Clear all production_jobs.assigned_manager_id so no line is pre-assigned
   (the executive will assign via the in-page picker).
3. Add two new columns to production_jobs:
   - `description` (text, nullable) — a longer description of the line.
   - `target_date` (date, nullable) — the target completion date for the line.
4. RLS: existing permissive policies already cover the new columns; no policy
   changes needed.

## Notes
- We keep Babirye Janet as the single active manager. All other managers are
  deactivated (is_active = false) and their assigned_line text is cleared.
- All 5 existing production lines have their assigned_manager_id set to null so
  the executive can demo the full assign flow from scratch.
*/

-- 1. Deactivate all managers except Babirye Janet; clear their assigned_line
UPDATE manager_accounts SET is_active = false, assigned_line = NULL
  WHERE email != 'janet.babirye@dojohubug.com';

-- Ensure Janet is active and her assigned_line text is cleared (will be set on assignment)
UPDATE manager_accounts SET is_active = true, assigned_line = NULL
  WHERE email = 'janet.babirye@dojohubug.com';

-- 2. Clear all production line manager assignments
UPDATE production_jobs SET assigned_manager_id = NULL;

-- 3. Add description and target_date columns to production_jobs
ALTER TABLE production_jobs
  ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE production_jobs
  ADD COLUMN IF NOT EXISTS target_date DATE;
