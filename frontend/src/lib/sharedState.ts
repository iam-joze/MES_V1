import { useEffect, useState, useCallback } from 'react';

// ============================================================
// Shared State Bridge — localStorage-backed store that connects
// the Manager module and the Operator module for the E2E
// validation workflow. Both modules read from and write to this
// single source of truth, enabling real-time cross-role updates.
// ============================================================

export interface SharedOperatorAccount {
  id: string;
  name: string;
  phone: string;
  pin: string;
  skills: string[];
  status: 'active' | 'suspended';
  registeredAt: string;
}

export interface SharedJobStage {
  id: string;
  jobId: string;
  jobName: string;
  productName: string;
  stageName: string;
  stageOrder: number;
  stationTag: string;
  estimatedDurationMinutes: number;
  operatorName: string;
  operatorPhone: string;
  status: 'available' | 'running' | 'paused' | 'completed';
  startedAt: string | null;
  blueprintId: string | null;
  blueprintName: string | null;
  scheduledStartAt?: string | null;
  scheduledEndAt?: string | null;
  // Blueprint runtime config — embedded at job-activation time
  checklistValidationTiming?: string | null;
  guidelinesEnabled?: boolean;
  guidelinesContent?: string | null;
  checklistEnabled?: boolean;
  checklistItems?: Array<{ id: string; itemText: string; sortOrder: number; isRequired: boolean }>;
  quantityLoggingEnabled?: boolean;
  quantityUnitLabel?: string | null;
  quantityMinValue?: number | null;
  quantityMaxValue?: number | null;
  quantityMetrics?: Array<{
    id: string;
    metricName: string;
    unitLabel: string;
    minValue: number | null;
    maxValue: number | null;
    inputFrequency: string;
    sortOrder: number;
  }>;
  qcFormEnabled?: boolean;
  qcQuestions?: Array<{
    id: string;
    questionText: string;
    responseType: 'pass_fail' | 'numeric' | 'free_text';
    numericMinValue: number | null;
    numericMaxValue: number | null;
    numericTolerance: number | null;
    sortOrder: number;
    isRequired: boolean;
  }>;
  faultCategoriesEnabled?: boolean;
  faultCategories?: Array<{ id: string; faultName: string; severity: 'minor' | 'critical'; requiresPhoto: boolean; sortOrder: number }>;
}

export interface SharedFaultReport {
  id: string;
  stageId: string;
  jobId: string;
  jobName: string;
  managerId: string | null;
  managerName: string | null;
  stageName: string;
  operatorName: string;
  operatorPhone: string;
  faultCategory: string;
  severity: 'critical' | 'minor';
  notes: string;
  timestamp: string;
  isResolved: boolean;
  resolvedBy: string | null;
  resolutionNote: string | null;
  resolvedAt: string | null;
}

export interface SharedPauseEvent {
  id: string;
  stageId: string;
  jobId: string;
  jobName: string;
  managerId: string | null;
  managerName: string | null;
  stageName: string;
  operatorName: string;
  operatorPhone: string;
  reason: string;
  timestamp: string;
  isResolved: boolean;
  resolvedBy: string | null;
  resolvedAt: string | null;
}

export interface SharedJob {
  id: string;
  jobId: string;
  jobName: string;
  productName: string;
  targetQuantity: number;
  unit: string;
  timeline: string;
  scheduledStartAt?: string | null;
  scheduledEndAt?: string | null;
  activatedAt: string;
  managerId: string | null;
  managerName: string | null;
  stages: SharedJobStage[];
}

interface SharedState {
  operators: SharedOperatorAccount[];
  jobs: SharedJob[];
  faults: SharedFaultReport[];
  pauses: SharedPauseEvent[];
  activeOperatorPhone: string | null;
}

const STORAGE_KEY = 'dojo_hub_shared_state_v1';

const EVENT_KEY = 'dojo_hub_shared_state_update';

function getInitialState(): SharedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        operators: parsed.operators || [],
        jobs: parsed.jobs || [],
        faults: parsed.faults || [],
        pauses: parsed.pauses || [],
        activeOperatorPhone: parsed.activeOperatorPhone || null,
      };
    }
  } catch {
    // fall through to empty state
  }
  return { operators: [], jobs: [], faults: [], pauses: [], activeOperatorPhone: null };
}

function persist(state: SharedState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  // Dispatch a custom event so same-tab listeners update immediately
  window.dispatchEvent(new CustomEvent(EVENT_KEY));
}

// ============================================================
// Hook: useSharedState
// Subscribes to the shared store. Re-renders on any change
// (including cross-tab via the storage event, and same-tab via
// our custom event).
// ============================================================
export function useSharedState(): [SharedState, (updater: (prev: SharedState) => SharedState) => void] {
  const [state, setState] = useState<SharedState>(getInitialState);

  useEffect(() => {
    const handler = () => setState(getInitialState());
    window.addEventListener('storage', handler);
    window.addEventListener(EVENT_KEY, handler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener(EVENT_KEY, handler);
    };
  }, []);

  const update = useCallback((updater: (prev: SharedState) => SharedState) => {
    setState(prev => {
      const next = updater(prev);
      persist(next);
      return next;
    });
  }, []);

  return [state, update];
}

// ============================================================
// Convenience helpers — callable from anywhere (no hook needed)
// Each reads the current state from localStorage, mutates, and
// persists. Components using useSharedState will re-render.
// ============================================================

export function getSharedState(): SharedState {
  return getInitialState();
}

export function registerOperator(data: { name: string; phone: string; pin: string; skills: string[] }) {
  const state = getSharedState();
  const newOp: SharedOperatorAccount = {
    id: `op-${Date.now()}`,
    name: data.name,
    phone: data.phone,
    pin: data.pin,
    skills: data.skills,
    status: 'active',
    registeredAt: new Date().toISOString(),
  };
  const next: SharedState = {
    ...state,
    operators: [newOp, ...state.operators],
  };
  persist(next);
  return newOp;
}

export function authenticateOperator(phone: string, pin: string): SharedOperatorAccount | null {
  const state = getSharedState();
  const normalized = phone.replace(/\s/g, '');
  const op = state.operators.find(
    o => o.phone.replace(/\s/g, '') === normalized && o.pin === pin && o.status === 'active'
  );
  if (op) {
    persist({ ...state, activeOperatorPhone: op.phone });
    return op;
  }
  return null;
}

export function setActiveOperatorPhone(phone: string | null) {
  const state = getSharedState();
  persist({ ...state, activeOperatorPhone: phone });
}

export function activateJob(job: SharedJob) {
  const state = getSharedState();
  persist({ ...state, jobs: [job, ...state.jobs] });
}

export function updateStageStatus(stageId: string, status: SharedJobStage['status']) {
  const state = getSharedState();
  let updated = false;
  const jobs = state.jobs.map(job => ({
    ...job,
    stages: job.stages.map(stage => {
      if (stage.id === stageId) {
        updated = true;
        return {
          ...stage,
          status,
          startedAt: status === 'running' && !stage.startedAt ? new Date().toISOString() : stage.startedAt,
        };
      }
      return stage;
    }),
  }));
  if (updated) {
    persist({ ...state, jobs });
  }
}

export function reportFault(report: Omit<SharedFaultReport, 'id' | 'timestamp' | 'isResolved' | 'resolvedBy' | 'resolutionNote' | 'resolvedAt' | 'managerId' | 'managerName'> & { managerId?: string | null; managerName?: string | null }) {
  const state = getSharedState();
  // Auto-route: if managerId not provided, look up the job's owning manager
  let resolvedManagerId = report.managerId || null;
  let resolvedManagerName = report.managerName || null;
  if (!resolvedManagerId) {
    const job = state.jobs.find(j => j.jobId === report.jobId || j.id === report.jobId);
    if (job) {
      resolvedManagerId = job.managerId;
      resolvedManagerName = job.managerName;
    }
  }
  const fault: SharedFaultReport = {
    ...report,
    managerId: resolvedManagerId,
    managerName: resolvedManagerName,
    id: `fault-${Date.now()}`,
    timestamp: new Date().toISOString(),
    isResolved: false,
    resolvedBy: null,
    resolutionNote: null,
    resolvedAt: null,
  };
  persist({ ...state, faults: [fault, ...state.faults] });
  return fault;
}

export function resolveFault(faultId: string, resolvedBy?: string, resolutionNote?: string) {
  const state = getSharedState();
  const faults = state.faults.map(f =>
    f.id === faultId
      ? { ...f, isResolved: true, resolvedBy: resolvedBy || null, resolutionNote: resolutionNote || null, resolvedAt: new Date().toISOString() }
      : f
  );
  persist({ ...state, faults });
}

// Report a pause event — notifies the manager dashboard
export function reportPauseEvent(event: Omit<SharedPauseEvent, 'id' | 'timestamp' | 'isResolved' | 'resolvedBy' | 'resolvedAt' | 'managerId' | 'managerName'> & { managerId?: string | null; managerName?: string | null }) {
  const state = getSharedState();
  // Auto-route: if managerId not provided, look up the job's owning manager
  let resolvedManagerId = event.managerId || null;
  let resolvedManagerName = event.managerName || null;
  if (!resolvedManagerId) {
    const job = state.jobs.find(j => j.jobId === event.jobId || j.id === event.jobId);
    if (job) {
      resolvedManagerId = job.managerId;
      resolvedManagerName = job.managerName;
    }
  }
  const pause: SharedPauseEvent = {
    ...event,
    managerId: resolvedManagerId,
    managerName: resolvedManagerName,
    id: `pause-${Date.now()}`,
    timestamp: new Date().toISOString(),
    isResolved: false,
    resolvedBy: null,
    resolvedAt: null,
  };
  persist({ ...state, pauses: [pause, ...state.pauses] });
  return pause;
}

// Resolve a pause event
export function resolvePauseEvent(pauseId: string, resolvedBy?: string) {
  const state = getSharedState();
  const pauses = state.pauses.map(p =>
    p.id === pauseId
      ? { ...p, isResolved: true, resolvedBy: resolvedBy || null, resolvedAt: new Date().toISOString() }
      : p
  );
  persist({ ...state, pauses });
}

export function getOperatorAssignments(operatorPhone: string): SharedJobStage[] {
  const state = getSharedState();
  const normalized = operatorPhone.replace(/\s/g, '');
  const stages: SharedJobStage[] = [];
  for (const job of state.jobs) {
    for (const stage of job.stages) {
      if (stage.operatorPhone.replace(/\s/g, '') === normalized) {
        stages.push(stage);
      }
    }
  }
  return stages.sort((a, b) => a.stageOrder - b.stageOrder);
}

export function getStageById(stageId: string): SharedJobStage | null {
  const state = getSharedState();
  for (const job of state.jobs) {
    const stage = job.stages.find(s => s.id === stageId);
    if (stage) return stage;
  }
  return null;
}

export function getUnresolvedFaults(): SharedFaultReport[] {
  const state = getSharedState();
  return state.faults.filter(f => !f.isResolved);
}

export function clearSharedState() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(EVENT_KEY));
}
