import { FileText, ZoomIn } from 'lucide-react';
import type { GuidelinesDiagram } from '../types';

export function GuidelinesCard({
  content,
  diagram,
}: {
  content: string;
  diagram?: GuidelinesDiagram;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <FileText size={20} className="text-navy-700" strokeWidth={2.5} />
        <h3 className="text-lg font-bold text-slate-900">Operating Guidelines</h3>
      </div>
      <p className="text-base text-slate-600 leading-relaxed mb-4">{content}</p>

      {diagram && (
        <div className="relative bg-slate-50 rounded-xl p-6 border border-slate-100">
          <div className="flex items-center justify-center gap-2">
            {[diagram.feed, diagram.process, diagram.output].map((label, i, arr) => (
              <div key={label} className="flex items-center gap-2">
                <div className="w-20 h-16 rounded-lg border-2 border-navy-800 flex items-center justify-center text-center px-1">
                  <span className="text-sm font-semibold text-navy-900">{label}</span>
                </div>
                {i < arr.length - 1 && <div className="w-4 h-px bg-navy-800" />}
              </div>
            ))}
          </div>
          <button
            type="button"
            className="absolute bottom-2 right-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-navy-900 text-white text-sm font-semibold"
          >
            <ZoomIn size={14} strokeWidth={2.5} />
            Tap to zoom
          </button>
        </div>
      )}
    </div>
  );
}