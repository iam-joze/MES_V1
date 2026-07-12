import { useState } from 'react';
import { X, ChevronDown, Camera, Package, ArrowLeft } from 'lucide-react';
import type { ProcessEntry, ProcessEntryStatus } from '../types';

const FAULT_CATEGORIES = [
  { id: 'seal-fail', label: 'Seal Integrity Failure', severity: 'Critical' as const },
  { id: 'temp-dev', label: 'Temperature Deviation', severity: 'Minor' as const },
  { id: 'equip-jam', label: 'Equipment Jam', severity: 'Critical' as const },
  { id: 'material-short', label: 'Material Shortage', severity: 'Minor' as const },
];

// O3. Report Issue — UI Brief §5.3, SRS 4.4.1. Reached only from O2; the process
// keeps running while this is open, and Submit/Cancel both return to O2.
export function ReportIssueOverlay({
  entry,
  status,
  elapsedLabel,
  onClose,
}: {
  entry: ProcessEntry;
  status: ProcessEntryStatus;
  elapsedLabel: string;
  onClose: () => void;
}) {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [photoAttached, setPhotoAttached] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectedCategory = FAULT_CATEGORIES.find((c) => c.id === categoryId);
  const canSubmit = !!categoryId; // VAL-O3-1

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    // TODO: emit `fault:report` over the socket per Architecture doc §2.2.2
    setTimeout(() => {
      setSubmitting(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-30 bg-white max-w-md mx-auto overflow-y-auto">
      {/* Ghost header behind the close button, matching the running O2 bar underneath */}
      <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center"
        >
          <X size={18} strokeWidth={2.5} />
        </button>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-info-50 text-info-700">
            {status}
          </span>
          <span className="font-mono text-base font-bold text-slate-900 tabular-nums">{elapsedLabel}</span>
        </div>
      </div>

      <div className="px-4 pt-3 pb-8">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 text-info-700 font-semibold text-base mb-4"
        >
          <ArrowLeft size={16} strokeWidth={2.5} />
          Return to Active Process
        </button>

        {/* Job context strip */}
        <div className="flex items-center gap-2 bg-slate-50 rounded-xl border border-slate-100 px-3 py-2.5 mb-6 text-sm">
          <Package size={16} className="text-slate-400 flex-shrink-0" strokeWidth={2.5} />
          <span className="font-bold text-slate-700 flex-shrink-0">{entry.jobId}</span>
          <span className="text-slate-500 truncate">
            {entry.stageName} · {entry.jobProductName}
          </span>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-1">Report Issue</h2>
        <p className="text-base text-slate-500 mb-6">
          Log a production problem. The process keeps running while you report.
        </p>

        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Fault Category</label>
        <div className="relative mb-6">
          <button
            type="button"
            onClick={() => setCategoryOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border-2 border-slate-200 text-base focus:outline-none focus:border-navy-500"
          >
            {selectedCategory ? (
              <span className="flex items-center gap-2 text-slate-900 font-medium">
                {selectedCategory.label}
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    selectedCategory.severity === 'Critical'
                      ? 'bg-danger-50 text-danger-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {selectedCategory.severity}
                </span>
              </span>
            ) : (
              <span className="text-slate-400">Select a fault category...</span>
            )}
            <ChevronDown size={18} className="text-slate-400" strokeWidth={2.5} />
          </button>

          {categoryOpen && (
            <div className="absolute z-10 mt-2 w-full bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
              {FAULT_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setCategoryId(cat.id);
                    setCategoryOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                >
                  <span className="text-slate-900 font-medium">{cat.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      cat.severity === 'Critical' ? 'bg-danger-50 text-danger-700' : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {cat.severity}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Photo Evidence</label>
        {photoAttached ? (
          <div className="flex items-center gap-3 mb-6 p-3 rounded-xl border-2 border-slate-200">
            <div className="w-14 h-14 rounded-lg bg-slate-200 flex items-center justify-center">
              <Camera size={20} className="text-slate-400" strokeWidth={2} />
            </div>
            <span className="flex-1 text-base text-slate-700 font-medium">Photo attached</span>
            <button
              type="button"
              onClick={() => setPhotoAttached(false)}
              className="text-danger-600 text-sm font-semibold"
            >
              Remove
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setPhotoAttached(true)}
            className="w-full flex flex-col items-center justify-center gap-2 py-8 mb-6 rounded-xl border-2 border-dashed border-slate-300 text-center"
          >
            <span className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center">
              <Camera size={20} className="text-slate-500" strokeWidth={2.5} />
            </span>
            <span className="text-base font-bold text-slate-700">Tap to Attach Photo of Issue</span>
            <span className="text-sm text-slate-400">Camera roll will open</span>
          </button>
        )}

        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Additional Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Describe what happened, where it occurred, and any immediate actions taken..."
          rows={4}
          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:border-navy-500 focus:ring-4 focus:ring-navy-500/10 resize-none mb-6"
        />

        <button
          type="button"
          disabled={!canSubmit || submitting}
          onClick={handleSubmit}
          className={`w-full py-4 rounded-xl text-base font-bold transition-colors ${
            canSubmit && !submitting
              ? 'bg-navy-900 hover:bg-navy-800 text-white'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {submitting ? 'Submitting...' : 'Submit Issue to Control Dashboard'}
        </button>
      </div>
    </div>
  );
}