-- Production Job Schema for Dojo Hub Uganda MES

-- Work orders (from ERP system reference)
CREATE TABLE work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_number TEXT NOT NULL UNIQUE,
  product_name TEXT NOT NULL,
  target_quantity INTEGER NOT NULL,
  unit TEXT DEFAULT 'Units',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  erp_reference TEXT
);

-- Production jobs
CREATE TABLE production_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL UNIQUE,
  work_order_id UUID REFERENCES work_orders(id),
  name TEXT NOT NULL,
  product_name TEXT,
  target_quantity INTEGER DEFAULT 0,
  unit TEXT DEFAULT 'Units',
  timeline TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id)
);

-- Process stages within jobs
CREATE TABLE job_process_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES production_jobs(id) ON DELETE CASCADE,
  blueprint_id UUID REFERENCES blueprints(id),
  stage_order INTEGER NOT NULL DEFAULT 0,
  stage_name TEXT NOT NULL,
  estimated_duration_minutes INTEGER DEFAULT 0,
  station_tag TEXT,
  assigned_operator_id UUID,
  operator_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'running', 'paused', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_process_stages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for work_orders
CREATE POLICY "select_work_orders" ON work_orders FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_work_orders" ON work_orders FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "update_work_orders" ON work_orders FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies for production_jobs
CREATE POLICY "select_production_jobs" ON production_jobs FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_production_jobs" ON production_jobs FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "update_production_jobs" ON production_jobs FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_production_jobs" ON production_jobs FOR DELETE
  TO authenticated USING (true);

-- RLS Policies for job_process_stages
CREATE POLICY "select_job_stages" ON job_process_stages FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_job_stages" ON job_process_stages FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "update_job_stages" ON job_process_stages FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_job_stages" ON job_process_stages FOR DELETE
  TO authenticated USING (true);

-- Indexes
CREATE INDEX idx_production_jobs_status ON production_jobs(status);
CREATE INDEX idx_production_jobs_work_order ON production_jobs(work_order_id);
CREATE INDEX idx_job_stages_job ON job_process_stages(job_id);
CREATE INDEX idx_job_stages_order ON job_process_stages(job_id, stage_order);

-- Insert sample work orders
INSERT INTO work_orders (work_order_number, product_name, target_quantity, unit, status) VALUES
  ('WO-2024-001', 'Mango Juice 500ml Bottles', 5000, 'Bottles', 'pending'),
  ('WO-2024-002', 'Pineapple Juice 1L Cartons', 3000, 'Cartons', 'pending'),
  ('WO-2024-003', 'Mixed Fruit Juice 250ml', 8000, 'Bottles', 'in_progress'),
  ('WO-2024-004', 'Dairy Yoghurt Cups', 4000, 'Cups', 'pending');