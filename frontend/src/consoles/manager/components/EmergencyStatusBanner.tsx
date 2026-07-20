import { useEffect, useState } from 'react';
import { AlertOctagon, Unlock, Loader2, X } from 'lucide-react';
import { api } from '../../../shared/lib/api';

export interface PausedJob {
  id: string;
  jobId: string;
  name: string;
  line: { lineCode: string; name: string } | null;
  reason: string | null;
  notes: string | null;
  stoppedAt: string | null;
}

interface EmergencyStatusBannerProps {
  pausedJobs: PausedJob[];
  onResumed: () => void;
}

export function EmergencyStatusBanner({ pausedJobs, onResumed }: EmergencyStatusBannerProps) {
  const [flash, setFlash] = useState(true);
  const [confirmTarget, setConfirmTarget] = useState<PausedJob | 'all' | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setFlash((prev) => !prev), 500);
    return () => clearInterval(interval);
  }, []);

  if (pausedJobs.length === 0) return null;

  return (
    <>
      <div
        className={`px-6 py-3 border-b transition-colors duration-500 ${
          flash ? 'bg-danger-700 border-danger-800' : 'bg-danger-900 border-danger-950'
        }`}
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <AlertOctagon size={22} className={`animate-pulse ${flash ? 'text-danger-100' : 'text-white'}`} />
            <p className={`font-bold uppercase tracking-wide text-sm ${flash ? 'text-danger-50' : 'text-white'}`}>
              {pausedJobs.length} job{pausedJobs.length === 1 ? '' : 's'} halted by Emergency Stop — awaiting authorization to resume
            </p>
          </div>
          {pausedJobs.length > 1 && (
            <button
              onClick={() => setConfirmTarget('all')}
              className="flex items-center gap-2 px-4 py-2 bg-white text-danger-700 font-semibold rounded-lg hover:bg-danger-50 transition-colors text-sm flex-shrink-0"
            >
              <Unlock size={16} /> Resume All ({pausedJobs.length})
            </button>
          )}
        </div>
        <div className="mt-2.5 space-y-1.5">
          {pausedJobs.map((job) => (
            <div key={job.id} className="flex items-center justify-between gap-3 bg-black/15 rounded-lg px-3 py-2">
              <div className="min-w-0">
                <span className="text-sm font-semibold text-white">
                  {job.line?.lineCode ?? '—'} · {job.name}
                </span>
                {job.reason && <span className="text-xs text-danger-200 ml-2">{job.reason}</span>}
              </div>
              <button
                onClick={() => setConfirmTarget(job)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white/90 hover:bg-white text-danger-700 font-semibold rounded-md text-xs transition-colors"
              >
                <Unlock size={13} /> Authorize Resumption
              </button>
            </div>
          ))}
        </div>
      </div>

      {confirmTarget && (
        <ResumeConfirmModal
          target={confirmTarget}
          jobCount={pausedJobs.length}
          onCancel={() => setConfirmTarget(null)}
          onConfirmed={() => {
            setConfirmTarget(null);
            onResumed();
          }}
        />
      )}
    </>
  );
}

function ResumeConfirmModal({
  target,
  jobCount,
  onCancel,
  onConfirmed,
}: {
  target: PausedJob | 'all';
  jobCount: number;
  onCancel: () => void;
  onConfirmed: () => void;
}) {
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAll = target === 'all';

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/emergency-stop/resume', {
        scope: isAll ? 'facility_wide' : 'specific_job',
        jobId: isAll ? undefined : target.id,
        notes: notes.trim() || undefined,
      });
      onConfirmed();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to resume production.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-card-elevated overflow-hidden">
        <div className="px-6 py-4 bg-success-600 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <Unlock size={22} />
            <h2 className="font-bold">Authorize Workflow Resumption</h2>
          </div>
          <button onClick={onCancel} className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && <p className="text-sm text-danger-600 bg-danger-50 border border-danger-200 rounded-lg p-3">{error}</p>}
          <p className="text-sm text-slate-600">
            {isAll
              ? `This will resume all ${jobCount} job(s) currently halted by Emergency Stop. `
              : `This will resume "${target.name}". `}
            Make sure the situation that caused the stop has actually been resolved before proceeding.
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Resolution Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What was done to resolve this before resuming..."
              className="w-full h-20 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm resize-none"
            />
          </div>
        </div>
        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl bg-success-600 hover:bg-success-700 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Unlock size={18} />}
            {submitting ? 'Resuming...' : 'Confirm Resumption'}
          </button>
        </div>
      </div>
    </div>
  );
}
