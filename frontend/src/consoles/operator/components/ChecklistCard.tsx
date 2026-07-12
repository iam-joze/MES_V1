import { ListChecks, CheckCircle2, Check } from 'lucide-react';
import type { ChecklistItem } from '../types';

export function ChecklistCard({
  items,
  timing,
  onToggle,
}: {
  items: ChecklistItem[];
  timing: string;
  onToggle: (id: string) => void;
}) {
  const doneCount = items.filter((i) => i.checked).length;
  const allDone = doneCount === items.length;
  const pct = items.length ? (doneCount / items.length) * 100 : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <ListChecks size={20} className="text-navy-700" strokeWidth={2.5} />
          <h3 className="text-lg font-bold text-slate-900">Pre-Start Checklist</h3>
        </div>
        {allDone ? (
          <span className="flex items-center gap-1 text-success-700 font-semibold text-sm">
            <CheckCircle2 size={16} strokeWidth={2.5} />
            Done
          </span>
        ) : (
          <span className="text-sm font-semibold text-slate-500">
            {doneCount}/{items.length}
          </span>
        )}
      </div>

      <span className="inline-block px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold mb-3">
        Required at START and END
      </span>

      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all ${allDone ? 'bg-success-500' : 'bg-slate-300'}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onToggle(item.id)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
              item.checked ? 'bg-success-50' : 'bg-slate-50'
            }`}
          >
            <span
              className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center border-2 ${
                item.checked ? 'bg-success-500 border-success-500' : 'border-slate-300 bg-white'
              }`}
            >
              {item.checked && <Check size={16} className="text-white" strokeWidth={3} />}
            </span>
            <span
              className={`text-base flex-1 ${
                item.checked ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'
              }`}
            >
              {item.text}
            </span>
            {item.checked && <CheckCircle2 size={18} className="text-success-500 flex-shrink-0" strokeWidth={2.5} />}
          </button>
        ))}
      </div>
    </div>
  );
}