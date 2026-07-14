import { useState, useEffect, useRef } from 'react';
import { AlertOctagon, X, Factory, Target, ChevronDown, Loader2 } from 'lucide-react';
import { api } from '../../../shared/lib/api';

type StopScope = 'facility_wide' | 'specific_job';

interface ActiveJob {
  id: string;
  jobId: string;
  name: string;
  line: { lineCode: string; name: string };
}

const REASONS = [
  'Equipment Malfunction',
  'Safety Hazard Detected',
  'Quality Control Failure',
  'Material Contamination',
  'Fire/Smoke Detected',
  'Personnel Injury',
  'Environmental Spill',
  'Utility Failure',
  'Other - Specify in Notes',
];

interface EmergencyStopOverlayProps {
  onClose: () => void;
  onStopped: (stoppedCount: number) => void;
}

export function EmergencyStopOverlay({ onClose, onStopped }: EmergencyStopOverlayProps) {
  const [scope, setScope] = useState<StopScope>('facility_wide');
  const [activeJobs, setActiveJobs] = useState<ActiveJob[] | null>(null);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const progressRef = useRef<number | null>(null);

  // Only fetch the list of stoppable jobs once the manager actually picks
  // "specific job" — no point loading it up front for the facility-wide path.
  useEffect(() => {
    if (scope === 'specific_job' && activeJobs === null) {
      api.get<{ jobs: ActiveJob[] }>('/emergency-stop/active-jobs')
        .then((res) => setActiveJobs(res.data.jobs))
        .catch(() => setActiveJobs([]));
    }
  }, [scope, activeJobs]);

  useEffect(() => () => { if (progressRef.current) clearInterval(progressRef.current); }, []);

  const canSubmit = reason && (scope === 'facility_wide' || selectedJobId);

  const startHold = () => {
    if (!canSubmit) return;
    setIsHolding(true);
    setHoldProgress(0);
    progressRef.current = window.setInterval(() => {
      setHoldProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressRef.current!);
          return 100;
        }
        return prev + 2;
      });
    }, 30);
  };

  const endHold = () => {
    setIsHolding(false);
    if (progressRef.current) clearInterval(progressRef.current);
    if (holdProgress >= 100) {
      executeStop();
    } else {
      setHoldProgress(0);
    }
  };

  const executeStop = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await api.post('/emergency-stop', {
        scope,
        jobId: scope === 'specific_job' ? selectedJobId : undefined,
        reason,
        notes: notes.trim(),
      });
      onStopped(data.stoppedCount);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to trigger emergency stop.');
      setSubmitting(false);
      setHoldProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-danger-950/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-card-elevated overflow-hidden">
        <div className="px-6 py-4 bg-danger-600 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <AlertOctagon size={24} />
            <h2 className="font-bold">Emergency Stop</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          {error && <p className="text-sm text-danger-600 bg-danger-50 border border-danger-200 rounded-lg p-3">{error}</p>}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Stop Scope</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setScope('facility_wide')}
                className={`flex items-center gap-2 p-3 rounded-lg border-2 text-sm font-medium ${
                  scope === 'facility_wide' ? 'border-danger-500 bg-danger-50 text-danger-700' : 'border-slate-200 text-slate-600'
                }`}
              >
                <Factory size={16} /> All My Active Jobs
              </button>
              <button
                type="button"
                onClick={() => setScope('specific_job')}
                className={`flex items-center gap-2 p-3 rounded-lg border-2 text-sm font-medium ${
                  scope === 'specific_job' ? 'border-danger-500 bg-danger-50 text-danger-700' : 'border-slate-200 text-slate-600'
                }`}
              >
                <Target size={16} /> Specific Job
              </button>
            </div>
          </div>

          {scope === 'specific_job' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Job</label>
              {activeJobs === null ? (
                <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
                  <Loader2 size={16} className="animate-spin" /> Loading active jobs...
                </div>
              ) : activeJobs.length === 0 ? (
                <p className="text-sm text-slate-400">No active jobs on your lines.</p>
              ) : (
                <div className="relative">
                  <select
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                    className="w-full appearance-none px-3 py-2.5 pr-9 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="">Choose a job...</option>
                    {activeJobs.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.line.lineCode} — {job.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Reason</label>
            <div className="relative">
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full appearance-none px-3 py-2.5 pr-9 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              >
                <option value="">Select a reason...</option>
                {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Additional Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-20 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm resize-none"
            />
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            disabled={!canSubmit || submitting}
            onMouseDown={startHold}
            onMouseUp={endHold}
            onMouseLeave={endHold}
            onTouchStart={startHold}
            onTouchEnd={endHold}
            className="relative w-full py-4 rounded-xl bg-danger-600 text-white font-bold overflow-hidden disabled:opacity-40 select-none"
          >
            <div
              className="absolute inset-0 bg-danger-800 transition-none"
              style={{ width: `${holdProgress}%` }}
            />
            <span className="relative flex items-center justify-center gap-2">
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <AlertOctagon size={18} />}
              {submitting ? 'Stopping...' : isHolding ? 'Keep Holding...' : 'Press & Hold to Confirm Stop'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}