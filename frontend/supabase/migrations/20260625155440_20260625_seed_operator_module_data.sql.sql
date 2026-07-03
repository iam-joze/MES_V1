-- Seed data for the Mobile Operator Module (O1/O2)
-- Single migration: blueprints, checklist items, QC questions, fault categories, production jobs, process stages

DO $$
DECLARE
  v_bp_pulp UUID;
  v_bp_uht UUID;
  v_bp_fill UUID;
  v_bp_qc UUID;
  v_job_402 UUID;
  v_job_403 UUID;
  v_job_404 UUID;
  v_wo_1 UUID;
  v_wo_2 UUID;
  v_wo_3 UUID;
BEGIN
  -- Work order IDs
  SELECT id INTO v_wo_1 FROM work_orders WHERE work_order_number = 'WO-2024-001';
  SELECT id INTO v_wo_2 FROM work_orders WHERE work_order_number = 'WO-2024-002';
  SELECT id INTO v_wo_3 FROM work_orders WHERE work_order_number = 'WO-2024-003';

  -- Blueprints
  INSERT INTO blueprints (name, description, category, station_tag, estimated_duration_minutes, is_archived,
    guidelines_enabled, checklist_enabled, quantity_logging_enabled, qc_form_enabled, fault_categories_enabled,
    guidelines_content, checklist_validation_timing, quantity_unit_label, quantity_min_value, quantity_max_value, quantity_input_frequency)
  VALUES
    ('Mango Pulp Extraction', 'Core extraction of mango pulp from sorted fruit for juice production.', 'processing', 'Station B', 60, false,
      true, true, true, true, true,
      'Load prepared mangoes into the extraction chamber. Monitor auger pressure (target 2.5 bar). Collect pulp in sanitized 200L drums. Inspect sieve mesh for tears every 30 minutes.',
      'both', 'Liters', 100, 500, 'per_batch'),
    ('UHT Pasteurization', 'Ultra-high temperature pasteurization for juice sterilization.', 'processing', 'Station C', 90, false,
      true, true, true, true, true,
      'Pre-heat holding tube to 135C. Hold product at temperature for 3-5 seconds. Cool rapidly to 25C via heat exchanger. Log temperature curve every 15 minutes. Verify flow diversion valve operates correctly before start.',
      'before_completion', 'Liters', 200, 1000, 'hourly'),
    ('TetraPak Filling', 'Aseptic filling of pasteurized juice into TetraPak containers.', 'packaging', 'Station D', 45, false,
      true, true, true, true, true,
      'Verify sterile chamber integrity. Fill containers to 1000ml +/- 5ml. Seal and check seal integrity on every 10th unit. Monitor hydrogen peroxide bath concentration.',
      'both', 'Units', 0, null, 'hourly'),
    ('Quality Inspection Gate', 'Final quality control checkpoint before batch release.', 'quality_control', 'QC Station', 30, false,
      true, true, false, true, false,
      'Perform organoleptic testing (color, aroma, taste). Check pH (target 3.8-4.2), Brix (target 13-15), and viscosity. Approve or reject batch for release.',
      'before_completion', null, null, null, null);

  -- Capture each blueprint ID by name
  SELECT id INTO v_bp_pulp FROM blueprints WHERE name = 'Mango Pulp Extraction' LIMIT 1;
  SELECT id INTO v_bp_uht FROM blueprints WHERE name = 'UHT Pasteurization' LIMIT 1;
  SELECT id INTO v_bp_fill FROM blueprints WHERE name = 'TetraPak Filling' LIMIT 1;
  SELECT id INTO v_bp_qc FROM blueprints WHERE name = 'Quality Inspection Gate' LIMIT 1;

  -- Checklist items
  INSERT INTO blueprint_checklist_items (blueprint_id, item_text, sort_order, is_required) VALUES
    (v_bp_pulp, 'Wear cut-resistant gloves and safety goggles', 1, true),
    (v_bp_pulp, 'Verify auger pressure gauge reads zero before start', 2, true),
    (v_bp_pulp, 'Inspect sieve mesh for tears or damage', 3, true),
    (v_bp_pulp, 'Confirm sanitized 200L collection drums are staged', 4, true),
    (v_bp_pulp, 'Lock out adjacent Line 2 feed valve', 5, false),
    (v_bp_uht, 'Verify flow diversion valve operates correctly', 1, true),
    (v_bp_uht, 'Pre-heat holding tube to 135C and stabilize', 2, true),
    (v_bp_uht, 'Check heat exchanger seal integrity', 3, true),
    (v_bp_uht, 'Calibrate temperature data logger', 4, true),
    (v_bp_fill, 'Verify sterile chamber integrity seal', 1, true),
    (v_bp_fill, 'Check hydrogen peroxide bath concentration (35%)', 2, true),
    (v_bp_fill, 'Calibrate fill volume to 1000ml', 3, true),
    (v_bp_fill, 'Stage empty TetraPak cartons in feed hopper', 4, false),
    (v_bp_qc, 'Calibrate pH meter with buffer solutions', 1, true),
    (v_bp_qc, 'Verify Brix refractometer is clean and zeroed', 2, true),
    (v_bp_qc, 'Prepare organoleptic tasting panel samples', 3, true);

  -- QC questions
  INSERT INTO blueprint_qc_questions (blueprint_id, question_text, response_type, numeric_min_value, numeric_max_value, numeric_tolerance, sort_order, is_required) VALUES
    (v_bp_pulp, 'Pulp consistency within acceptable range?', 'pass_fail', null, null, null, 1, true),
    (v_bp_pulp, 'Sieve mesh inspection passed?', 'pass_fail', null, null, null, 2, true),
    (v_bp_uht, 'Holding temperature reached 135C?', 'pass_fail', null, null, null, 1, true),
    (v_bp_uht, 'Flow diversion valve test passed?', 'pass_fail', null, null, null, 2, true),
    (v_bp_uht, 'Record peak holding temperature (C)', 'numeric', 130, 140, 2, 3, true),
    (v_bp_fill, 'Seal integrity spot check passed?', 'pass_fail', null, null, null, 1, true),
    (v_bp_fill, 'Fill volume within tolerance?', 'pass_fail', null, null, null, 2, true),
    (v_bp_qc, 'pH within target range (3.8-4.2)?', 'pass_fail', null, null, null, 1, true),
    (v_bp_qc, 'Brix within target range (13-15)?', 'pass_fail', null, null, null, 2, true),
    (v_bp_qc, 'Organoleptic test passed (color, aroma, taste)?', 'pass_fail', null, null, null, 3, true);

  -- Fault categories
  INSERT INTO blueprint_fault_categories (blueprint_id, fault_name, severity, requires_photo, sort_order) VALUES
    (v_bp_pulp, 'Auger jam / blockage', 'critical', true, 1),
    (v_bp_pulp, 'Sieve mesh tear', 'minor', true, 2),
    (v_bp_pulp, 'Pump seal leak', 'minor', false, 3),
    (v_bp_uht, 'Temperature deviation > 5C', 'critical', false, 1),
    (v_bp_uht, 'Flow diversion valve failure', 'critical', true, 2),
    (v_bp_uht, 'Heat exchanger seal leak', 'minor', true, 3),
    (v_bp_fill, 'Fill volume out of tolerance', 'minor', false, 1),
    (v_bp_fill, 'Seal integrity failure', 'critical', true, 2),
    (v_bp_fill, 'H2O2 bath concentration low', 'minor', false, 3);

  -- Production jobs
  INSERT INTO production_jobs (job_id, work_order_id, name, product_name, target_quantity, unit, status, started_at)
  VALUES
    ('JOB-402', v_wo_1, 'Mango Juice Line A - Batch 12', 'Mango Juice 500ml', 5000, 'Bottles', 'active', now() - interval '3 hours'),
    ('JOB-403', v_wo_2, 'Pineapple Juice Line B - Batch 07', 'Pineapple Juice 1L', 3000, 'Cartons', 'active', now() - interval '5 hours'),
    ('JOB-404', v_wo_3, 'Mixed Fruit Juice - Batch 03', 'Mixed Fruit Juice 250ml', 8000, 'Bottles', 'paused', now() - interval '1 hour');

  SELECT id INTO v_job_402 FROM production_jobs WHERE job_id = 'JOB-402' LIMIT 1;
  SELECT id INTO v_job_403 FROM production_jobs WHERE job_id = 'JOB-403' LIMIT 1;
  SELECT id INTO v_job_404 FROM production_jobs WHERE job_id = 'JOB-404' LIMIT 1;

  -- Process stages
  INSERT INTO job_process_stages (job_id, blueprint_id, stage_order, stage_name, estimated_duration_minutes, station_tag, operator_name, status) VALUES
    -- JOB-402 (Mango) - operator assigned to pulp extraction (available)
    (v_job_402, v_bp_pulp, 1, 'Mango Pulp Extraction', 60, 'Station B', 'Wasswa Job', 'available'),
    (v_job_402, v_bp_uht, 2, 'UHT Pasteurization', 90, 'Station C', 'Wasswa Job', 'pending'),
    (v_job_402, v_bp_fill, 3, 'TetraPak Filling', 45, 'Station D', 'Wasswa Job', 'pending'),
    (v_job_402, v_bp_qc, 4, 'Quality Inspection Gate', 30, 'QC Station', 'Wasswa Job', 'pending'),
    -- JOB-403 (Pineapple) - operator on pasteurization (running)
    (v_job_403, v_bp_pulp, 1, 'Pineapple Pulp Extraction', 60, 'Station B', 'Nakato Grace', 'completed'),
    (v_job_403, v_bp_uht, 2, 'UHT Pasteurization', 90, 'Station C', 'Nakato Grace', 'running'),
    (v_job_403, v_bp_fill, 3, 'TetraPak Filling', 45, 'Station D', 'Nakato Grace', 'pending'),
    (v_job_403, v_bp_qc, 4, 'Quality Inspection Gate', 30, 'QC Station', 'Nakato Grace', 'pending'),
    -- JOB-404 (Mixed Fruit) - operator paused by emergency stop
    (v_job_404, v_bp_pulp, 1, 'Mixed Fruit Pulp Extraction', 60, 'Station B', 'Okello David', 'paused'),
    (v_job_404, v_bp_uht, 2, 'UHT Pasteurization', 90, 'Station C', 'Okello David', 'pending'),
    (v_job_404, v_bp_fill, 3, 'TetraPak Filling', 45, 'Station D', 'Okello David', 'pending'),
    (v_job_404, v_bp_qc, 4, 'Quality Inspection Gate', 30, 'QC Station', 'Okello David', 'pending');
END $$;
