import { useState } from 'react';
import { Boxes, Sparkles, Users, Wrench, Clock, Loader2, X } from 'lucide-react';
import { INTERRUPTION_REASONS } from '../types';

const REASON_ICONS: Record<(typeof INTERRUPTION_REASONS)[number], React.ReactNode> = {
  'Raw Material Delay': <Boxes size={32} strokeWidth={2.5} />,
  'Equipment Cleaning': <Sparkles size={32} strokeWidth={2.5} />,
  'Shift Handoff / Break': <Users size={32} strokeWidth={2.5} />,
  'Minor Machine Clearing': <Wrench size={32} strokeWidth={2.5} />,
};

interface InterruptionInterceptProps {
  isOpen: boolean;
  isSubmitting: boolean;
  onSelectReason: (reason: string) => void;
  onCancel: () => void;
}

export function InterruptionIntercept({ isOpen, isSubmitting, onSelectReason, onCancel }: InterruptionInterceptProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelect = (reason: string) => {
    setSelectedReason(reason);
    onSelectReason(reason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center max-w-md mx-auto">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" />

      <div className="relative w-full m-4 bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="w-16 h-16 rounded-full bg-warning-100 flex items-center justify-center mx-auto mb-4">
            <Clock size={32} className="text-warning-600" strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Specify Interruption Reason</h2>
          <p className="text-base text-slate-500 mt-1.5">
            Select the reason for pausing this process. This will be logged to the control dashboard.
          </p>
        </div>

        <div className="px-6 pb-4">
          {isSubmitting ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 size={36} className="text-warning-500 animate-spin mb-4" strokeWidth={2.5} />
              <p className="text-base font-bold text-slate-700">Logging pause reason...</p>
              <p className="text-sm text-slate-500 mt-1">{selectedReason}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {INTERRUPTION_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => handleSelect(reason)}
                  className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 border-slate-200 bg-slate-50 active:scale-[0.97] active:bg-navy-50 active:border-navy-300 transition-all"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-navy-600 shadow-sm">
                    {REASON_ICONS[reason]}
                  </div>
                  <span className="text-base font-bold text-slate-800 text-center leading-tight">{reason}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {!isSubmitting && (
          <div className="px-6 pb-6 pt-2">
            <button
              onClick={onCancel}
              className="w-full py-3.5 rounded-xl bg-slate-100 active:bg-slate-200 text-slate-700 text-base font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <X size={20} strokeWidth={2.5} />
              Cancel — Resume Process
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
/*Fixed an error in this component   */
