import { Link } from 'react-router-dom';
import { Package, MapPin, Clock, AlertTriangle } from 'lucide-react';
import type { ProcessEntry } from '../types';
import { StatusPill } from './StatusPill';

export function ProcessEntryCard({ entry }: { entry: ProcessEntry }) {
  return (
    <Link
      to={`/operator/process/${entry.id}`}
      className="block bg-white rounded-2xl border border-slate-200 p-4 mb-4 shadow-sm active:scale-[0.99] transition-transform"
    >
      {entry.isEmergencyStopped && (
        <div className="flex items-center gap-1.5 mb-2 text-danger-700 text-sm font-semibold">
          <AlertTriangle size={14} strokeWidth={2.5} />
          Halted by Manager — Emergency Stop
        </div>
      )}

      <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-1 min-w-0">
        <Package size={16} className="text-slate-400 flex-shrink-0" strokeWidth={2.5} />
        <span className="font-semibold text-slate-700 flex-shrink-0">{entry.jobId}</span>
        <span className="flex-shrink-0">·</span>
        <span className="truncate">{entry.jobProductName}</span>
      </div>

      <h3 className="text-lg font-bold text-slate-900 leading-tight">{entry.stageName}</h3>
      <p className="text-base text-slate-500 mb-3">{entry.parentJobName}</p>

      <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
        <span className="flex items-center gap-1">
          <MapPin size={14} strokeWidth={2.5} />
          {entry.stationTag}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={14} strokeWidth={2.5} />
          ~{entry.estimatedDurationMinutes} min
        </span>
      </div>

      <StatusPill status={entry.status} withChevron />
    </Link>
  );
}