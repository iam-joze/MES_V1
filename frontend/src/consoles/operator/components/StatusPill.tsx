import { Loader2, PauseCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import type { ProcessEntryStatus } from '../types';

// Section 2.2 of the UI brief: colour + text label always paired, never colour alone.
// AVAILABLE -> Info, RUNNING -> Info (animated), PAUSED -> Warning, COMPLETED -> Success.
const STATUS_STYLES: Record<
  ProcessEntryStatus,
  { bg: string; text: string; label: string }
> = {
  AVAILABLE: { bg: 'bg-info-50 border border-info-100', text: 'text-info-700', label: 'AVAILABLE' },
  RUNNING: { bg: 'bg-info-50 border border-info-100', text: 'text-info-700', label: 'RUNNING' },
  PAUSED: { bg: 'bg-amber-50 border border-amber-100', text: 'text-amber-700', label: 'PAUSED' },
  COMPLETED: { bg: 'bg-success-50 border border-success-100', text: 'text-success-700', label: 'COMPLETED' },
};

function StatusIcon({ status }: { status: ProcessEntryStatus }) {
  if (status === 'RUNNING') return <Loader2 size={18} className="animate-spin" strokeWidth={2.5} />;
  if (status === 'PAUSED') return <PauseCircle size={18} strokeWidth={2.5} />;
  if (status === 'COMPLETED') return <CheckCircle2 size={18} strokeWidth={2.5} />;
  return <span className="w-2.5 h-2.5 rounded-full bg-info-500 flex-shrink-0" />;
}

export function StatusPill({
  status,
  withChevron = false,
}: {
  status: ProcessEntryStatus;
  withChevron?: boolean;
}) {
  const style = STATUS_STYLES[status];
  return (
    <div
      className={`w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl font-bold text-base ${style.bg} ${style.text}`}
    >
      <span className="flex items-center gap-2">
        <StatusIcon status={status} />
        {style.label}
      </span>
      {withChevron && <ChevronRight size={20} strokeWidth={2.5} />}
    </div>
  );
}