import { KeyRound, X, AlertTriangle } from 'lucide-react';

export function ResetPinModal({ name, pin, phone, onClose }: {
  name: string;
  pin: string;
  phone: string | null;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-card-elevated overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-navy-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-navy-100 rounded-lg flex items-center justify-center">
              <KeyRound size={20} className="text-navy-700" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">New PIN Issued</h2>
              <p className="text-xs text-slate-500">{name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="text-center py-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-2">New 4-Digit PIN</p>
            <p className="text-4xl font-mono font-bold text-navy-900 tracking-[0.3em]">{pin}</p>
          </div>

          {phone && (
            <p className="text-sm text-slate-600 text-center">
              Login: <span className="font-mono font-semibold">{phone}</span>
            </p>
          )}

          <div className="flex items-start gap-2 p-3 bg-warning-50 border border-warning-200 rounded-lg">
            <AlertTriangle size={16} className="text-warning-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-warning-800">
              This PIN won't be shown again. Share it with {name.split(' ')[0]} now.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-navy-900 hover:bg-navy-800 text-white font-medium rounded-lg"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
