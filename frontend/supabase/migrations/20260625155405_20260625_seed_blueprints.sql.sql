-- Seed data for the Mobile Operator Module (O1/O2)
-- Step 1: Insert blueprints and capture their IDs in a lookup table

-- Create a temporary lookup table to map blueprint names to IDs across migrations
CREATE TEMP TABLE bp_lookup AS
WITH inserted AS (
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
      'before_completion', null, null, null, null)
  RETURNING id, name
)
SELECT id, name FROM inserted;
