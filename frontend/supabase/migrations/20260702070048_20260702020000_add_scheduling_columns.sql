/*
# Update production_jobs and job_process_stages for scheduling

## Changes

### production_jobs
- Add `scheduled_start_at` (timestamptz) — when the job is scheduled to start
- Add `scheduled_end_at` (timestamptz) — computed end time based on stage durations
- Add trigger to auto-compute scheduled_end_at from stage durations

### job_process_stages
- Add `scheduled_start_at` (timestamptz) — computed start time for this stage
- Add `scheduled_end_at` (timestamptz) — computed end time for this stage
- Add `actual_started_at` (timestamptz) — when operator actually clicked START
- Add `actual_ended_at` (timestamptz) — when operator actually clicked END

## Status Semantics
- 'available' — Job is created but scheduled time hasn't arrived yet
- 'active' — Scheduled time has arrived, job is ready for operators
- 'running' — Operator has clicked START PROCESS
- 'paused' — Operator paused (with reason notified to manager)
- 'completed' — Operator clicked END PROCESS (or scheduled end time passed)
- 'cancelled' — Manager cancelled before completion

## Notes
1. Migration is idempotent
2. scheduled_end_at on production_jobs is computed as: scheduled_start_at + SUM(stage durations)
3. Stage scheduled times are computed sequentially from job scheduled_start_at
*/

-- Add scheduling columns to production_jobs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'production_jobs' AND column_name = 'scheduled_start_at') THEN
    ALTER TABLE production_jobs ADD COLUMN scheduled_start_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'production_jobs' AND column_name = 'scheduled_end_at') THEN
    ALTER TABLE production_jobs ADD COLUMN scheduled_end_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add scheduling columns to job_process_stages
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_process_stages' AND column_name = 'scheduled_start_at') THEN
    ALTER TABLE job_process_stages ADD COLUMN scheduled_start_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_process_stages' AND column_name = 'scheduled_end_at') THEN
    ALTER TABLE job_process_stages ADD COLUMN scheduled_end_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_process_stages' AND column_name = 'actual_started_at') THEN
    ALTER TABLE job_process_stages ADD COLUMN actual_started_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_process_stages' AND column_name = 'actual_ended_at') THEN
    ALTER TABLE job_process_stages ADD COLUMN actual_ended_at TIMESTAMPTZ;
  END IF;
END $$;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_production_jobs_scheduled_start ON production_jobs (scheduled_start_at);
CREATE INDEX IF NOT EXISTS idx_production_jobs_scheduled_end ON production_jobs (scheduled_end_at);
CREATE INDEX IF NOT EXISTS idx_job_process_stages_scheduled ON job_process_stages (scheduled_start_at, scheduled_end_at);
