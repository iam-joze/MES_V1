import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Factory,
  Layers,
  Loader2,
  Package,
  Pause,
  PauseCircle,
  Play,
  RefreshCw,
  User,
  Wrench,
  Zap,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSharedState, resolveFault, resolvePauseEvent, updateStageStatus, type SharedJobStage, type SharedFaultReport, type SharedJob, type SharedPauseEvent } from '../lib/sharedState';
import type { ProductionLine } from '../types/index';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

function formatDuration(isoStart: string | null): string {
  if (!isoStart) return '--:--:--';
  const seconds = Math.floor((Date.now() - new Date(isoStart).getTime()) / 1000);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AssignedLineCard({ line, onBuildJob }: { line: ProductionLine; onBuildJob: () => void }) {
  const statusConfig = {
    active: { bg: 'bg-success-100', text: 'text-success-700', label: 'Active' },
    inactive: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Inactive' },
    maintenance: { bg: 'bg-warning-100', text: 'text-warning-700', label: 'Maintenance' },
  };
  const cfg = statusConfig[line.status as keyof typeof statusConfig] || statusConfig.active;

  return (
    <div className="border border-slate-200 rounded-xl bg-white p-4 flex flex-col gap-2 hover:border-navy-300 hover:shadow-card transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
            line.status === 'active' ? 'bg-success-100' : line.status === 'maintenance' ? 'bg-warning-100' : 'bg-slate-100'
          }`}>
            <Factory size={18} className={line.status === 'active' ? 'text-success-600' : 'text-slate-500'} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{line.lineCode}</span>
            <p className="text-sm font-semibold text-slate-900 truncate">{line.name}</p>
          </div>
        </div>
        <span className={`text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-md ${cfg.bg} ${cfg.text}`}>
          {cfg.label}
        </span>
      </div>
      {line.description && (
        <p className="text-xs text-slate-500 line-clamp-2">{line.description}</p>
      )}
      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
        <Package size={12} strokeWidth={2.5} />
        <span>{line.productName || 'No product set'}</span>
        {line.targetQuantity && <span>· {line.targetQuantity.toLocaleString()} {line.unit}</span>}
      </div>
      <button
        onClick={onBuildJob}
        className="mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-sm font-semibold transition-all active:scale-[0.98]"
      >
        <Play size={14} strokeWidth={2.5} />
        Build Job
      </button>
    </div>
  );
}

function MetricSlot({ label, value, accent }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between py-4 px-5 border border-slate-200 rounded-xl bg-white">
      <span className="text-[11px] font-bold tracking-widest text-slate-400 uppercase font-mono">{label}</span>
      <span className={`text-3xl font-bold tabular-nums ${accent ? 'text-danger-600' : 'text-slate-900'}`}>
        {value}
      </span>
    </div>
  );
}

function LiveStageStatusBadge({ status }: { status: SharedJobStage['status'] }) {
  const cfg = {
    available: { bg: 'bg-info-100 text-info-800 border-info-300', icon: <Clock size={14} strokeWidth={2.5} />, label: 'AVAILABLE' },
    running: { bg: 'bg-cyan-100 text-cyan-800 border-cyan-300', icon: <Loader2 size={14} className="animate-spin" strokeWidth={2.5} />, label: 'RUNNING' },
    paused: { bg: 'bg-warning-100 text-warning-800 border-warning-300', icon: <PauseCircle size={14} strokeWidth={2.5} />, label: 'PAUSED' },
    completed: { bg: 'bg-success-100 text-success-800 border-success-300', icon: <CheckCircle2 size={14} strokeWidth={2.5} />, label: 'COMPLETED' },
  }[status] || { bg: 'bg-slate-100 text-slate-700 border-slate-300', icon: null, label: status.toUpperCase() };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.bg}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

function LiveDurationTimer({ startedAt }: { startedAt: string | null }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  if (!startedAt) return <span className="text-slate-400">--:--:--</span>;
  return <span className="font-mono text-sm font-bold text-cyan-700">{formatDuration(startedAt)}</span>;
}

function LiveJobCard({ job }: { job: { id: string; jobId: string; jobName: string; productName: string; stages: SharedJobStage[] } }) {
  const completedCount = job.stages.filter(s => s.status === 'completed').length;

  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-navy-50 border-b border-navy-100">
        <div className="flex items-center gap-2">
          <Package size={16} className="text-navy-600" strokeWidth={2.5} />
          <span className="text-sm font-bold text-navy-900">{job.jobId}</span>
          <span className="text-slate-400">·</span>
          <span className="text-sm text-navy-700 font-medium truncate max-w-[180px]">{job.jobName}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="text-success-600 font-semibold">{completedCount}</span>
          <span>/</span>
          <span className="font-semibold">{job.stages.length}</span>
          <span>stages</span>
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {job.stages.map(stage => (
          <div key={stage.id} className={`flex items-center gap-3 px-4 py-3 ${stage.status === 'running' ? 'bg-cyan-50' : ''}`}>
            <div className="flex-shrink-0"><LiveStageStatusBadge status={stage.status} /></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{stage.stageName}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <User size={12} strokeWidth={2.5} />
                {stage.operatorName}
                {stage.stationTag && <><span className="text-slate-300">·</span><Wrench size={12} strokeWidth={2.5} />{stage.stationTag}</>}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              {stage.status === 'running' && <LiveDurationTimer startedAt={stage.startedAt} />}
              {stage.status === 'available' && (
                <span className="text-xs text-slate-400">~{stage.estimatedDurationMinutes} min</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveJobMonitor({ jobs }: { jobs: SharedJob[] }) {
  const activeJobs = jobs;
  const runningStages = activeJobs.flatMap(j => j.stages).filter(s => s.status === 'running');

  if (activeJobs.length === 0) {
    return (
      <div className="card p-6 text-center">
        <Activity size={32} className="mx-auto text-slate-300 mb-2" />
        <p className="font-semibold text-slate-700 text-sm">No Active Jobs</p>
        <p className="text-xs text-slate-500 mt-1">
          Use the Job Builder to create a production run. It will appear here in real time.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Play size={16} className="text-navy-500" strokeWidth={2.5} />
        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Active Jobs</h4>
        {runningStages.length > 0 && (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded-full text-xs font-bold animate-pulse">
            <Loader2 size={12} className="animate-spin" />
            {runningStages.length} running
          </span>
        )}
      </div>
      {activeJobs.map(job => <LiveJobCard key={job.id} job={job} />)}
    </div>
  );
}

function AlertStrip({ severity, title, timestamp, message, source, onAction, actionLabel }: {
  severity: 'minor' | 'critical' | 'paused';
  title: string;
  timestamp: string;
  message: string;
  source: string;
  onAction: () => void;
  actionLabel: string;
}) {
  if (severity === 'minor') {
    return (
      <div className="rounded-xl overflow-hidden" style={{ background: '#f59e0b' }}>
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} strokeWidth={2.5} className="text-amber-900" />
              <span className="text-[11px] font-bold tracking-widest text-amber-900 uppercase">{title}</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-amber-900 opacity-80">{timestamp}</span>
          </div>
          <p className="text-sm font-semibold text-amber-950 leading-snug">{message}</p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-amber-900 opacity-75">{source}</p>
            <button onClick={onAction} className="text-[11px] font-bold text-amber-950 underline underline-offset-2 hover:opacity-70 transition-opacity uppercase tracking-wide">
              {actionLabel}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (severity === 'critical') {
    return (
      <div className="rounded-xl overflow-hidden" style={{ background: '#ef4444' }}>
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <AlertCircle size={15} strokeWidth={2.5} className="text-red-100" />
              <span className="text-[11px] font-bold tracking-widest text-red-100 uppercase">{title}</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-red-100 opacity-80">{timestamp}</span>
          </div>
          <p className="text-sm font-bold text-white leading-snug">{message}</p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-red-100 opacity-80">{source}</p>
            <button onClick={onAction} className="text-[11px] font-bold text-white underline underline-offset-2 hover:opacity-70 transition-opacity uppercase tracking-wide">
              {actionLabel}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <PauseCircle size={15} strokeWidth={2.5} className="text-slate-500" />
            <span className="text-[11px] font-bold tracking-widest text-slate-600 uppercase">{title}</span>
          </div>
          <span className="text-[11px] font-mono font-bold text-slate-400">{timestamp}</span>
        </div>
        <p className="text-sm text-slate-700 leading-snug">{message}</p>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-slate-400">{source}</p>
          <button onClick={onAction} className="text-[11px] font-bold text-info-600 underline underline-offset-2 hover:text-info-800 transition-colors uppercase tracking-wide">
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface ManagerHomeProps {
  managerId?: string;
  managerName?: string;
  onNavigate?: (view: string) => void;
}

export function ManagerHome({ managerId, managerName, onNavigate }: ManagerHomeProps) {
  const [assignedLines, setAssignedLines] = useState<ProductionLine[]>([]);
  const [loading, setLoading] = useState(true);

  const [sharedState, updateSharedState] = useSharedState();

  // All jobs from shared state (created by any manager; visible to all for now)
  const allJobs = sharedState.jobs;
  const unresolvedFaults = sharedState.faults.filter(f => !f.isResolved);
  const unresolvedPauses = sharedState.pauses.filter(p => !p.isResolved);
  const activeJobCount = allJobs.length;
  const unresolvedFaultCount = unresolvedFaults.length;

  const handleResolveFault = (faultId: string) => {
    resolveFault(faultId, managerName || 'Manager', 'Fault resolved by manager.');
    updateSharedState(prev => ({ ...prev }));
  };

  const handleResolvePause = (pauseId: string) => {
    resolvePauseEvent(pauseId, managerName || 'Manager');
    updateSharedState(prev => ({ ...prev }));
  };

  const handleResumeStage = (stageId: string) => {
    updateStageStatus(stageId, 'running');
    updateSharedState(prev => ({ ...prev }));
  };

  // Load assigned production lines (physical manufacturing lines)
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        let query = supabase
          .from('production_lines')
          .select(`
            id, line_code, name, description, product_name, target_quantity, unit, status, created_at, updated_at,
            assigned_manager:assigned_manager_id(id, full_name, email)
          `)
          .order('created_at', { ascending: false });

        // Scope to lines assigned to this manager
        if (managerId) {
          query = query.eq('assigned_manager_id', managerId);
        }

        const { data: lines } = await query;

        if (lines) {
          const mapped: ProductionLine[] = lines.map((r: any) => ({
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
          setAssignedLines(mapped);
        } else {
          setAssignedLines([]);
        }
      } catch {
        setAssignedLines([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [managerId]);

  const handleBuildJob = () => {
    onNavigate?.('job-builder');
  };

  const pausedStages = allJobs.flatMap(j =>
    j.stages
      .filter(s => s.status === 'paused')
      .map(s => ({ ...s, jobName: j.jobName, jobId: j.jobId }))
  );

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-5 scrollbar-thin">
      {/* ─── TOP ROW: 70 / 30 split ─────────────────────────────────── */}
      <div className="grid gap-5 mb-5" style={{ gridTemplateColumns: '1fr minmax(0,340px)' }}>

        {/* ── Top-Left: Your Assigned Production Lines ── */}
        <div className="card p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 bg-navy-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Factory size={17} className="text-navy-600" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">Your Assigned Production Lines</h2>
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                Select a line to build a production job and orchestrate process workflows.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Loading lines...</span>
            </div>
          ) : assignedLines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
              <Factory size={28} className="text-slate-300" />
              <span className="text-sm">
                {managerName ? `${managerName}, you have no lines assigned yet.` : 'No production lines assigned to you yet.'}
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {assignedLines.map(line => (
                <AssignedLineCard key={line.id} line={line} onBuildJob={handleBuildJob} />
              ))}
            </div>
          )}
        </div>

        {/* ── Top-Right: Manager Metrics ── */}
        <div className="card p-5 flex flex-col gap-3">
          <div className="flex items-start gap-3 mb-1">
            <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-slate-200">
              <Activity size={17} className="text-slate-600" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">Manager Metrics</h2>
            </div>
          </div>

          <div className="flex flex-col gap-3 flex-1">
            <MetricSlot label="Your Assigned Lines" value={assignedLines.length} />
            <MetricSlot label="Active Production Jobs" value={activeJobCount} />
            <MetricSlot label="Unresolved Faults" value={unresolvedFaultCount} accent={unresolvedFaultCount > 0} />
          </div>
        </div>
      </div>

      {/* ─── BOTTOM ROW: ~55 / 45 split ─────────────────────────────── */}
      <div className="grid gap-5" style={{ gridTemplateColumns: '1fr minmax(0,420px)' }}>

        {/* ── Bottom-Left: Live Job Monitor ── */}
        <div className="space-y-5">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={18} className="text-navy-500" strokeWidth={2.5} />
              <h2 className="text-base font-bold text-slate-900 leading-tight">Live Job Monitor</h2>
            </div>
            <LiveJobMonitor jobs={allJobs} />
          </div>
        </div>

        {/* ── Bottom-Right: Live Manager Alerts ── */}
        <div className="card p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 bg-warning-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-warning-200">
              <AlertTriangle size={17} className="text-warning-600" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">Live Manager Alerts</h2>
              <p className="text-xs text-slate-500 mt-0.5">Unresolved faults or paused operations. Sorted newest first.</p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Pause events from operators */}
            {unresolvedPauses.map(pause => (
              <AlertStrip
                key={pause.id}
                severity="paused"
                title="PROCESS PAUSED"
                timestamp={formatTime(pause.timestamp)}
                message={`${pause.stageName} on ${pause.jobName} was paused. Reason: ${pause.reason}`}
                source={`${pause.operatorName} / ${pause.jobId}`}
                onAction={() => handleResolvePause(pause.id)}
                actionLabel="Dismiss"
              />
            ))}

            {/* Fault reports from operators */}
            {unresolvedFaults.map(fault => (
              <AlertStrip
                key={fault.id}
                severity={fault.severity}
                title={`FAULT: ${fault.severity.toUpperCase()}`}
                timestamp={formatTime(fault.timestamp)}
                message={fault.notes}
                source={`${fault.jobName} / ${fault.stageName}`}
                onAction={() => handleResolveFault(fault.id)}
                actionLabel="Resolve Fault"
              />
            ))}

            {unresolvedFaults.length === 0 && unresolvedPauses.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 size={32} className="text-success-500 mb-2" strokeWidth={2} />
                <p className="text-sm font-semibold text-slate-700">All Clear</p>
                <p className="text-xs text-slate-500 mt-1">No active alerts at this time.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
