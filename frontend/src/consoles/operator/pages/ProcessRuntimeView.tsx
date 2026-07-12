import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Lock, Play, Pause, Square, AlertTriangle } from 'lucide-react';
import { getEntryById } from '../data/mockOperatorData';
import type { ChecklistItem, ProcessEntryStatus, QcQuestion } from '../types';
import { GuidelinesCard } from '../components/GuidelinesCard';
import { ChecklistCard } from '../components/ChecklistCard';
import { QuantityLogCard } from '../components/QuantityLogCard';
import { QualityControlCard } from '../components/QualityControlCard';
import { ReportIssueOverlay } from '../components/ReportIssueOverlay';

function formatTimer(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

const STATUS_HEADER_STYLE: Record<ProcessEntryStatus, string> = {
  AVAILABLE: 'bg-slate-100 text-slate-500',
  RUNNING: 'bg-info-50 text-info-700',
  PAUSED: 'bg-amber-50 text-amber-700',
  COMPLETED: 'bg-success-50 text-success-700',
};

const STATUS_HEADER_LABEL: Record<ProcessEntryStatus, string> = {
  AVAILABLE: 'READY TO START',
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
};

// O2. Process Runtime View — UI Brief §5.3, SRS 4.3.2 / 4.3.3 / 4.3.4
export function ProcessRuntimeView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const entry = id ? getEntryById(id) : undefined;

  const [status, setStatus] = useState<ProcessEntryStatus>(entry?.status ?? 'AVAILABLE');
  const [elapsed, setElapsed] = useState(entry?.elapsedSeconds ?? 0);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(entry?.checklist?.items ?? []);
  const [qcAnswers, setQcAnswers] = useState<QcQuestion[]>(entry?.qcForm?.questions ?? []);
  const [reportIssueOpen, setReportIssueOpen] = useState(false);

  useEffect(() => {
    if (status !== 'RUNNING') return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

  if (!entry) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-500 text-base mb-4">This process entry could not be found.</p>
        <button onClick={() => navigate('/operator')} className="text-navy-600 font-semibold">
          Back to My Assignments
        </button>
      </div>
    );
  }

  const requiredItems = checklist; // timing "Both" applies to all items here
  const allChecklistDone = requiredItems.length === 0 || requiredItems.every((i) => i.checked);
  const checklistDoneCount = requiredItems.filter((i) => i.checked).length;

  const toggleChecklistItem = (itemId: string) => {
    setChecklist((items) => items.map((i) => (i.id === itemId ? { ...i, checked: !i.checked } : i)));
  };

  const updateQcAnswer = (qId: string, value: string) => {
    setQcAnswers((qs) => qs.map((q) => (q.id === qId ? { ...q, value } : q)));
  };

  const handleStart = () => {
    if (!allChecklistDone) return;
    setStatus('RUNNING');
  };

  const handlePause = () => {
    // NOTE: O4 (Pause Reason) has no screenshot reference yet — per the SRS this
    // should open a reason-select modal first. Pausing directly here as a
    // placeholder until that screen's design is provided.
    setStatus('PAUSED');
  };

  const handleResume = () => setStatus('RUNNING');

  const handleEnd = () => {
    if (!allChecklistDone) return; // VAL-O2-2
    setStatus('COMPLETED');
  };

  return (
    <div className="pb-8 relative">
      {/* Header: back, status badge + timer, title/subtitle */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={() => navigate('/operator')}
            aria-label="Back to assignments"
            className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${STATUS_HEADER_STYLE[status]}`}>
              {STATUS_HEADER_LABEL[status]}
            </span>
            <span className="font-mono text-base font-bold text-slate-900 tabular-nums">
              {formatTimer(elapsed)}
            </span>
          </div>
        </div>
        <h1 className="text-xl font-bold text-slate-900 leading-tight">{entry.stageName}</h1>
        <p className="text-base text-slate-500">
          {entry.parentJobName} · {entry.jobProductName}
        </p>
      </header>

      <div className="px-4 pt-4">
        {/* Start / Pause / End controls — most prominent element per FR-4.3.2 */}
        {status === 'AVAILABLE' &&
          (allChecklistDone && requiredItems.length > 0 ? (
            <button
              type="button"
              onClick={handleStart}
              className="w-full py-4 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-base font-bold tracking-wide flex items-center justify-center gap-2 mb-1 transition-colors"
            >
              <Play size={20} strokeWidth={2.5} />
              START PROCESS
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="w-full py-4 rounded-xl bg-slate-300 text-white text-base font-bold tracking-wide flex items-center justify-center gap-2 mb-1 cursor-not-allowed"
            >
              <Lock size={18} strokeWidth={2.5} />
              CHECKLIST REQUIRED
            </button>
          ))}
        {status === 'AVAILABLE' && requiredItems.length > 0 && !allChecklistDone && (
          <p className="text-center text-sm text-slate-500 mb-4">
            Complete {requiredItems.length - checklistDoneCount} required checklist item
            {requiredItems.length - checklistDoneCount === 1 ? '' : 's'} below to unlock
          </p>
        )}
        {status === 'AVAILABLE' && (requiredItems.length === 0 || allChecklistDone) && (
          <div className="mb-4" />
        )}

        {status === 'RUNNING' && (
          <div className="flex gap-3 mb-4">
            <button
              type="button"
              onClick={handlePause}
              className="flex-1 py-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-base font-bold tracking-wide flex items-center justify-center gap-2 transition-colors"
            >
              <Pause size={20} strokeWidth={2.5} />
              PAUSE
            </button>
            <button
              type="button"
              onClick={handleEnd}
              className="flex-1 py-4 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-base font-bold tracking-wide flex items-center justify-center gap-2 transition-colors"
            >
              <Square size={18} strokeWidth={2.5} />
              END PROCESS
            </button>
          </div>
        )}

        {status === 'PAUSED' && (
          <button
            type="button"
            onClick={handleResume}
            className="w-full py-4 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-base font-bold tracking-wide flex items-center justify-center gap-2 mb-4 transition-colors"
          >
            <Play size={20} strokeWidth={2.5} />
            RESUME
          </button>
        )}

        {/* Guidelines — shown directly if enabled */}
        {entry.guidelines && (
          <GuidelinesCard content={entry.guidelines.content} diagram={entry.guidelines.diagram} />
        )}

        {/* Checklist — shown directly if enabled */}
        {entry.checklist && (
          <ChecklistCard items={checklist} timing={entry.checklist.timing} onToggle={toggleChecklistItem} />
        )}

        {/* Quantity + QC — expandable sections, only relevant once Running/Paused */}
        {(status === 'RUNNING' || status === 'PAUSED') && entry.quantity && (
          <QuantityLogCard batchesRecorded={entry.quantity.batchesRecorded} />
        )}
        {(status === 'RUNNING' || status === 'PAUSED') && entry.qcForm && (
          <QualityControlCard questions={qcAnswers} onChange={updateQcAnswer} />
        )}
      </div>

      {/* Report Fault/Issue — persistent, distinct from Pause */}
      {status !== 'COMPLETED' && (
        <div className="px-4 mt-2">
          <button
            type="button"
            onClick={() => setReportIssueOpen(true)}
            className="w-full py-3.5 rounded-xl border-2 border-danger-300 bg-white text-danger-600 text-base font-bold flex items-center justify-center gap-2"
          >
            <AlertTriangle size={18} strokeWidth={2.5} />
            REPORT FAULT / ISSUE
          </button>
        </div>
      )}

      {reportIssueOpen && (
        <ReportIssueOverlay
          entry={entry}
          status={status}
          elapsedLabel={formatTimer(elapsed)}
          onClose={() => setReportIssueOpen(false)}
        />
      )}
    </div>
  );
}