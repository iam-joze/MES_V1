export type ProcessStage =
  | 'washing'
  | 'pulping'
  | 'pasteurization'
  | 'mixing'
  | 'filling'
  | 'capping'
  | 'labeling';

export type StageStatus =
  | 'completed'
  | 'running'
  | 'available'
  | 'paused';

export type FaultSeverity =
  | 'critical'
  | 'minor';

export type AlertType =
  | 'fault'
  | 'paused'
  | 'unassigned';

export interface StageInfo {
  stage: ProcessStage;
  status: StageStatus;
  duration?: number;
}

export interface ActiveProductionJob {
  id: string;
  jobId: string;
  productName: string;
  productType: 'mango-juice' | 'pineapple-juice' | 'bottled-beverage' | 'packaged-food' | 'dairy';
  batch: string;
  stages: StageInfo[];
  currentStage: ProcessStage;
  progress: number;
  startTime: string;
  assignedOperators: string[];
}

export interface Alert {
  id: string;
  type: AlertType;
  severity?: FaultSeverity;
  title: string;
  description: string;
  line?: string;
  timestamp: string;
  isResolved: boolean;
}

export interface Operator {
  id: string;
  name: string;
  avatar?: string;
  activeAssignment: string;
  skills: string[];
  status: 'active' | 'on-break' | 'offline';
}

export interface ProductionKPI {
  todayOutput: number;
  todayTarget: number;
  productName: string;
  oee: number;
  oeeTrend: number[];
  activeJobs: number;
  completedJobs: number;
}

export * from './blueprint';
export * from './productionJob';

// Analytics types for Executive Dashboard
export type DowntimeReason =
  | 'machine_jam'
  | 'material_delay'
  | 'scheduled_maintenance'
  | 'quality_hold'
  | 'operator_break'
  | 'power_outage'
  | 'equipment_failure'
  | 'changeover';

export interface DowntimeRecord {
  id: string;
  lineName: string;
  reason: DowntimeReason;
  durationMinutes: number;
  occurredAt: string;
  notes: string | null;
}

export interface FaultRecord {
  id: string;
  lineName: string;
  title: string;
  description: string | null;
  severity: 'minor' | 'critical';
  category: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolutionNotes: string | null;
  loggedAt: string;
  operatorName: string | null;
}

export interface ScrapRecord {
  id: string;
  lineName: string;
  productType: string;
  ingredientName: string;
  quantityKg: number;
  reason: string | null;
  loggedAt: string;
}

export interface OperatorMetric {
  id: string;
  operatorId: string;
  operatorName: string;
  snapshotDate: string;
  tasksCompleted: number;
  tasksAssigned: number;
  avgTaskDurationMinutes: number | null;
  totalDowntimeCausedMinutes: number;
  faultsLogged: number;
  minorFaults: number;
  criticalFaults: number;
  primaryLine: string | null;
}

export interface JobStageAnalytic {
  id: string;
  jobId: string;
  jobName: string;
  productName: string | null;
  stageOrder: number;
  stageName: string;
  estimatedDurationMinutes: number | null;
  actualDurationMinutes: number | null;
  startedAt: string | null;
  completedAt: string | null;
  status: string;
  operatorName: string | null;
}

export interface AssignedManager {
  id: string;
  fullName: string;
  email: string;
}

// Production Line — physical manufacturing line (created by executive)
export interface ProductionLine {
  id: string;
  lineCode: string;
  name: string;
  description: string | null;
  productName: string | null;
  targetQuantity: number | null;
  unit: string;
  status: 'active' | 'inactive' | 'maintenance';
  createdAt: string;
  updatedAt: string;
  assignedManager: AssignedManager | null;
}

// Production Job — batch run (created by manager, linked to a line)
export interface ProductionJobCard {
  id: string;
  jobId: string;
  name: string;
  description: string | null;
  productName: string | null;
  targetQuantity: number;
  unit: string;
  targetDate: string | null;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  hasActiveWorkflow: boolean;
  progress?: number;
  createdAt: string;
  productionLineId: string | null;
  productionLineName: string | null;
}

// Legacy alias for backward compatibility
export type ProductionLineCard = ProductionJobCard;
