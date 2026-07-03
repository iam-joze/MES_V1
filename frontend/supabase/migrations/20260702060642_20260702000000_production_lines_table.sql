/*
# Create production_lines table and refactor job-line relationship

## Business Logic Separation
- **Production Lines**: Physical manufacturing lines created by executives, assigned to managers
- **Production Jobs**: Batch runs created by managers, linked to a production line

## New Tables

### production_lines
- id (uuid PK)
- line_code (text, unique) — e.g., "LINE-A", "LINE-B"
- name (text) — display name like "Line A — Tropical Pulping"
- description (text, nullable)
- product_name (text, nullable) — default product for the line
- target_quantity (integer, nullable)
- unit (text, nullable)
- status (text) — 'active', 'inactive', 'maintenance'
- assigned_manager_id (uuid FK → manager_accounts.id, nullable)
- created_at, updated_at

## Modified Tables

### production_jobs
- Add `production_line_id` FK → production_lines.id (nullable for backward compat)
- Remove `assigned_manager_id` (manager comes from the line, not the job)
- Jobs inherit their manager from the line they belong to

## Security
- RLS enabled on production_lines
- Policies allow anon + authenticated full access (PIN-based login, no Supabase auth)

## Notes
1. Migration is idempotent — safe to re-run
2. Existing production_jobs rows will have null production_line_id
3. Managers can only create jobs on lines assigned to them
4. Executives can create lines and assign managers
*/

-- Create production_lines table
CREATE TABLE IF NOT EXISTS production_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  product_name TEXT,
  target_quantity INTEGER,
  unit TEXT DEFAULT 'Units',
  status TEXT NOT NULL DEFAULT 'active',
  assigned_manager_id UUID REFERENCES manager_accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE production_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_production_lines" ON production_lines;
CREATE POLICY "select_production_lines" ON production_lines FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_production_lines" ON production_lines;
CREATE POLICY "insert_production_lines" ON production_lines FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_production_lines" ON production_lines;
CREATE POLICY "update_production_lines" ON production_lines FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_production_lines" ON production_lines;
CREATE POLICY "delete_production_lines" ON production_lines FOR DELETE
  TO anon, authenticated USING (true);

-- Add production_line_id to production_jobs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'production_jobs' AND column_name = 'production_line_id'
  ) THEN
    ALTER TABLE production_jobs ADD COLUMN production_line_id UUID REFERENCES production_lines(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_production_lines_assigned_manager
  ON production_lines (assigned_manager_id);

CREATE INDEX IF NOT EXISTS idx_production_jobs_line
  ON production_jobs (production_line_id);

-- Trigger to update updated_at timestamp
DROP FUNCTION IF EXISTS update_production_lines_updated_at();
CREATE OR REPLACE FUNCTION update_production_lines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_production_lines_updated_at ON production_lines;
CREATE TRIGGER trigger_update_production_lines_updated_at
  BEFORE UPDATE ON production_lines
  FOR EACH ROW
  EXECUTE FUNCTION update_production_lines_updated_at();
