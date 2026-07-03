/*
# Blueprint Quantity Metrics — Support Multiple Quantity Fields per Blueprint

## Summary
Replaces the single quantity logging configuration on each blueprint with a
dedicated child table that allows managers to define multiple quantity metrics
per blueprint (e.g., "Input Fruit kg", "Output Juice Liters", "Waste kg").

## New Tables

### blueprint_quantity_metrics
Stores one row per quantity metric configured on a blueprint.

Columns:
- `id` (uuid, PK)
- `blueprint_id` (uuid, FK → blueprints.id, cascade delete)
- `metric_name` (text) — e.g. "Input Material", "Juice Output", "Waste"
- `unit_label` (text) — e.g. "kg", "Liters", "Units"
- `min_value` (decimal, nullable) — lower bound for operator entry
- `max_value` (decimal, nullable) — upper bound for operator entry
- `input_frequency` (text) — once | hourly | per_batch
- `sort_order` (integer) — display order in operator view
- `created_at` (timestamptz)

## Security
- RLS enabled
- `TO anon, authenticated` on all policies — operators use PIN login (not Supabase auth)

## Notes
1. The original single-metric columns on `blueprints` (quantity_unit_label, quantity_min_value,
   quantity_max_value, quantity_input_frequency) are kept for backward compatibility.
2. When a blueprint has rows in this table, the operator module uses them instead of
   the legacy single-metric columns.
3. Managers can add, reorder, and remove metrics via the updated Blueprint Builder UI.
*/

CREATE TABLE IF NOT EXISTS blueprint_quantity_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  unit_label TEXT NOT NULL DEFAULT '',
  min_value DECIMAL,
  max_value DECIMAL,
  input_frequency TEXT NOT NULL DEFAULT 'per_batch'
    CHECK (input_frequency IN ('once', 'hourly', 'per_batch')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE blueprint_quantity_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_quantity_metrics" ON blueprint_quantity_metrics;
CREATE POLICY "select_quantity_metrics" ON blueprint_quantity_metrics FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_quantity_metrics" ON blueprint_quantity_metrics;
CREATE POLICY "insert_quantity_metrics" ON blueprint_quantity_metrics FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_quantity_metrics" ON blueprint_quantity_metrics;
CREATE POLICY "update_quantity_metrics" ON blueprint_quantity_metrics FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_quantity_metrics" ON blueprint_quantity_metrics;
CREATE POLICY "delete_quantity_metrics" ON blueprint_quantity_metrics FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_qty_metrics_blueprint_id
  ON blueprint_quantity_metrics (blueprint_id, sort_order);
