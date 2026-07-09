import { Construction } from 'lucide-react';

export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-slate-200/50 shadow-card">
      <Construction size={40} className="text-slate-300 mb-3" strokeWidth={2} />
      <p className="text-base font-semibold text-slate-700">{title}</p>
      <p className="text-sm text-slate-500 mt-1">This screen hasn't been built yet.</p>
    </div>
  );
}
