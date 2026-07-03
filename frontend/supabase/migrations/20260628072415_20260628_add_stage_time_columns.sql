/*
# Add scheduled time window columns to job_process_stages

## Purpose
Capture the scheduled start and end time for each process stage so the
system can enforce that stages don't overlap or run beyond the fixed
production window.

## Changes
- ADD COLUMN scheduled_start_at TIMESTAMPTZ (nullable)
- ADD COLUMN scheduled_end_at   TIMESTAMPTZ (nullable)
- ADD COLUMN actual_start_at     TIMESTAMPTZ (nullable)  -- when operator actually begins
- ADD COLUMN actual_end_at       TIMESTAMPTZ (nullable)  -- when operator actually completes

## Safety
- All columns are nullable so existing rows are unaffected.
- No data is changed or deleted.
- No existing columns are altered or dropped.
*/

ALTER TABLE job_process_stages
  ADD COLUMN scheduled_start_at TIMESTAMPTZ,
  ADD COLUMN scheduled_end_at   TIMESTAMPTZ,
  ADD COLUMN actual_start_at    TIMESTAMPTZ,
  ADD COLUMN actual_end_at      TIMESTAMPTZ;
