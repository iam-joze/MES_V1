import { useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Package,
  Pause,
  Play,
  RefreshCw,
  User,
  Wrench,
  Zap,
} from 'lucide-react';
import { useSharedState, resolveFault, type SharedJobStage, type SharedFaultReport } from '../lib/sharedState';

// ============================================================
// LiveJobMonitor — real-time panel for the Manager dashboard
// Reads shared state (localStorage bridge) and re-renders on
// any change from the Operator module.
// ============================================================

function formatDuration(isoStart: string | null): string {
  if (!isoStart) return '--:--:--';
  const seconds = Math.floor((Date.now() - new Date(isoStart).getTime()) / 1000);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function StageStatusBadge({ status }: { status: SharedJobStage['status'] }) {
  const cfg = {
    available: { bg: 'bg-info-100 text-info-800 border-info-300', icon: <Clock size={14} strokeWidth={2.5} />, label: 'AVAILABLE' },
    running: { bg: 'bg-cyan-100 text-cyan-800 border-cyan-300', icon: <Loader2 size={14} className="animate-spin" strokeWidth={2.5} />, label: 'RUNNING' },
    paused: { bg: 'bg-warning-100 text-warning-800 border-warning-300', icon: <Pause size={14} strokeWidth={2.5} />, label: 'PAUSED' },
    completed: { bg: 'bg-success-100 text-success-800 border-success-300', icon: <CheckCircle2 size={14} strokeWidth={2.5} />, label: 'COMPLETED' },
  }[status] || { bg: 'bg-slate-100 text-slate-700 border-slate-300', icon: null, label: status.toUpperCase() };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.bg}`}>
      {cfg.icon}
      {cfg.label}
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

function JobCard({ job }: { job: { id: string; jobId: string; jobName: string; productName: string; stages: SharedJobStage[] } }) {
  const runningCount = job.stages.filter(s => s.status === 'running').length;
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
            <div className="flex-shrink-0">
              <StageStatusBadge status={stage.status} />
            </div>
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

function FaultCard({ fault, onResolve }: { fault: SharedFaultReport; onResolve: (id: string) => void }) {
  const isCritical = fault.severity === 'critical';
  return (
    <div className={`card border-l-4 p-4 ${isCritical ? 'border-l-danger-500 bg-danger-50' : 'border-l-warning-400 bg-warning-50'}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {isCritical
            ? <AlertCircle size={20} className="text-danger-500" strokeWidth={2.5} />
            : <AlertTriangle size={20} className="text-warning-500" strokeWidth={2.5} />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${isCritical ? 'bg-danger-500 text-white' : 'bg-warning-500 text-white'}`}>
              {fault.severity.toUpperCase()}
            </span>
            <span className="text-sm font-bold text-slate-900">{fault.faultCategory}</span>
          </div>
          <p className="text-sm text-slate-600 mt-1">{fault.notes}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <User size={12} strokeWidth={2.5} />
              {fault.operatorName}
            </span>
            <span>{fault.jobName} · {fault.stageName}</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
            <Clock size={12} />
            {new Date(fault.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-3 pt-3 border-t border-slate-200/50">
        <button
          onClick={() => onResolve(fault.id)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
        >
          <CheckCircle2 size={14} strokeWidth={2.5} />
          Resolve & Dismiss
        </button>
      </div>
    </div>
  );
}

export function LiveJobMonitor() {
  const [sharedState, updateState] = useSharedState();
  const [now, setNow] = useState(Date.now());

  // Tick every second for live timers
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const activeJobs = sharedState.jobs;
  const unresolvedFaults = sharedState.faults.filter(f => !f.isResolved);
  const runningStages = sharedState.jobs.flatMap(j => j.stages).filter(s => s.status === 'running');

  const handleResolveFault = (faultId: string) => {
    resolveFault(faultId);
    // Force re-render by triggering update
    updateState(prev => ({ ...prev }));
  };

  if (activeJobs.length === 0 && unresolvedFaults.length === 0) {
    return (
      <div className="card p-8 text-center">
        <Activity size={40} className="mx-auto text-slate-300 mb-3" />
        <p className="font-semibold text-slate-700">No Active Jobs in Live Monitor</p>
        <p className="text-sm text-slate-500 mt-1">
          Use the Job Builder to create and activate a production run. It will appear here in real time.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-navy-500" strokeWidth={2.5} />
            <h3 className="font-semibold text-slate-900">Live Job Monitor</h3>
            {runningStages.length > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded-full text-xs font-bold animate-pulse">
                <Loader2 size={12} className="animate-spin" />
                {runningStages.length} running
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>{activeJobs.length} job{activeJobs.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        {/* Mini stats row */}
        {runningStages.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-lg font-bold text-cyan-700">{runningStages.length}</p>
              <p className="text-xs text-slate-500">Stages Running</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-danger-600">{unresolvedFaults.length}</p>
              <p className="text-xs text-slate-500">Open Faults</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-success-600">
                {sharedState.jobs.flatMap(j => j.stages).filter(s => s.status === 'completed').length}
              </p>
              <p className="text-xs text-slate-500">Completed</p>
            </div>
          </div>
        )}
      </div>

      {/* Live fault feed */}
      {unresolvedFaults.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-danger-500" strokeWidth={2.5} />
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Attention Feed — Unresolved Issues
            </h4>
            <span className="px-2 py-0.5 bg-danger-500 text-white rounded-full text-xs font-bold animate-pulse">
              {unresolvedFaults.length}
            </span>
          </div>
          {unresolvedFaults.map(fault => (
            <FaultCard key={fault.id} fault={fault} onResolve={handleResolveFault} />
          ))}
        </div>
      )}

      {/* Active jobs */}
      {activeJobs.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Play size={16} className="text-navy-500" strokeWidth={2.5} />
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Active Jobs</h4>
          </div>
          {activeJobs.map(job => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
