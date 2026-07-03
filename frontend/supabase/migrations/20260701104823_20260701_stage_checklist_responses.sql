/*
# Create stage_checklist_responses table

Persists operator checklist completion for each process stage. Supports validation
timing enforcement (before_start, before_completion, both) and manager audit trails.

## New Tables

### stage_checklist_responses
- id (uuid PK)
- stage_id (text) — supports both UUID Supabase rows and ephemeral shared-state IDs
- checklist_item_id (text) — blueprint checklist item ID
- item_text (text) — snapshot of item text at check time
- is_checked (boolean) — current check state
- checked_at (timestamptz, nullable) — when last checked; null when unchecked
- stage_name (text, nullable) — audit label
- operator_name (text, nullable) — who performed the check
- created_at (timestamptz)
- UNIQUE(stage_id, checklist_item_id)

## Security
RLS enabled. Policies use `TO anon, authenticated` because operators use PIN-based
login (not Supabase auth). The anon-key client must be able to read and write.
*/

CREATE TABLE IF NOT EXISTS stage_checklist_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id TEXT NOT NULL,
  checklist_item_id TEXT NOT NULL,
  item_text TEXT NOT NULL,
  is_checked BOOLEAN NOT NULL DEFAULT false,
  checked_at TIMESTAMPTZ,
  stage_name TEXT,
  operator_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(stage_id, checklist_item_id)
);

ALTER TABLE stage_checklist_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_checklist_responses" ON stage_checklist_responses;
CREATE POLICY "select_checklist_responses" ON stage_checklist_responses FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_checklist_responses" ON stage_checklist_responses;
CREATE POLICY "insert_checklist_responses" ON stage_checklist_responses FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_checklist_responses" ON stage_checklist_responses;
CREATE POLICY "update_checklist_responses" ON stage_checklist_responses FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_checklist_responses" ON stage_checklist_responses;
CREATE POLICY "delete_checklist_responses" ON stage_checklist_responses FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_checklist_responses_stage_id
  ON stage_checklist_responses (stage_id);
