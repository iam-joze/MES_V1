-- Add resolution fields to fault_records for tracking how faults were resolved
ALTER TABLE fault_records 
ADD COLUMN IF NOT EXISTS resolved_by TEXT,
ADD COLUMN IF NOT EXISTS resolution_notes TEXT;