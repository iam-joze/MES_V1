/*
# Stage Quantity Logs — Multi-Batch Quantity Entry per Process Session

## Summary
Creates a log table so operators can submit multiple quantity entries (batches)
within a single process stage session. Each entry captures all configured
quantity metrics for that batch.

## New Tables

### stage_quantity_logs
One row per metric per batch entry per stage.

Columns:
- `id` (uuid, PK)
- `stage_id` (text) — stage identifier; TEXT not UUID FK to support both
  Supabase-persisted and ephemeral shared-state stage IDs
- `batch_number` (integer) — sequential batch counter within the stage session, starts at 1
- `metric_id` (text) — blueprint_quantity_metrics.id or a local ID string
- `metric_name` (text) — snapshot of the metric name at time of entry
- `unit_label` (text) — snapshot of the unit at time of entry
- `value` (decimal) — the quantity value entered by the operator
- `logged_at` (timestamptz) — when the operator submitted this batch
- `operator_name` (text, nullable)
- `stage_name` (text, nullable)
- `job_id` (text, nullable)
- `notes` (text, nullable) — optional operator note per batch
- `created_at` (timestamptz)

## Security
- RLS enabled
- `TO anon, authenticated` — operators use PIN login, not Supabase auth
- All four CRUD policies present

## Notes
1. To retrieve all entries for a stage: query WHERE stage_id = ? ORDER BY batch_number, logged_at
2. A single batch submission inserts N rows (one per metric). Group by batch_number to display
   a complete batch entry.
3. `stage_id` is TEXT to support ephemeral stage IDs from the Job Builder activation flow.
*/

CREATE TABLE IF NOT EXISTS stage_quantity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id TEXT NOT NULL,
  batch_number INTEGER NOT NULL DEFAULT 1,
  metric_id TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  unit_label TEXT NOT NULL DEFAULT '',
  value DECIMAL NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  operator_name TEXT,
  stage_name TEXT,
  job_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE stage_quantity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_quantity_logs" ON stage_quantity_logs;
CREATE POLICY "select_quantity_logs" ON stage_quantity_logs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_quantity_logs" ON stage_quantity_logs;
CREATE POLICY "insert_quantity_logs" ON stage_quantity_logs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_quantity_logs" ON stage_quantity_logs;
CREATE POLICY "update_quantity_logs" ON stage_quantity_logs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_quantity_logs" ON stage_quantity_logs;
CREATE POLICY "delete_quantity_logs" ON stage_quantity_logs FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_qty_logs_stage_id
  ON stage_quantity_logs (stage_id, batch_number, logged_at);

CREATE INDEX IF NOT EXISTS idx_qty_logs_job_id
  ON stage_quantity_logs (job_id);
