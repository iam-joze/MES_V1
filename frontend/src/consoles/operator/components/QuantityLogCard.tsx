import { useState } from 'react';
import { ClipboardList, Minus, Plus } from 'lucide-react';

function Stepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        <span className="text-xs text-slate-400">Units</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 active:scale-95 transition-transform"
          aria-label={`Decrease ${label}`}
        >
          <Minus size={16} strokeWidth={2.5} />
        </button>
        <div className="flex-1 h-10 rounded-lg border-2 border-slate-200 flex items-center justify-center text-lg font-bold text-slate-900">
          {value}
        </div>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-9 h-9 rounded-lg bg-navy-900 flex items-center justify-center text-white active:scale-95 transition-transform"
          aria-label={`Increase ${label}`}
        >
          <Plus size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

export function QuantityLogCard({ batchesRecorded }: { batchesRecorded: number }) {
  const [filled, setFilled] = useState(25);
  const [rejected, setRejected] = useState(18);
  const [notes, setNotes] = useState('');
  const [batchNumber, setBatchNumber] = useState(batchesRecorded + 1);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ClipboardList size={20} className="text-navy-700" strokeWidth={2.5} />
          <h3 className="text-lg font-bold text-slate-900">Quantity Log</h3>
        </div>
        <span className="text-sm text-slate-400">{batchesRecorded} batches recorded</span>
      </div>

      <div className="flex gap-4 mb-4">
        <Stepper label="Units Filled" value={filled} onChange={setFilled} />
        <Stepper label="Units Rejected" value={rejected} onChange={setRejected} />
      </div>

      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Notes (optional)</label>
      <input
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add batch notes..."
        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:border-navy-500 focus:ring-4 focus:ring-navy-500/10 mb-4"
      />

      <button
        type="button"
        onClick={() => setBatchNumber((n) => n + 1)}
        className="w-full py-3.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-base font-bold flex items-center justify-center gap-2 transition-colors"
      >
        <Plus size={18} strokeWidth={2.5} />
        Log Batch #{batchNumber}
      </button>
    </div>
  );
}