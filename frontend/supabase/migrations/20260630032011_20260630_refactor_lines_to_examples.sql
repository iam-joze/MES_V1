/*
# Refactor Production Lines to Match Executive Examples

## Summary
Updates the 5 existing production lines to match the executive's example
specifications: descriptive line names, rich descriptions, target outputs,
and target dates.

## Changes
- JOB-402 -> Line A — Tropical Pulping & Extraction (mango/passion fruit, 5000 kg, Aug 15 2026)
- JOB-403 -> Line B — PET Bottle Blow-Mold & Fill (bottling, 12000 bottles, Aug 20 2026)
- JOB-404 -> Line C — Dairy Fluid Processing (pasteurization, 8000 L, Sep 01 2026)
- JOB-405 -> Line D — Thermal Evaporation & Concentration (pineapple concentrate, 3000 L, Sep 10 2026)
- JOB-406 -> Line E — Industrial Bulk Drum Fill (aseptic drums, 150 drums, Sep 18 2026)

All lines set to 'draft' status with no manager assigned so the executive
can demo the full assignment flow from scratch.
*/

UPDATE production_jobs SET
  name = 'Line A — Tropical Pulping & Extraction',
  description = 'Primary washing, sorting, and extraction line processing fresh seasonal mangoes from Luwero and passion fruits from Masaka.',
  product_name = 'Refined Fruit Concentrate',
  target_quantity = 5000,
  unit = 'kg',
  target_date = '2026-08-15',
  status = 'draft',
  assigned_manager_id = NULL
WHERE job_id = 'JOB-402';

UPDATE production_jobs SET
  name = 'Line B — PET Bottle Blow-Mold & Fill',
  description = 'Automated rinsing, carbonated/non-carbonated filling, capping, and batch packaging for retail-ready bottle sizes (300ml and 500ml).',
  product_name = 'Finished Bottles',
  target_quantity = 12000,
  unit = 'Bottles',
  target_date = '2026-08-20',
  status = 'draft',
  assigned_manager_id = NULL
WHERE job_id = 'JOB-403';

UPDATE production_jobs SET
  name = 'Line C — Dairy Fluid Processing',
  description = 'Reception of raw milk collection batches from Western Uganda cooperatives, fat standardization, UHT flash pasteurization, and vertical pouch sealing.',
  product_name = 'Pasteurized Milk Pouches',
  target_quantity = 8000,
  unit = 'Litres',
  target_date = '2026-09-01',
  status = 'draft',
  assigned_manager_id = NULL
WHERE job_id = 'JOB-404';

UPDATE production_jobs SET
  name = 'Line D — Thermal Evaporation & Concentration',
  description = 'Dedicated concentration line utilizing a vacuum evaporator to process high-volume pineapple pulp yields into bulk industrial-grade concentrate.',
  product_name = 'High-Brix Syrup Concentrate',
  target_quantity = 3000,
  unit = 'Litres',
  target_date = '2026-09-10',
  status = 'draft',
  assigned_manager_id = NULL
WHERE job_id = 'JOB-405';

UPDATE production_jobs SET
  name = 'Line E — Industrial Bulk Drum Fill',
  description = 'Heavy-duty packaging line focusing on filling, sanitizing, and vacuum-sealing 200-Litre aseptic drums meant for commercial B2B export contracts.',
  product_name = 'Aseptic Drums',
  target_quantity = 150,
  unit = 'Drums',
  target_date = '2026-09-18',
  status = 'draft',
  assigned_manager_id = NULL
WHERE job_id = 'JOB-406';
