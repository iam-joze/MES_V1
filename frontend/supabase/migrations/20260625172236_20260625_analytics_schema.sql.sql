-- Analytics Schema for Executive Dashboard (E3, E4, E5)

-- Downtime records for production lines
CREATE TABLE downtime_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_job_id UUID REFERENCES production_jobs(id),
  line_name TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('machine_jam', 'material_delay', 'scheduled_maintenance', 'quality_hold', 'operator_break', 'power_outage', 'equipment_failure', 'changeover')),
  duration_minutes INTEGER NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Fault records logged during production
CREATE TABLE fault_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_job_id UUID REFERENCES production_jobs(id),
  line_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('minor', 'critical')),
  category TEXT,
  resolved_at TIMESTAMPTZ,
  logged_at TIMESTAMPTZ NOT NULL,
  operator_id UUID,
  operator_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Scrap/waste records for material tracking
CREATE TABLE scrap_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_job_id UUID REFERENCES production_jobs(id),
  line_name TEXT NOT NULL,
  product_type TEXT NOT NULL,
  ingredient_name TEXT NOT NULL,
  quantity_kg DECIMAL(10,2) NOT NULL,
  reason TEXT,
  logged_at TIMESTAMPTZ NOT NULL,
  logged_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Operator performance snapshot (daily aggregates)
-- Note: No ranking or evaluative scores - only objective metrics
CREATE TABLE operator_metrics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL,
  operator_name TEXT NOT NULL,
  snapshot_date DATE NOT NULL,
  tasks_completed INTEGER DEFAULT 0,
  tasks_assigned INTEGER DEFAULT 0,
  avg_task_duration_minutes DECIMAL(10,2),
  total_downtime_caused_minutes INTEGER DEFAULT 0,
  faults_logged INTEGER DEFAULT 0,
  minor_faults INTEGER DEFAULT 0,
  critical_faults INTEGER DEFAULT 0,
  primary_line TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(operator_id, snapshot_date)
);

-- Historical job analytics with actual vs estimated timing
CREATE TABLE job_stage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_job_id UUID REFERENCES production_jobs(id),
  job_id TEXT NOT NULL,
  job_name TEXT NOT NULL,
  product_name TEXT,
  stage_order INTEGER NOT NULL,
  stage_name TEXT NOT NULL,
  estimated_duration_minutes INTEGER,
  actual_duration_minutes INTEGER,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL,
  operator_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE downtime_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE fault_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrap_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_metrics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_stage_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for downtime_records
CREATE POLICY "select_downtime_records" ON downtime_records FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_downtime_records" ON downtime_records FOR INSERT
  TO authenticated WITH CHECK (true);

-- RLS Policies for fault_records
CREATE POLICY "select_fault_records" ON fault_records FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_fault_records" ON fault_records FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "update_fault_records" ON fault_records FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies for scrap_records
CREATE POLICY "select_scrap_records" ON scrap_records FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_scrap_records" ON scrap_records FOR INSERT
  TO authenticated WITH CHECK (true);

-- RLS Policies for operator_metrics_daily
CREATE POLICY "select_operator_metrics" ON operator_metrics_daily FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_operator_metrics" ON operator_metrics_daily FOR INSERT
  TO authenticated WITH CHECK (true);

-- RLS Policies for job_stage_analytics
CREATE POLICY "select_job_analytics" ON job_stage_analytics FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_job_analytics" ON job_stage_analytics FOR INSERT
  TO authenticated WITH CHECK (true);

-- Indexes for analytics queries
CREATE INDEX idx_downtime_line ON downtime_records(line_name);
CREATE INDEX idx_downtime_date ON downtime_records(occurred_at);
CREATE INDEX idx_fault_line ON fault_records(line_name);
CREATE INDEX idx_fault_date ON fault_records(logged_at);
CREATE INDEX idx_scrap_line ON scrap_records(line_name);
CREATE INDEX idx_scrap_product ON scrap_records(product_type);
CREATE INDEX idx_scrap_date ON scrap_records(logged_at);
CREATE INDEX idx_operator_metrics_date ON operator_metrics_daily(snapshot_date);
CREATE INDEX idx_job_analytics_date ON job_stage_analytics(completed_at);