/*
# Seed sample production lines

Creates 5 sample production lines with different products and managers assigned.
This provides realistic data for the Executive and Manager dashboards.

## Lines Created
1. LINE-A — Tropical Pulping & Extraction (assigned to manager)
2. LINE-B — Juice Blending & Pasteurization (unassigned)
3. LINE-C — Bottling Line (assigned)
4. LINE-D — Quality Control Station (maintenance)
5. LINE-E — Packaging & Labeling (active)

## Notes
- Safe to re-run (uses ON CONFLICT DO NOTHING)
- manager_accounts must exist before lines can be assigned
*/

INSERT INTO production_lines (line_code, name, description, product_name, target_quantity, unit, status)
VALUES
  ('LINE-A', 'Line A — Tropical Pulping & Extraction', 'Primary washing, sorting, and extraction line processing fresh seasonal mangoes and pineapples.', 'Mango & Pineapple Concentrate', 5000, 'kg', 'active'),
  ('LINE-B', 'Line B — Juice Blending & Pasteurization', 'Secondary blending and thermal treatment of extracted fruit pulps for shelf-stable juice products.', 'Premium Fruit Juice Blend', 3000, 'L', 'active'),
  ('LINE-C', 'Line C — Automated Bottling', 'High-speed bottle filling and capping station with inline cap torque verification.', 'Bottled Fruit Beverage', 10000, 'Units', 'active'),
  ('LINE-D', 'Line D — Quality Control Station', 'Dedicated QC checkpoint for organoleptic testing, viscosity, and microbiological sampling.', 'QC Samples', 500, 'Units', 'maintenance'),
  ('LINE-E', 'Line E — Packaging & Labeling', 'End-of-line carton packing, shrink-wrapping, and date-coded labeling.', 'Retail Packaging', 8000, 'Cartons', 'active')
ON CONFLICT (line_code) DO NOTHING;
