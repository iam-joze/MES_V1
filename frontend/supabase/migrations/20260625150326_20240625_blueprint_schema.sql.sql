-- Blueprint Management Schema for Dojo Hub Uganda MES

-- Main blueprints table
CREATE TABLE blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('preparation', 'processing', 'packaging', 'quality_control')),
  station_tag TEXT,
  estimated_duration_minutes INTEGER DEFAULT 0,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Feature toggles
  guidelines_enabled BOOLEAN DEFAULT false,
  checklist_enabled BOOLEAN DEFAULT false,
  quantity_logging_enabled BOOLEAN DEFAULT false,
  qc_form_enabled BOOLEAN DEFAULT false,
  fault_categories_enabled BOOLEAN DEFAULT false,

  -- Guidelines config (Panel A)
  guidelines_content TEXT,
  
  -- Checklist config (Panel B)
  checklist_validation_timing TEXT CHECK (checklist_validation_timing IN ('before_start', 'before_completion', 'both')),
  
  -- Quantity logging config (Panel C)
  quantity_unit_label TEXT,
  quantity_min_value DECIMAL,
  quantity_max_value DECIMAL,
  quantity_input_frequency TEXT CHECK (quantity_input_frequency IN ('once', 'hourly', 'per_batch')),
  
  CONSTRAINT valid_name CHECK (char_length(trim(name)) >= 3)
);

-- Checklist items for Panel B
CREATE TABLE blueprint_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  item_text TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- QC Questions for Panel D
CREATE TABLE blueprint_qc_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  response_type TEXT NOT NULL CHECK (response_type IN ('pass_fail', 'numeric', 'free_text')),
  -- For numeric type
  numeric_min_value DECIMAL,
  numeric_max_value DECIMAL,
  numeric_tolerance DECIMAL,
  sort_order INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Fault categories for Panel E
CREATE TABLE blueprint_fault_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  fault_name TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('minor', 'critical')),
  requires_photo BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Guideline attachments for Panel A
CREATE TABLE blueprint_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE blueprint_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE blueprint_qc_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE blueprint_fault_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blueprint_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blueprints
CREATE POLICY "select_blueprints" ON blueprints FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "insert_blueprints" ON blueprints FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "update_blueprints" ON blueprints FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "delete_blueprints" ON blueprints FOR DELETE
  TO authenticated USING (true);

-- RLS Policies for checklist items
CREATE POLICY "select_checklist_items" ON blueprint_checklist_items FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "insert_checklist_items" ON blueprint_checklist_items FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "update_checklist_items" ON blueprint_checklist_items FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "delete_checklist_items" ON blueprint_checklist_items FOR DELETE
  TO authenticated USING (true);

-- RLS Policies for QC questions
CREATE POLICY "select_qc_questions" ON blueprint_qc_questions FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "insert_qc_questions" ON blueprint_qc_questions FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "update_qc_questions" ON blueprint_qc_questions FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "delete_qc_questions" ON blueprint_qc_questions FOR DELETE
  TO authenticated USING (true);

-- RLS Policies for fault categories
CREATE POLICY "select_fault_categories" ON blueprint_fault_categories FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "insert_fault_categories" ON blueprint_fault_categories FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "update_fault_categories" ON blueprint_fault_categories FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "delete_fault_categories" ON blueprint_fault_categories FOR DELETE
  TO authenticated USING (true);

-- RLS Policies for attachments
CREATE POLICY "select_attachments" ON blueprint_attachments FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "insert_attachments" ON blueprint_attachments FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "delete_attachments" ON blueprint_attachments FOR DELETE
  TO authenticated USING (true);

-- Create indexes for performance
CREATE INDEX idx_blueprints_category ON blueprints(category);
CREATE INDEX idx_blueprints_archived ON blueprints(is_archived);
CREATE INDEX idx_checklist_blueprint ON blueprint_checklist_items(blueprint_id);
CREATE INDEX idx_qc_blueprint ON blueprint_qc_questions(blueprint_id);
CREATE INDEX idx_fault_blueprint ON blueprint_fault_categories(blueprint_id);
CREATE INDEX idx_attachments_blueprint ON blueprint_attachments(blueprint_id);
