export type WorkOrderStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type ProductionJobStatus =
  | 'draft'
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled';

export type ProcessStageStatus =
  | 'pending'
  | 'available'
  | 'running'
  | 'paused'
  | 'completed';

export interface WorkOrder {
  id: string;
  workOrderNumber: string;
  productName: string;
  targetQuantity: number;
  unit: string;
  status: WorkOrderStatus;
  erpReference?: string;
}

export interface JobProcessStage {
  id: string;
  blueprintId?: string;
  stageOrder: number;
  stageName: string;
  estimatedDurationMinutes: number;
  stationTag?: string;
  assignedOperatorId?: string;
  operatorName?: string;
  status: ProcessStageStatus;
  notes?: string;
  requiredSkills?: string[];
}

export interface ProductionJob {
  id: string;
  jobId: string;
  workOrderId?: string;
  workOrderNumber?: string;
  name: string;
  productName?: string;
  targetQuantity: number;
  unit: string;
  timeline?: string;
  status: ProductionJobStatus;
  notes?: string;
  stages: JobProcessStage[];
  createdAt: string;
  updatedAt: string;
}

export interface OperatorInfo {
  id: string;
  name: string;
  phone?: string;
  skills: string[];
  status: 'active' | 'on-break' | 'offline';
}
