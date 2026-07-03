import { useState, useEffect, useCallback } from 'react';
import {
  Factory,
  User,
  Settings,
  Circle,
  Loader2,
  Pause,
  AlertOctagon,
  ChevronRight,
  MapPin,
  Clock,
  Package,
  AlertTriangle,
  X,
} from 'lucide-react';
import type { OperatorProcessStage, OperatorStageStatus } from '../types/operatorModule';
import { fetchOperatorAssignments } from '../data/operatorModuleData';
import { useSharedState } from '../lib/sharedState';
import { CheckCircle2, MessageSquare } from 'lucide-react';

interface OperatorHomeProps {
  operatorName: string;
  onSelectStage: (stage: OperatorProcessStage) => void;
}

const statusConfig: Record<
  OperatorStageStatus,
  { label: string; bg: string; text: string; border: string; icon: React.ReactNode; pulse?: boolean }
> = {
  available: {
    label: 'AVAILABLE',
    bg: 'bg-info-100',
    text: 'text-info-800',
    border: 'border-info-300',
    icon: <Circle size={22} className="fill-info-500 text-info-500" strokeWidth={2.5} />,
  },
  running: {
    label: 'RUNNING',
    bg: 'bg-cyan-100',
    text: 'text-cyan-800',
    border: 'border-cyan-400',
    icon: <Loader2 size={22} className="text-cyan-600 animate-spin" strokeWidth={2.5} />,
  },
  paused: {
    label: 'PAUSED BY OPERATOR',
    bg: 'bg-warning-100',
    text: 'text-warning-800',
    border: 'border-warning-400',
    icon: <Pause size={22} className="text-warning-700" strokeWidth={2.5} />,
  },
  completed: {
    label: 'COMPLETED',
    bg: 'bg-success-100',
    text: 'text-success-800',
    border: 'border-success-300',
    icon: <Circle size={22} className="fill-success-500 text-success-500" strokeWidth={2.5} />,
  },
  pending: {
    label: 'PENDING',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    icon: <Circle size={22} className="text-slate-400" strokeWidth={2.5} />,
  },
};

const emergencyStopConfig = {
  label: 'PAUSED BY EMERGENCY STOP',
  bg: 'bg-danger-100',
  text: 'text-danger-800',
  border: 'border-danger-400',
  icon: <AlertOctagon size={22} className="text-danger-600" strokeWidth={2.5} />,
  pulse: true,
};

function ProcessCard({
  stage,
  onSelect,
}: {
  stage: OperatorProcessStage;
  onSelect: () => void;
}) {
  const isEmergencyStop = stage.status === 'paused' && stage.jobId === 'JOB-404';
  const config = isEmergencyStop ? emergencyStopConfig : statusConfig[stage.status];

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left bg-white rounded-2xl border-2 ${
        isEmergencyStop ? 'border-danger-300' : 'border-slate-200'
      } shadow-sm active:scale-[0.98] transition-transform duration-150 overflow-hidden`}
    >
      {isEmergencyStop && (
        <div className="bg-danger-500 text-white text-center py-1.5 text-sm font-bold tracking-wide animate-pulse">
          GLOBAL MANAGER FREEZE ACTIVE
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Package size={20} className="text-navy-600 flex-shrink-0" strokeWidth={2.5} />
          <span className="text-base font-bold text-navy-900">{stage.jobId}</span>
          <span className="text-base text-slate-400">·</span>
          <span className="text-base text-slate-600 truncate">{stage.productName}</span>
        </div>
        <h3 className="text-xl font-bold text-slate-900 leading-tight mb-1">
          {stage.stageName}
        </h3>
        <p className="text-base text-slate-500 mb-4">{stage.jobName}</p>
        <div className="flex items-center gap-4 mb-4 text-base text-slate-600">
          <span className="flex items-center gap-1.5">
            <MapPin size={18} className="text-slate-400" strokeWidth={2.5} />
            {stage.stationTag}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={18} className="text-slate-400" strokeWidth={2.5} />
            ~{stage.estimatedDurationMinutes} min
          </span>
        </div>
        <div
          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border-2 ${config.bg} ${config.border} ${
            config.pulse ? 'animate-pulse' : ''
          }`}
        >
          <div className="flex items-center gap-2.5">
            {config.icon}
            <span className={`text-base font-bold tracking-wide ${config.text}`}>
              {config.label}
            </span>
          </div>
          <ChevronRight size={24} className={config.text} strokeWidth={2.5} />
        </div>
      </div>
    </button>
  );
}

function SettingsSheet({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-3xl p-6 pb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Settings</h2>
          <button
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-100 active:bg-slate-200"
          >
            <X size={24} className="text-slate-600" strokeWidth={2.5} />
          </button>
        </div>
        <div className="space-y-3">
          {['Notifications', 'Offline Mode', 'High Contrast', 'Language', 'Help & Support', 'Sign Out'].map(
            (item) => (
              <button
                key={item}
                className="w-full flex items-center justify-between px-4 py-4 rounded-xl bg-slate-50 active:bg-slate-100 text-base font-medium text-slate-800"
              >
                {item}
                <ChevronRight size={20} className="text-slate-400" strokeWidth={2.5} />
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export function OperatorHome({ operatorName, onSelectStage }: OperatorHomeProps) {
  const [stages, setStages] = useState<OperatorProcessStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Subscribe to shared state so new job assignments appear in real time
  const [sharedState] = useSharedState();

  const loadAssignments = useCallback(async () => {
    try {
      const data = await fetchOperatorAssignments(operatorName);
      setStages(data);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, [operatorName]);

  // Initial load
  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  // Re-fetch whenever shared state changes (new job assigned, status updated)
  useEffect(() => {
    loadAssignments();
  }, [sharedState, loadAssignments]);

  const activeStages = stages.filter(s => s.status !== 'completed');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-navy-900 rounded-xl flex items-center justify-center">
            <Factory size={22} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-navy-900 leading-tight">Dojo Hub</span>
            <span className="text-xs text-slate-500 leading-tight">{operatorName}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-11 h-11 flex items-center justify-center rounded-full bg-navy-100 active:bg-navy-200 transition-colors">
            <User size={22} className="text-navy-700" strokeWidth={2.5} />
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-slate-100 active:bg-slate-200 transition-colors"
          >
            <Settings size={22} className="text-slate-700" strokeWidth={2.5} />
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4 pb-24">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-900">My Assignments</h1>
          <span className="text-base text-slate-500">{activeStages.length} active</span>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={32} className="text-navy-500 animate-spin" />
            <p className="text-base text-slate-500 mt-3">Loading assignments...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 bg-danger-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle size={32} className="text-danger-600" strokeWidth={2.5} />
            </div>
            <p className="text-lg font-bold text-slate-900 mb-1">Connection Error</p>
            <p className="text-base text-slate-500">{error}</p>
          </div>
        )}

        {!loading && !error && activeStages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Package size={32} className="text-slate-400" strokeWidth={2} />
            </div>
            <p className="text-lg font-bold text-slate-900 mb-1">No Active Assignments</p>
            <p className="text-base text-slate-500">
              Waiting for manager to assign a job. This screen updates automatically.
            </p>
          </div>
        )}

        {!loading &&
          !error &&
          activeStages.map((stage) => (
            <ProcessCard key={stage.id} stage={stage} onSelect={() => onSelectStage(stage)} />
        ))}

        {/* Manager Feedback — resolved faults with resolution notes */}
        {!loading && !error && (() => {
          const resolvedFeedback = sharedState.faults.filter(
            f => f.isResolved && f.operatorName === operatorName && f.resolutionNote
          );
          if (resolvedFeedback.length === 0) return null;
          return (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3 px-1">
                <MessageSquare size={16} className="text-navy-600" strokeWidth={2.5} />
                <h3 className="text-sm font-bold text-slate-800">Manager Feedback</h3>
              </div>
              <div className="space-y-2">
                {resolvedFeedback.map(fault => (
                  <div key={fault.id} className="bg-white border border-slate-200 rounded-xl p-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="text-success-500 mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-700">
                          {fault.faultCategory} — {fault.stageName}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {fault.jobName}
                        </p>
                        <div className="mt-2 bg-navy-50 rounded-lg px-2.5 py-2">
                          <p className="text-[11px] font-medium text-navy-600 mb-0.5">
                            {fault.resolvedBy || 'Manager'}:
                          </p>
                          <p className="text-xs text-slate-700">{fault.resolutionNote}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </main>

      <SettingsSheet isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
