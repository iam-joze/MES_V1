export type BlueprintCategory =
  | 'preparation'
  | 'processing'
  | 'packaging'
  | 'quality_control';

export type ChecklistValidationTiming =
  | 'before_start'
  | 'before_completion'
  | 'both';

export type QuantityInputFrequency =
  | 'once'
  | 'hourly'
  | 'per_batch';

export type QCResponseType =
  | 'pass_fail'
  | 'numeric'
  | 'free_text';

export type FaultSeverity =
  | 'minor'
  | 'critical';

export interface Blueprint {
  id: string;
  name: string;
  description: string | null;
  category: BlueprintCategory;
  stationTag: string | null;
  estimatedDurationMinutes: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;

  // Feature toggles
  guidelinesEnabled: boolean;
  checklistEnabled: boolean;
  quantityLoggingEnabled: boolean;
  qcFormEnabled: boolean;
  faultCategoriesEnabled: boolean;

  // Configuration
  guidelinesContent: string | null;
  checklistValidationTiming: ChecklistValidationTiming | null;
  // Legacy single-metric fields (kept for backward compat; new blueprints use quantityMetrics)
  quantityUnitLabel: string | null;
  quantityMinValue: number | null;
  quantityMaxValue: number | null;
  quantityInputFrequency: QuantityInputFrequency | null;
}

export interface BlueprintQuantityMetric {
  id: string;
  blueprintId: string;
  metricName: string;
  unitLabel: string;
  minValue: number | null;
  maxValue: number | null;
  inputFrequency: QuantityInputFrequency;
  sortOrder: number;
}

export interface BlueprintChecklistItem {
  id: string;
  blueprintId: string;
  itemText: string;
  sortOrder: number;
  isRequired: boolean;
}

export interface BlueprintQCQuestion {
  id: string;
  blueprintId: string;
  questionText: string;
  responseType: QCResponseType;
  numericMinValue: number | null;
  numericMaxValue: number | null;
  numericTolerance: number | null;
  sortOrder: number;
  isRequired: boolean;
}

export interface BlueprintFaultCategory {
  id: string;
  blueprintId: string;
  faultName: string;
  severity: FaultSeverity;
  requiresPhoto: boolean;
  sortOrder: number;
}

export interface BlueprintAttachment {
  id: string;
  blueprintId: string;
  fileName: string;
  fileUrl: string;
  fileType: string | null;
  fileSize: number | null;
  sortOrder: number;
}

export interface BlueprintFormData {
  name: string;
  description: string;
  category: BlueprintCategory;
  stationTag: string;
  estimatedDurationMinutes: number;

  // Feature toggles
  guidelinesEnabled: boolean;
  checklistEnabled: boolean;
  quantityLoggingEnabled: boolean;
  qcFormEnabled: boolean;
  faultCategoriesEnabled: boolean;

  // Configuration
  guidelinesContent: string;
  checklistValidationTiming: ChecklistValidationTiming;
  checklistItems: Array<{ itemText: string; isRequired: boolean }>;

  // Multiple quantity metrics (replaces single-metric fields)
  quantityMetrics: Array<{
    metricName: string;
    unitLabel: string;
    minValue: number | null;
    maxValue: number | null;
    inputFrequency: QuantityInputFrequency;
  }>;

  qcQuestions: Array<{
    questionText: string;
    responseType: QCResponseType;
    numericMinValue: number | null;
    numericMaxValue: number | null;
    numericTolerance: number | null;
    isRequired: boolean;
  }>;
  faultCategories: Array<{
    faultName: string;
    severity: FaultSeverity;
    requiresPhoto: boolean;
  }>;
}
