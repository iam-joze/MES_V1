import { useEffect, useRef, useState } from 'react';
import { MoreVertical, Shield, KeyRound, UserX, UserCheck2, Trash2 } from 'lucide-react';

export function OperatorActionsMenu({
  isActive,
  onEditSkills,
  onResetPin,
  onToggleStatus,
  onRemove,
}: {
  isActive: boolean;
  onEditSkills: () => void;
  onResetPin: () => void;
  onToggleStatus: () => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
      >
        <MoreVertical size={16} strokeWidth={2.5} />
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-30 w-56 bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden text-left">
          <button
            onClick={() => { setOpen(false); onEditSkills(); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-navy-700 hover:bg-navy-50 transition-colors text-left"
          >
            <Shield size={16} className="flex-shrink-0" strokeWidth={2.5} />
            <span>Edit Skill Certifications</span>
          </button>

          <div className="border-t border-slate-100" />

          <button
            onClick={() => { setOpen(false); onResetPin(); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-navy-700 hover:bg-navy-50 transition-colors text-left"
          >
            <KeyRound size={16} className="flex-shrink-0" strokeWidth={2.5} />
            <span>Reset PIN</span>
          </button>

          <div className="border-t border-slate-100" />

          <button
            onClick={() => { setOpen(false); onToggleStatus(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors text-left ${
              isActive ? 'text-warning-700 hover:bg-warning-50' : 'text-success-700 hover:bg-success-50'
            }`}
          >
            {isActive ? (
              <>
                <UserX size={16} className="flex-shrink-0" strokeWidth={2.5} />
                <span>Suspend Account</span>
              </>
            ) : (
              <>
                <UserCheck2 size={16} className="flex-shrink-0" strokeWidth={2.5} />
                <span>Reactivate Account</span>
              </>
            )}
          </button>

          <div className="border-t border-slate-100" />

          <button
            onClick={() => { setOpen(false); onRemove(); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-danger-600 hover:bg-danger-50 transition-colors text-left"
          >
            <Trash2 size={16} className="flex-shrink-0" strokeWidth={2.5} />
            <div>
              <span>Remove from System</span>
              <p className="text-xs text-danger-400 font-normal">Deletes account permanently</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
