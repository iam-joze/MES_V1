import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Play,
  Pause,
  Square,
  Loader2,
  CheckCircle2,
  ZoomIn,
  Plus,
  Minus,
  Check,
  X,
  AlertTriangle,
  ClipboardList,
  FlaskConical,
  ListChecks,
  FileText,
  AlertOctagon,
  Lock,
  ShieldAlert,
  Clock,
} from 'lucide-react';
import type { RuntimeStageDetail, ChecklistItem, QCQuestion, QuantityMetric, BatchQuantityLog } from '../types/operatorModule';
import { fetchRuntimeStageDetail, updateStageStatus } from '../data/operatorModuleData';
import { IssueLogger, InterruptionIntercept } from './OperatorIssueLogger';
import { supabase } from '../lib/supabase';
import { reportPauseEvent } from '../lib/sharedState';

interface OperatorRuntimeProps {
  stageId: string;
  onBack: () => void;
}

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatScheduledTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getCountdown(iso: string): string {
  const now = new Date();
  const target = new Date(iso);
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return 'now';
  const diffMins = Math.floor(diffMs / 60000);
  const diffSecs = Math.floor((diffMs % 60000) / 1000);
  if (diffMins >= 60) {
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hrs}h ${mins}m`;
  }
  return `${diffMins}m ${diffSecs}s`;
}

const INTERRUPTION_REASONS: Record<string, string> = {
  mat_delay: 'Waiting for Materials',
  equip_issue: 'Equipment Malfunction',
  quality_issue: 'Quality Concern',
  safety_concern: 'Safety Hazard',
  changeover: 'Product Changeover',
  maintenance: 'Scheduled Maintenance',
};

// ============================================================
// Checklist Blocker Banner
// ============================================================
function ChecklistBlockerBanner({
  action,
  timing,
  remaining,
  onDismiss,
}: {
  action: 'start' | 'end';
  timing: string;
  remaining: number;
  onDismiss: () => void;
}) {
  const actionLabel = action === 'start' ? 'START PROCESS' : 'END PROCESS';
  const timingLabel =
    timing === 'before_start' ? 'before starting'
    : timing === 'before_completion' ? 'before completing'
    : 'before this action';

  return (
    <div className="mx-4 mt-3 p-4 rounded-2xl bg-warning-500 text-white animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-start gap-3">
        <ShieldAlert size={24} strokeWidth={2.5} className="flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-bold text-base leading-tight">Checklist Required</p>
          <p className="text-sm font-medium opacity-90 mt-0.5">
            Complete {remaining} required item{remaining !== 1 ? 's' : ''} {timingLabel} you can {actionLabel}.
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 active:bg-white/30 flex-shrink-0"
        >
          <X size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Section A: Operating Guidelines
// ============================================================
function GuidelinesSection({ content }: { content: string }) {
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <section className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
        <FileText size={22} className="text-navy-600" strokeWidth={2.5} />
        <h2 className="text-lg font-bold text-slate-900">Operating Guidelines</h2>
      </div>
      <div className="px-5 py-4">
        <p className="text-base text-slate-700 leading-relaxed whitespace-pre-line">{content}</p>
      </div>
      {/* Schematic diagram */}
      <button
        onClick={() => setIsZoomed(true)}
        className="w-full border-t border-slate-100 active:opacity-80 transition-opacity"
      >
        <div className="aspect-video bg-gradient-to-br from-navy-50 to-slate-100 flex items-center justify-center relative">
          <svg viewBox="0 0 400 200" className="w-full h-full p-4">
            <rect x="20" y="60" width="80" height="80" rx="8" fill="none" stroke="#334e68" strokeWidth="3" />
            <rect x="140" y="40" width="120" height="120" rx="8" fill="none" stroke="#334e68" strokeWidth="3" />
            <rect x="300" y="60" width="80" height="80" rx="8" fill="none" stroke="#334e68" strokeWidth="3" />
            <line x1="100" y1="100" x2="140" y2="100" stroke="#334e68" strokeWidth="3" />
            <line x1="260" y1="100" x2="300" y2="100" stroke="#334e68" strokeWidth="3" />
            <text x="60" y="105" textAnchor="middle" fontSize="14" fill="#334e68" fontWeight="bold">Feed</text>
            <text x="200" y="105" textAnchor="middle" fontSize="14" fill="#334e68" fontWeight="bold">Process</text>
            <text x="340" y="105" textAnchor="middle" fontSize="14" fill="#334e68" fontWeight="bold">Output</text>
          </svg>
          <div className="absolute bottom-2 right-2 bg-navy-900/80 rounded-full px-3 py-1.5 flex items-center gap-1.5">
            <ZoomIn size={16} className="text-white" strokeWidth={2.5} />
            <span className="text-sm font-semibold text-white">Tap to zoom</span>
          </div>
        </div>
      </button>

      {isZoomed && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center p-4"
          onClick={() => setIsZoomed(false)}
        >
          <div className="relative w-full max-w-2xl bg-white rounded-2xl p-6">
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 active:bg-slate-200"
            >
              <X size={22} className="text-slate-600" strokeWidth={2.5} />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Process Diagram</h3>
            <svg viewBox="0 0 400 200" className="w-full h-auto">
              <rect x="20" y="60" width="80" height="80" rx="8" fill="none" stroke="#334e68" strokeWidth="3" />
              <rect x="140" y="40" width="120" height="120" rx="8" fill="none" stroke="#334e68" strokeWidth="3" />
              <rect x="300" y="60" width="80" height="80" rx="8" fill="none" stroke="#334e68" strokeWidth="3" />
              <line x1="100" y1="100" x2="140" y2="100" stroke="#334e68" strokeWidth="3" />
              <line x1="260" y1="100" x2="300" y2="100" stroke="#334e68" strokeWidth="3" />
              <text x="60" y="105" textAnchor="middle" fontSize="14" fill="#334e68" fontWeight="bold">Feed</text>
              <text x="200" y="105" textAnchor="middle" fontSize="14" fill="#334e68" fontWeight="bold">Process</text>
              <text x="340" y="105" textAnchor="middle" fontSize="14" fill="#334e68" fontWeight="bold">Output</text>
            </svg>
          </div>
        </div>
      )}
    </section>
  );
}

// ============================================================
// Section B: Pre-Start Checklist
// State is lifted to OperatorRuntime; this component is purely
// presentational and calls back on each toggle.
// ============================================================
interface ChecklistSectionProps {
  items: ChecklistItem[];
  validationTiming: string | null;
  checked: Set<string>;
  onToggle: (itemId: string, item: ChecklistItem) => void;
  isBlocking: boolean;
}

function ChecklistSection({ items, validationTiming, checked, onToggle, isBlocking }: ChecklistSectionProps) {
  const completedCount = items.filter(i => checked.has(i.id)).length;
  const requiredItems = items.filter(i => i.isRequired);
  const requiredDone = requiredItems.every(i => checked.has(i.id));

  const timingBadge =
    validationTiming === 'before_start' ? 'Required before START'
    : validationTiming === 'before_completion' ? 'Required before END'
    : validationTiming === 'both' ? 'Required at START and END'
    : null;

  return (
    <section className={`bg-white rounded-2xl border-2 overflow-hidden transition-all ${
      isBlocking ? 'border-warning-400 shadow-[0_0_0_3px_rgba(251,191,36,0.3)]' : 'border-slate-200'
    }`}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <ListChecks size={22} className={isBlocking ? 'text-warning-500' : 'text-navy-600'} strokeWidth={2.5} />
          <div>
            <h2 className="text-lg font-bold text-slate-900">Pre-Start Checklist</h2>
            {timingBadge && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                isBlocking
                  ? 'bg-warning-100 text-warning-700'
                  : 'bg-navy-100 text-navy-700'
              }`}>
                {timingBadge}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {requiredDone ? (
            <span className="flex items-center gap-1 text-sm font-semibold text-success-600 bg-success-50 px-2 py-1 rounded-full">
              <CheckCircle2 size={14} strokeWidth={2.5} />
              Done
            </span>
          ) : (
            <span className="text-sm font-semibold text-slate-500">
              {completedCount}/{items.length}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {items.length > 0 && (
        <div className="px-5 pt-3 pb-1">
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                requiredDone ? 'bg-success-500' : isBlocking ? 'bg-warning-400' : 'bg-navy-500'
              }`}
              style={{ width: `${(completedCount / items.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="p-4 space-y-2">
        {items.map((item) => {
          const isChecked = checked.has(item.id);
          return (
            <button
              key={item.id}
              onClick={() => onToggle(item.id, item)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left active:scale-[0.99] transition-transform ${
                isChecked ? 'bg-success-50' : 'bg-slate-50'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
                  isChecked
                    ? 'bg-success-500 border-success-500'
                    : 'bg-white border-slate-300'
                }`}
              >
                {isChecked && <Check size={20} className="text-white" strokeWidth={3} />}
              </div>
              <span
                className={`text-base flex-1 leading-snug ${
                  isChecked ? 'text-slate-400 line-through' : 'text-slate-800 font-medium'
                }`}
              >
                {item.itemText}
              </span>
              {item.isRequired && !isChecked && (
                <span className="text-xs font-bold text-danger-600 bg-danger-50 px-2 py-1 rounded-md flex-shrink-0">
                  REQUIRED
                </span>
              )}
              {item.isRequired && isChecked && (
                <CheckCircle2 size={18} className="text-success-500 flex-shrink-0" strokeWidth={2.5} />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ============================================================
// Section C: Multi-Metric Batch Quantity Logging
// ============================================================
function QuantitySection({
  metrics,
  stageId,
}: {
  metrics: QuantityMetric[];
  stageId: string;
}) {
  const [entries, setEntries] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [batchLogs, setBatchLogs] = useState<BatchQuantityLog[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const initial: Record<string, number> = {};
    metrics.forEach(m => {
      initial[m.id] = m.minValue ?? 0;
    });
    setEntries(initial);
  }, [metrics]);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await supabase
        .from('stage_quantity_logs')
        .select('*')
        .eq('stage_id', stageId)
        .order('logged_at', { ascending: false });
      if (data) {
        setBatchLogs(data.map((row: any) => ({
          id: row.id,
          batchNumber: row.batch_number,
          entries: row.entries,
          notes: row.notes || '',
          loggedAt: row.logged_at,
        })));
      }
    };
    fetchLogs();
  }, [stageId]);

  const updateEntry = (metricId: string, value: number) => {
    setEntries(prev => ({ ...prev, [metricId]: value }));
  };

  const submitBatch = async () => {
    setIsSubmitting(true);
    try {
      const batchNumber = batchLogs.length + 1;
      const entryArray = metrics.map(m => ({
        metricId: m.id,
        metricName: m.metricName,
        unitLabel: m.unitLabel,
        value: entries[m.id] ?? 0,
      }));

      const { data, error } = await supabase
        .from('stage_quantity_logs')
        .insert({
          stage_id: stageId,
          batch_number: batchNumber,
          entries: entryArray,
          notes: notes.trim() || null,
          logged_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!error && data) {
        setBatchLogs(prev => [{
          id: data.id,
          batchNumber: data.batch_number,
          entries: data.entries,
          notes: data.notes || '',
          loggedAt: data.logged_at,
        }, ...prev]);
        setNotes('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
        <ClipboardList size={22} className="text-navy-600" strokeWidth={2.5} />
        <h2 className="text-lg font-bold text-slate-900">Quantity Log</h2>
        <span className="ml-auto text-sm text-slate-500">{batchLogs.length} batches recorded</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Metric Entry Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metrics.map(m => {
            const val = entries[m.id] ?? m.minValue ?? 0;
            const hasRange = m.minValue !== null && m.maxValue !== null;
            const rangePercent = hasRange
              ? Math.min(100, ((val - (m.minValue ?? 0)) / ((m.maxValue ?? 1) - (m.minValue ?? 0))) * 100)
              : null;

            return (
              <div key={m.id} className="p-4 bg-slate-50 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{m.metricName}</span>
                  <span className="text-sm text-slate-500">{m.unitLabel}</span>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => updateEntry(m.id, Math.max(val - 1, m.minValue ?? 0))}
                    className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <Minus size={18} className="text-slate-700" />
                  </button>
                  <input
                    type="number"
                    value={val}
                    onChange={e => updateEntry(m.id, parseFloat(e.target.value) || 0)}
                    className="w-24 text-center text-2xl font-bold text-slate-900 bg-white border border-slate-200 rounded-lg py-1"
                  />
                  <button
                    onClick={() => updateEntry(m.id, Math.min(val + 1, m.maxValue ?? Infinity))}
                    className="w-10 h-10 rounded-lg bg-navy-900 flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <Plus size={18} className="text-white" />
                  </button>
                </div>

                {rangePercent !== null && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Min: {m.minValue}</span>
                      <span>Max: {m.maxValue}</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-navy-500 rounded-full transition-all"
                        style={{ width: `${rangePercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notes (optional)</label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add batch notes..."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={submitBatch}
          disabled={isSubmitting}
          className="w-full py-3 bg-navy-900 hover:bg-navy-800 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
          <span>Log Batch #{batchLogs.length + 1}</span>
        </button>

        {/* Batch History */}
        {batchLogs.length > 0 && (
          <div className="mt-6 space-y-2">
            <h3 className="text-sm font-semibold text-slate-700">Batch History</h3>
            {batchLogs.map(log => (
              <div key={log.id} className="p-3 bg-slate-50 rounded-lg text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-slate-900">Batch #{log.batchNumber}</span>
                  <span className="text-xs text-slate-500">{new Date(log.loggedAt).toLocaleString()}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {log.entries.map((e, i) => (
                    <span key={i} className="px-2 py-0.5 bg-white rounded text-slate-600">
                      {e.metricName}: {e.value} {e.unitLabel}
                    </span>
                  ))}
                </div>
                {log.notes && <p className="text-slate-500 mt-1 italic">"{log.notes}"</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================
// Section D: QC Form
// ============================================================
function QCSection({ questions }: { questions: QCQuestion[] }) {
  const [responses, setResponses] = useState<Record<string, string | boolean>>({});

  return (
    <section className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
        <FlaskConical size={22} className="text-navy-600" strokeWidth={2.5} />
        <h2 className="text-lg font-bold text-slate-900">Quality Control Check</h2>
      </div>
      <div className="p-4 space-y-4">
        {questions.map((q) => (
          <div key={q.id} className="p-4 bg-slate-50 rounded-xl">
            <p className="text-base font-semibold text-slate-900 mb-3">{q.questionText}</p>
            {q.responseType === 'pass_fail' ? (
              <div className="flex gap-3">
                <button
                  onClick={() => setResponses((prev) => ({ ...prev, [q.id]: true }))}
                  className={`flex-1 py-3 rounded-xl font-bold text-base transition-colors flex items-center justify-center gap-2 ${
                    responses[q.id] === true
                      ? 'bg-success-500 text-white'
                      : 'bg-white border-2 border-slate-200 text-slate-600'
                  }`}
                >
                  <CheckCircle2 size={20} strokeWidth={2.5} />
                  PASS
                </button>
                <button
                  onClick={() => setResponses((prev) => ({ ...prev, [q.id]: false }))}
                  className={`flex-1 py-3 rounded-xl font-bold text-base transition-colors flex items-center justify-center gap-2 ${
                    responses[q.id] === false
                      ? 'bg-danger-500 text-white'
                      : 'bg-white border-2 border-slate-200 text-slate-600'
                  }`}
                >
                  <X size={20} strokeWidth={2.5} />
                  FAIL
                </button>
              </div>
            ) : q.responseType === 'numeric' ? (
              <div>
                <input
                  type="number"
                  value={(responses[q.id] as string) || ''}
                  onChange={(e) => setResponses((prev) => ({ ...prev, [q.id]: e.target.value }))}
                  placeholder="Enter value..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-xl font-bold text-slate-900 focus:outline-none focus:border-navy-500"
                />
                {q.numericTolerance !== null && (
                  <p className="text-sm text-slate-500 mt-1.5">
                    Target range: {q.numericMinValue}–{q.numericMaxValue} (±{q.numericTolerance})
                  </p>
                )}
              </div>
            ) : (
              <textarea
                rows={3}
                value={(responses[q.id] as string) || ''}
                onChange={(e) => setResponses((prev) => ({ ...prev, [q.id]: e.target.value }))}
                placeholder="Type your response..."
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-base text-slate-900 focus:outline-none focus:border-navy-500 resize-none"
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ============================================================
// Main O2 Runtime Component
// ============================================================
export function OperatorRuntime({ stageId, onBack }: OperatorRuntimeProps) {
  const [detail, setDetail] = useState<RuntimeStageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isEmergencyStop, setIsEmergencyStop] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isIssueLoggerOpen, setIsIssueLoggerOpen] = useState(false);
  const [isInterruptionOpen, setIsInterruptionOpen] = useState(false);
  // Checklist state — lifted from ChecklistSection so OperatorRuntime can enforce timing
  const [checklistChecked, setChecklistChecked] = useState<Set<string>>(new Set());
  const [checklistBlockingAction, setChecklistBlockingAction] = useState<'start' | 'end' | null>(null);
  const [scheduleBlocked, setScheduleBlocked] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch stage detail
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchRuntimeStageDetail(stageId);
        if (!cancelled && data) {
          setDetail(data);
          if (data.status === 'running') {
            setIsRunning(true);
            setIsPaused(false);
          } else if (data.status === 'paused') {
            if (data.jobId === 'JOB-404') {
              setIsEmergencyStop(true);
            } else {
              setIsPaused(true);
            }
          }
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load process');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [stageId]);

  // Load persisted checklist state from Supabase
  useEffect(() => {
    if (!detail?.checklistEnabled || detail.checklistItems.length === 0) return;
    supabase
      .from('stage_checklist_responses')
      .select('checklist_item_id, is_checked')
      .eq('stage_id', detail.id)
      .eq('is_checked', true)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setChecklistChecked(new Set(data.map((r: any) => r.checklist_item_id)));
        }
      });
  }, [detail?.id, detail?.checklistEnabled, detail?.checklistItems.length]);

  // Ticking timer
  useEffect(() => {
    if (isRunning && !isPaused && !isEmergencyStop) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, isPaused, isEmergencyStop]);

  // Schedule gate check: block START if before scheduledStartAt
  useEffect(() => {
    if (!detail?.scheduledStartAt) {
      setScheduleBlocked(false);
      return;
    }
    const check = () => {
      const now = new Date();
      const scheduled = new Date(detail.scheduledStartAt!);
      setScheduleBlocked(now < scheduled);
    };
    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, [detail?.scheduledStartAt]);

  // Derived checklist enforcement values
  const timing = detail?.checklistValidationTiming as 'before_start' | 'before_completion' | 'both' | null;
  const hasChecklist = !!(detail?.checklistEnabled && detail.checklistItems.length > 0);
  const requiredItems = detail?.checklistItems.filter(i => i.isRequired) ?? [];
  const allRequiredDone = requiredItems.length === 0 || requiredItems.every(i => checklistChecked.has(i.id));
  const remainingRequired = requiredItems.filter(i => !checklistChecked.has(i.id)).length;

  const startBlocked = hasChecklist && (timing === 'before_start' || timing === 'both') && !allRequiredDone;
  const endBlocked = hasChecklist && (timing === 'before_completion' || timing === 'both') && !allRequiredDone;

  // Toggle a checklist item and persist to Supabase
  const handleChecklistToggle = useCallback((itemId: string, item: ChecklistItem) => {
    const nowChecked = !checklistChecked.has(itemId);
    setChecklistChecked(prev => {
      const next = new Set(prev);
      if (nowChecked) next.add(itemId); else next.delete(itemId);
      return next;
    });
    // Clear blocking banner when progress is made
    setChecklistBlockingAction(null);
    // Persist to Supabase (upsert — fire-and-forget)
    if (detail) {
      supabase
        .from('stage_checklist_responses')
        .upsert({
          stage_id: detail.id,
          checklist_item_id: itemId,
          item_text: item.itemText,
          is_checked: nowChecked,
          checked_at: nowChecked ? new Date().toISOString() : null,
          stage_name: detail.stageName,
          operator_name: detail.operatorName,
        }, { onConflict: 'stage_id,checklist_item_id' })
        .then(() => {});
    }
  }, [detail, checklistChecked]);

  const handleStart = useCallback(async () => {
    if (!detail) return;
    if (scheduleBlocked) return;
    if (startBlocked) {
      setChecklistBlockingAction('start');
      return;
    }
    setChecklistBlockingAction(null);
    setIsRunning(true);
    setIsPaused(false);
    try {
      await updateStageStatus(detail.id, 'running');
      await supabase
        .from('job_process_stages')
        .update({ actual_started_at: new Date().toISOString() })
        .eq('id', detail.id);
    } catch {
      // Non-blocking
    }
  }, [detail, startBlocked, scheduleBlocked]);

  const handlePause = useCallback(() => {
    if (!detail) return;
    setIsInterruptionOpen(true);
  }, [detail]);

  const handleInterruptionSelect = useCallback(
    async (reasonId: string) => {
      if (!detail) return;
      setIsInterruptionOpen(false);
      setIsPaused(true);
      const reasonText = INTERRUPTION_REASONS[reasonId] || reasonId;
      // Notify manager via shared state
      reportPauseEvent({
        stageId: detail.id,
        jobId: detail.jobId,
        jobName: detail.jobName,
        stageName: detail.stageName,
        operatorName: detail.operatorName,
        operatorPhone: '',
        reason: reasonText,
      });
      try {
        await updateStageStatus(detail.id, 'paused');
      } catch {
        // Non-blocking
      }
    },
    [detail]
  );

  const handleInterruptionCancel = useCallback(() => {
    setIsInterruptionOpen(false);
  }, []);

  const handleResume = useCallback(async () => {
    if (!detail) return;
    setIsPaused(false);
    try {
      await updateStageStatus(detail.id, 'running');
    } catch {
      // Non-blocking
    }
  }, [detail]);

  const handleEndProcess = useCallback(async () => {
    if (!detail) return;
    if (endBlocked) {
      setChecklistBlockingAction('end');
      return;
    }
    setChecklistBlockingAction(null);
    setIsRunning(false);
    setIsPaused(false);
    try {
      await updateStageStatus(detail.id, 'completed');
      await supabase
        .from('job_process_stages')
        .update({ actual_ended_at: new Date().toISOString() })
        .eq('id', detail.id);
    } catch {
      // Non-blocking
    }
  }, [detail, endBlocked]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center max-w-md mx-auto">
        <Loader2 size={32} className="text-navy-500 animate-spin" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center max-w-md mx-auto px-6 text-center">
        <div className="w-16 h-16 bg-danger-100 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle size={32} className="text-danger-600" strokeWidth={2.5} />
        </div>
        <p className="text-lg font-bold text-slate-900 mb-1">Unable to Load Process</p>
        <p className="text-base text-slate-500 mb-6">{error || 'Unknown error'}</p>
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-xl bg-navy-900 text-white text-base font-bold active:bg-navy-800"
        >
          Back to Assignments
        </button>
      </div>
    );
  }

  const getStatusLabel = () => {
    if (isEmergencyStop) return { label: 'EMERGENCY STOP', color: 'text-danger-600', bg: 'bg-danger-100' };
    if (!isRunning && !isPaused) return { label: 'READY TO START', color: 'text-slate-600', bg: 'bg-slate-100' };
    if (isRunning && !isPaused) return { label: 'RUNNING', color: 'text-cyan-700', bg: 'bg-cyan-100' };
    if (isPaused) return { label: 'PAUSED', color: 'text-warning-700', bg: 'bg-warning-100' };
    return { label: 'COMPLETED', color: 'text-success-700', bg: 'bg-success-100' };
  };
  const statusLabel = getStatusLabel();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto">
      {/* ============================================================ */}
      {/* Top persistent header */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="px-4 pt-3 pb-3">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={onBack}
              className="w-11 h-11 flex items-center justify-center rounded-full bg-slate-100 active:bg-slate-200 transition-colors"
            >
              <ArrowLeft size={24} className="text-slate-700" strokeWidth={2.5} />
            </button>

            {/* Live timer */}
            <div className="flex items-center gap-2">
              <div className={`px-3 py-1 rounded-full text-sm font-bold ${statusLabel.bg} ${statusLabel.color}`}>
                {statusLabel.label}
              </div>
              <div className="font-mono text-xl font-bold text-slate-900 tabular-nums">
                {formatDuration(elapsedSeconds)}
              </div>
            </div>
          </div>

          {/* Stage name + job context */}
          <div className="mt-1">
            <h1 className="text-xl font-bold text-slate-900 leading-tight">{detail.stageName}</h1>
            <p className="text-sm text-slate-500">{detail.jobName} · {detail.productName}</p>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* Emergency stop frozen state */}
      {/* ============================================================ */}
      {isEmergencyStop && (
        <div className="mx-4 mt-4 p-5 rounded-2xl bg-danger-500 text-white animate-pulse">
          <div className="flex items-center gap-3">
            <AlertOctagon size={32} strokeWidth={2.5} />
            <div>
              <p className="text-lg font-bold">EMERGENCY STOP ACTIVE</p>
              <p className="text-sm font-medium opacity-90">Process frozen by manager. Await authorization to resume.</p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* Checklist blocking banner */}
      {/* ============================================================ */}
      {checklistBlockingAction && timing && (
        <ChecklistBlockerBanner
          action={checklistBlockingAction}
          timing={timing}
          remaining={remainingRequired}
          onDismiss={() => setChecklistBlockingAction(null)}
        />
      )}

      {/* ============================================================ */}
      {/* Primary execution controls */}
      {/* ============================================================ */}
      {!isEmergencyStop && (
        <div className="px-4 pt-4">
          {!isRunning && !isPaused && (
            <div className="space-y-2">
              {scheduleBlocked && detail.scheduledStartAt ? (
                <>
                  <button
                    disabled
                    className="w-full py-5 rounded-2xl bg-slate-300 text-slate-600 text-xl font-bold tracking-wide flex items-center justify-center gap-3 cursor-not-allowed"
                  >
                    <Clock size={26} strokeWidth={2.5} />
                    SCHEDULED
                  </button>
                  <div className="text-center p-3 bg-navy-50 rounded-xl border border-navy-200">
                    <p className="text-sm font-semibold text-navy-700">
                      Scheduled for {formatScheduledTime(detail.scheduledStartAt)}
                    </p>
                    <p className="text-xs text-navy-500 mt-1">
                      Starts in {getCountdown(detail.scheduledStartAt)}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={handleStart}
                    className={`w-full py-5 rounded-2xl text-white text-xl font-bold tracking-wide shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3 ${
                      startBlocked
                        ? 'bg-slate-400 active:bg-slate-500'
                        : 'bg-success-500 active:bg-success-600'
                    }`}
                  >
                    {startBlocked ? (
                      <>
                        <Lock size={26} strokeWidth={2.5} />
                        CHECKLIST REQUIRED
                      </>
                    ) : (
                      <>
                        <Play size={28} fill="white" strokeWidth={2.5} />
                        START PROCESS
                      </>
                    )}
                  </button>
                  {startBlocked && (
                    <p className="text-center text-sm text-slate-500 font-medium">
                      Complete {remainingRequired} required checklist item{remainingRequired !== 1 ? 's' : ''} below to unlock
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {isRunning && !isPaused && (
            <div className="space-y-2">
              <div className="flex gap-3">
                <button
                  onClick={handlePause}
                  className="flex-1 py-5 rounded-2xl bg-warning-500 text-white text-lg font-bold tracking-wide active:bg-warning-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Pause size={24} fill="white" strokeWidth={2.5} />
                  PAUSE
                </button>
                <button
                  onClick={handleEndProcess}
                  className={`flex-1 py-5 rounded-2xl text-white text-lg font-bold tracking-wide active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
                    endBlocked ? 'bg-slate-400 active:bg-slate-500' : 'bg-danger-500 active:bg-danger-600'
                  }`}
                >
                  {endBlocked ? (
                    <><Lock size={22} strokeWidth={2.5} />LOCKED</>
                  ) : (
                    <><Square size={24} fill="white" strokeWidth={2.5} />END PROCESS</>
                  )}
                </button>
              </div>
              {endBlocked && (
                <p className="text-center text-sm text-slate-500 font-medium">
                  Complete required checklist items to unlock END PROCESS
                </p>
              )}
            </div>
          )}

          {isPaused && (
            <div className="space-y-2">
              <div className="flex gap-3">
                <button
                  onClick={handleResume}
                  className="flex-1 py-5 rounded-2xl bg-success-500 text-white text-lg font-bold tracking-wide active:bg-success-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Play size={24} fill="white" strokeWidth={2.5} />
                  RESUME
                </button>
                <button
                  onClick={handleEndProcess}
                  className={`flex-1 py-5 rounded-2xl text-white text-lg font-bold tracking-wide active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
                    endBlocked ? 'bg-slate-400 active:bg-slate-500' : 'bg-danger-500 active:bg-danger-600'
                  }`}
                >
                  {endBlocked ? (
                    <><Lock size={22} strokeWidth={2.5} />LOCKED</>
                  ) : (
                    <><Square size={24} fill="white" strokeWidth={2.5} />END PROCESS</>
                  )}
                </button>
              </div>
              {endBlocked && (
                <p className="text-center text-sm text-slate-500 font-medium">
                  Complete required checklist items to unlock END PROCESS
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* Scrollable body — blueprint sections */}
      {/* ============================================================ */}
      <main className="flex-1 px-4 py-4 space-y-4 pb-32">
        {detail.guidelinesEnabled && detail.guidelinesContent && (
          <GuidelinesSection content={detail.guidelinesContent} />
        )}
        {detail.checklistEnabled && detail.checklistItems.length > 0 && (
          <ChecklistSection
            items={detail.checklistItems}
            validationTiming={detail.checklistValidationTiming}
            checked={checklistChecked}
            onToggle={handleChecklistToggle}
            isBlocking={!!checklistBlockingAction}
          />
        )}
        {detail.quantityLoggingEnabled && detail.quantityMetrics.length > 0 && (
          <QuantitySection
            metrics={detail.quantityMetrics}
            stageId={stageId}
          />
        )}
        {detail.qcFormEnabled && detail.qcQuestions.length > 0 && (
          <QCSection questions={detail.qcQuestions} />
        )}
      </main>

      {/* ============================================================ */}
      {/* Pinned floating base bar — Report Issue */}
      {/* ============================================================ */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-4 py-4 bg-slate-50 border-t border-slate-200">
        <button
          onClick={() => setIsIssueLoggerOpen(true)}
          className="w-full py-4 rounded-2xl border-2 border-danger-300 bg-danger-50 text-danger-700 text-base font-bold active:bg-danger-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <AlertTriangle size={22} strokeWidth={2.5} />
          REPORT FAULT / ISSUE
        </button>
      </div>

      {/* O4: Interruption Intercept overlay */}
      <InterruptionIntercept
        isOpen={isInterruptionOpen}
        onSelectReason={handleInterruptionSelect}
        onCancel={handleInterruptionCancel}
      />

      {/* O3: Issue Logger full-page screen */}
      {isIssueLoggerOpen && detail && (
        <IssueLogger
          faultCategories={detail.faultCategories}
          stageName={detail.stageName}
          stageId={detail.id}
          jobId={detail.jobId}
          jobName={detail.jobName}
          productName={detail.productName}
          operatorName={detail.operatorName}
          onSubmit={() => setIsIssueLoggerOpen(false)}
          onBack={() => setIsIssueLoggerOpen(false)}
        />
      )}
    </div>
  );
}
