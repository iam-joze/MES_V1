import { FlaskConical, Check, X } from 'lucide-react';
import type { QcQuestion } from '../types';

export function QualityControlCard({
  questions,
  onChange,
}: {
  questions: QcQuestion[];
  onChange: (id: string, value: string) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <FlaskConical size={20} className="text-navy-700" strokeWidth={2.5} />
        <h3 className="text-lg font-bold text-slate-900">Quality Control Check</h3>
      </div>

      <div className="space-y-4">
        {questions.map((q) => (
          <div key={q.id}>
            <label className="block text-base font-semibold text-slate-700 mb-2">{q.questionText}</label>

            {q.responseType === 'PASS_FAIL' && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => onChange(q.id, 'PASS')}
                  className={`flex-1 py-3 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition-colors ${
                    q.value === 'PASS'
                      ? 'border-success-500 bg-success-50 text-success-700'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <Check size={18} strokeWidth={2.5} />
                  PASS
                </button>
                <button
                  type="button"
                  onClick={() => onChange(q.id, 'FAIL')}
                  className={`flex-1 py-3 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition-colors ${
                    q.value === 'FAIL'
                      ? 'border-danger-500 bg-danger-50 text-danger-700'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <X size={18} strokeWidth={2.5} />
                  FAIL
                </button>
              </div>
            )}

            {q.responseType === 'NUMERIC' && (
              <input
                type="number"
                value={q.value ?? ''}
                onChange={(e) => onChange(q.id, e.target.value)}
                placeholder="Enter value..."
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:border-navy-500 focus:ring-4 focus:ring-navy-500/10"
              />
            )}

            {q.responseType === 'TEXT' && (
              <textarea
                value={q.value ?? ''}
                onChange={(e) => onChange(q.id, e.target.value)}
                placeholder="Type your response..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:border-navy-500 focus:ring-4 focus:ring-navy-500/10 resize-none"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}