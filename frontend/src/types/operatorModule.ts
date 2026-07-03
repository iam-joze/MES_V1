// Types for the Mobile Operator Module (O1/O2)

export type OperatorStageStatus = 'available' | 'running' | 'paused' | 'completed' | 'pending';

export type EmergencyState = 'none' | 'paused_by_operator' | 'paused_by_emergency_stop';

export interface QuantityMetric {
  id: string;
  metricName: string;
  unitLabel: string;
  minValue: number | null;
  maxValue: number | null;
  inputFrequency: string;
  sortOrder: number;
}

export interface BatchQuantityEntry {
  metricId: string;
  metricName: string;
  unitLabel: string;
  value: number;
}

export interface BatchQuantityLog {
  id: string;
  batchNumber: number;
  entries: BatchQuantityEntry[];
  notes: string;
  loggedAt: string;
}

export interface OperatorProcessStage {
  id: string;
  stageName: string;
  stageOrder: number;
  stationTag: string;
  estimatedDurationMinutes: number;
  operatorName: string;
  status: OperatorStageStatus;
  // Parent job
  jobId: string;
  jobName: string;
  productName: string;
  // Blueprint template
  blueprintId: string | null;
  blueprintName: string | null;
  guidelinesEnabled: boolean;
  guidelinesContent: string | null;
  checklistEnabled: boolean;
  checklistValidationTiming: string | null;
  quantityLoggingEnabled: boolean;
  // Legacy single-metric fields (kept for backward compat)
  quantityUnitLabel: string | null;
  quantityMinValue: number | null;
  quantityMaxValue: number | null;
  qcFormEnabled: boolean;
  faultCategoriesEnabled: boolean;
  // Scheduling
  scheduledStartAt: string | null;
  scheduledEndAt: string | null;
}

export interface ChecklistItem {
  id: string;
  itemText: string;
  sortOrder: number;
  isRequired: boolean;
}

export interface QCQuestion {
  id: string;
  questionText: string;
  responseType: 'pass_fail' | 'numeric' | 'free_text';
  numericMinValue: number | null;
  numericMaxValue: number | null;
  numericTolerance: number | null;
  sortOrder: number;
  isRequired: boolean;
}

export interface FaultCategory {
  id: string;
  faultName: string;
  severity: 'minor' | 'critical';
  requiresPhoto: boolean;
  sortOrder: number;
}

export interface RuntimeStageDetail extends OperatorProcessStage {
  checklistItems: ChecklistItem[];
  qcQuestions: QCQuestion[];
  faultCategories: FaultCategory[];
  quantityMetrics: QuantityMetric[];
}
