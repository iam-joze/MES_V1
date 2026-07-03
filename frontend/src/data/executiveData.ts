import { supabase } from '../lib/supabase';
import type {
  DowntimeRecord,
  FaultRecord,
  ScrapRecord,
  OperatorMetric,
  JobStageAnalytic,
  ProductionLine,
  ProductionJobCard,
} from '../types';

export interface ManagerAccount {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  assignedLine: string | null;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

// Unassigned line (draft status, no manager)
export interface UnassignedLine {
  id: string;
  jobId: string;
  name: string;
  productName: string;
  targetQuantity: number;
  unit: string;
  notes: string | null;
  createdAt: string;
}

// ============================================================
// Manager Account Functions
// ============================================================

export async function fetchManagerAccounts(): Promise<ManagerAccount[]> {
  const { data, error } = await supabase
    .from('manager_accounts')
    .select('id, full_name, email, phone, assigned_line, is_active, created_at, last_login_at')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((r: any) => ({
    id: r.id,
    fullName: r.full_name,
    email: r.email,
    phone: r.phone,
    assignedLine: r.assigned_line,
    isActive: r.is_active,
    createdAt: r.created_at,
    lastLoginAt: r.last_login_at,
  }));
}

export interface NewManagerPayload {
  fullName: string;
  email: string;
  phone: string;
  assignedLine: string | null;
}

export async function addManagerAccount(payload: NewManagerPayload): Promise<ManagerAccount> {
  const { data, error } = await supabase
    .from('manager_accounts')
    .insert({
      full_name: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      assigned_line: payload.assignedLine || null,
      is_active: true,
    })
    .select('id, full_name, email, phone, assigned_line, is_active, created_at, last_login_at')
    .single();

  if (error) throw error;

  return {
    id: data.id,
    fullName: data.full_name,
    email: data.email,
    phone: data.phone,
    assignedLine: data.assigned_line,
    isActive: data.is_active,
    createdAt: data.created_at,
    lastLoginAt: data.last_login_at,
  };
}

export async function deactivateManagerAccount(id: string): Promise<void> {
  const { error } = await supabase
    .from('manager_accounts')
    .update({ is_active: false })
    .eq('id', id);
  if (error) throw error;
}

// ============================================================
// Production Line Functions (physical manufacturing lines)
// ============================================================

// Fetch all production lines (for executive matrix view)
export async function fetchProductionLines(): Promise<ProductionLine[]> {
  const { data, error } = await supabase
    .from('production_lines')
    .select(`
      id, line_code, name, description, product_name, target_quantity, unit, status, created_at, updated_at,
      assigned_manager:assigned_manager_id(id, full_name, email)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((r: any) => ({
    id: r.id,
    lineCode: r.line_code,
    name: r.name,
    description: r.description,
    productName: r.product_name,
    targetQuantity: r.target_quantity,
    unit: r.unit,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    assignedManager: r.assigned_manager
      ? { id: r.assigned_manager.id, fullName: r.assigned_manager.full_name, email: r.assigned_manager.email }
      : null,
  }));
}

// Fetch lines assigned to a specific manager
export async function fetchLinesForManager(managerId: string): Promise<ProductionLine[]> {
  const { data, error } = await supabase
    .from('production_lines')
    .select(`
      id, line_code, name, description, product_name, target_quantity, unit, status, created_at, updated_at,
      assigned_manager:assigned_manager_id(id, full_name, email)
    `)
    .eq('assigned_manager_id', managerId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((r: any) => ({
    id: r.id,
    lineCode: r.line_code,
    name: r.name,
    description: r.description,
    productName: r.product_name,
    targetQuantity: r.target_quantity,
    unit: r.unit,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    assignedManager: r.assigned_manager
      ? { id: r.assigned_manager.id, fullName: r.assigned_manager.full_name, email: r.assigned_manager.email }
      : null,
  }));
}

// Create a new production line (executive only)
export interface NewProductionLinePayload {
  lineCode: string;
  name: string;
  description?: string;
  productName?: string;
  targetQuantity?: number;
  unit?: string;
}

export async function createProductionLine(payload: NewProductionLinePayload): Promise<ProductionLine> {
  const { data, error } = await supabase
    .from('production_lines')
    .insert({
      line_code: payload.lineCode,
      name: payload.name,
      description: payload.description || null,
      product_name: payload.productName || null,
      target_quantity: payload.targetQuantity || null,
      unit: payload.unit || 'Units',
      status: 'active',
    })
    .select(`
      id, line_code, name, description, product_name, target_quantity, unit, status, created_at, updated_at,
      assigned_manager:assigned_manager_id(id, full_name, email)
    `)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    lineCode: data.line_code,
    name: data.name,
    description: data.description,
    productName: data.product_name,
    targetQuantity: data.target_quantity,
    unit: data.unit,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    assignedManager: null,
  };
}

// Assign a manager to a production line
export async function assignManagerToLine(lineId: string, managerId: string): Promise<void> {
  const { error } = await supabase
    .from('production_lines')
    .update({ assigned_manager_id: managerId })
    .eq('id', lineId);
  if (error) throw error;
}

// Unassign manager from production line
export async function unassignManagerFromLine(lineId: string): Promise<void> {
  const { error } = await supabase
    .from('production_lines')
    .update({ assigned_manager_id: null })
    .eq('id', lineId);
  if (error) throw error;
}

// Fetch active managers for assignment
export async function fetchAssignableManagers(): Promise<ManagerAccount[]> {
  const { data, error } = await supabase
    .from('manager_accounts')
    .select('id, full_name, email, phone, assigned_line, is_active, created_at, last_login_at')
    .eq('is_active', true)
    .order('full_name', { ascending: true });

  if (error) throw error;

  return (data || []).map((r: any) => ({
    id: r.id,
    fullName: r.full_name,
    email: r.email,
    phone: r.phone,
    assignedLine: r.assigned_line,
    isActive: r.is_active,
    createdAt: r.created_at,
    lastLoginAt: r.last_login_at,
  }));
}

// Get count of active production lines
export async function fetchActiveLineCount(): Promise<number> {
  const { count, error } = await supabase
    .from('production_lines')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  if (error) throw error;
  return count || 0;
}

// ============================================================
// Production Job Functions (batch runs created by managers)
// ============================================================

// Fetch jobs for a specific production line
export async function fetchJobsForLine(lineId: string): Promise<ProductionJobCard[]> {
  const { data, error } = await supabase
    .from('production_jobs')
    .select(`
      id, job_id, name, description, product_name, target_quantity, unit, target_date, status, created_at,
      production_line_id, production_line:production_lines(name)
    `)
    .eq('production_line_id', lineId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((r: any) => ({
    id: r.id,
    jobId: r.job_id,
    name: r.name,
    description: r.description,
    productName: r.product_name,
    targetQuantity: r.target_quantity,
    unit: r.unit,
    targetDate: r.target_date,
    status: r.status,
    hasActiveWorkflow: false,
    createdAt: r.created_at,
    productionLineId: r.production_line_id,
    productionLineName: r.production_line?.name || null,
  }));
}

// Fetch all jobs (for executive view)
export async function fetchAllJobs(): Promise<ProductionJobCard[]> {
  const { data, error } = await supabase
    .from('production_jobs')
    .select(`
      id, job_id, name, description, product_name, target_quantity, unit, target_date, status, created_at,
      production_line_id, production_line:production_lines(name)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((r: any) => ({
    id: r.id,
    jobId: r.job_id,
    name: r.name,
    description: r.description,
    productName: r.product_name,
    targetQuantity: r.target_quantity,
    unit: r.unit,
    targetDate: r.target_date,
    status: r.status,
    hasActiveWorkflow: false,
    createdAt: r.created_at,
    productionLineId: r.production_line_id,
    productionLineName: r.production_line?.name || null,
  }));
}

// Legacy: fetch unassigned lines (draft jobs without a line)
export async function fetchUnassignedLines(): Promise<UnassignedLine[]> {
  const { data, error } = await supabase
    .from('production_jobs')
    .select('id, job_id, name, product_name, target_quantity, unit, notes, created_at')
    .is('production_line_id', null)
    .eq('status', 'draft')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((r: any) => ({
    id: r.id,
    jobId: r.job_id,
    name: r.name,
    productName: r.product_name,
    targetQuantity: r.target_quantity,
    unit: r.unit,
    notes: r.notes,
    createdAt: r.created_at,
  }));
}

// ============================================================
// Analytics Functions
// ============================================================

export async function fetchDowntimeRecords(
  startDate: string,
  endDate: string
): Promise<DowntimeRecord[]> {
  const { data, error } = await supabase
    .from('downtime_records')
    .select('*')
    .gte('occurred_at', startDate)
    .lte('occurred_at', endDate)
    .order('occurred_at', { ascending: false });

  if (error || !data) return [];

  return data.map((r: any) => ({
    id: r.id,
    lineName: r.line_name,
    reason: r.reason,
    durationMinutes: r.duration_minutes,
    occurredAt: r.occurred_at,
    notes: r.notes,
  }));
}

export async function fetchFaultRecords(
  startDate: string,
  endDate: string
): Promise<FaultRecord[]> {
  const { data, error } = await supabase
    .from('fault_records')
    .select('*')
    .gte('logged_at', startDate)
    .lte('logged_at', endDate)
    .order('logged_at', { ascending: false });

  if (error || !data) return [];

  return data.map((r: any) => ({
    id: r.id,
    lineName: r.line_name,
    title: r.title,
    description: r.description,
    severity: r.severity,
    category: r.category,
    resolvedAt: r.resolved_at,
    resolvedBy: r.resolved_by,
    resolutionNotes: r.resolution_notes,
    loggedAt: r.logged_at,
    operatorName: r.operator_name,
  }));
}

export async function fetchScrapRecords(
  startDate: string,
  endDate: string
): Promise<ScrapRecord[]> {
  const { data, error } = await supabase
    .from('scrap_records')
    .select('*')
    .gte('logged_at', startDate)
    .lte('logged_at', endDate)
    .order('logged_at', { ascending: false });

  if (error || !data) return [];

  return data.map((r: any) => ({
    id: r.id,
    lineName: r.line_name,
    productType: r.product_type,
    ingredientName: r.ingredient_name,
    quantityKg: r.quantity_kg,
    reason: r.reason,
    loggedAt: r.logged_at,
  }));
}

export async function fetchOperatorMetrics(
  startDate: string,
  endDate: string
): Promise<OperatorMetric[]> {
  const { data, error } = await supabase
    .from('operator_metrics_daily')
    .select('*')
    .gte('snapshot_date', startDate)
    .lte('snapshot_date', endDate)
    .order('snapshot_date', { ascending: false });

  if (error || !data) return [];

  return data.map((r: any) => ({
    id: r.id,
    operatorId: r.operator_id,
    operatorName: r.operator_name,
    snapshotDate: r.snapshot_date,
    tasksCompleted: r.tasks_completed,
    tasksAssigned: r.tasks_assigned,
    avgTaskDurationMinutes: r.avg_task_duration_minutes,
    totalDowntimeCausedMinutes: r.total_downtime_caused_minutes,
    faultsLogged: r.faults_logged,
    minorFaults: r.minor_faults,
    criticalFaults: r.critical_faults,
    primaryLine: r.primary_line,
  }));
}

export async function fetchJobStageAnalytics(
  startDate: string,
  endDate: string
): Promise<JobStageAnalytic[]> {
  const { data, error } = await supabase
    .from('job_stage_analytics')
    .select('*')
    .gte('completed_at', startDate)
    .lte('completed_at', endDate)
    .order('completed_at', { ascending: false });

  if (error || !data) return [];

  return data.map((r: any) => ({
    id: r.id,
    jobId: r.job_id,
    jobName: r.job_name,
    productName: r.product_name,
    stageOrder: r.stage_order,
    stageName: r.stage_name,
    estimatedDurationMinutes: r.estimated_duration_minutes,
    actualDurationMinutes: r.actual_duration_minutes,
    startedAt: r.started_at,
    completedAt: r.completed_at,
    status: r.status,
    operatorName: r.operator_name,
  }));
}

// Aggregate downtime by reason
export async function fetchDowntimeByReason(
  startDate: string,
  endDate: string
): Promise<{ reason: string; totalMinutes: number }[]> {
  const { data, error } = await supabase.rpc('get_downtime_by_reason', {
    start_date: startDate,
    end_date: endDate,
  });

  if (error) {
    // Fallback to client-side aggregation if RPC doesn't exist
    const records = await fetchDowntimeRecords(startDate, endDate);
    const aggregated: Record<string, number> = {};
    records.forEach((r) => {
      aggregated[r.reason] = (aggregated[r.reason] || 0) + r.durationMinutes;
    });
    return Object.entries(aggregated).map(([reason, totalMinutes]) => ({
      reason,
      totalMinutes,
    }));
  }

  return data || [];
}

// Aggregate scrap by product type
export async function fetchScrapByProduct(
  startDate: string,
  endDate: string
): Promise<{ productType: string; totalKg: number }[]> {
  const records = await fetchScrapRecords(startDate, endDate);
  const aggregated: Record<string, number> = {};
  records.forEach((r) => {
    aggregated[r.productType] = (aggregated[r.productType] || 0) + r.quantityKg;
  });
  return Object.entries(aggregated).map(([productType, totalKg]) => ({
    productType,
    totalKg,
  }));
}

// Aggregate faults by date for trend line
export async function fetchFaultTrend(
  startDate: string,
  endDate: string
): Promise<{ date: string; minor: number; critical: number }[]> {
  const records = await fetchFaultRecords(startDate, endDate);
  const aggregated: Record<string, { minor: number; critical: number }> = {};

  records.forEach((r) => {
    const date = r.loggedAt.split('T')[0];
    if (!aggregated[date]) {
      aggregated[date] = { minor: 0, critical: 0 };
    }
    if (r.severity === 'minor') {
      aggregated[date].minor++;
    } else {
      aggregated[date].critical++;
    }
  });

  return Object.entries(aggregated).map(([date, counts]) => ({
    date,
    minor: counts.minor,
    critical: counts.critical,
  }));
}
