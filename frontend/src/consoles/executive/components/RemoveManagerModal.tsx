import { useEffect, useState } from 'react';
import { AlertOctagon, Trash2, Loader2 } from 'lucide-react';
import type { ManagerAccount } from './AddManagerModal';

export function RemoveManagerModal({
  manager,
  onConfirm,
  onCancel,
}: {
  manager: ManagerAccount;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}) {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setConfirmText(''), [manager]);

  const canDelete = confirmText === manager.name;

  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to remove manager account.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isDeleting && onCancel()} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-5 bg-danger-50 border-b border-danger-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-danger-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertOctagon size={24} className="text-danger-600" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="font-bold text-danger-900 text-lg">Remove Manager from System</h2>
              <p className="text-sm text-danger-700 mt-0.5">This permanently deletes the account and cannot be undone.</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {error && <p className="text-sm text-danger-600">{error}</p>}

          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Will happen immediately</p>
            <div className="space-y-1.5 text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <Trash2 size={14} className="text-danger-500 flex-shrink-0" strokeWidth={2.5} />
                <span>Account for <strong>{manager.name}</strong> ({manager.identifier}) is deleted</span>
              </div>
              <div className="flex items-center gap-2">
                <Trash2 size={14} className="text-danger-500 flex-shrink-0" strokeWidth={2.5} />
                <span>Any production lines assigned to them become <strong>Unassigned</strong></span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Type <strong>{manager.name}</strong> to confirm deletion
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={manager.name}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-danger-500/20 focus:border-danger-500"
            />
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canDelete || isDeleting}
            className="flex items-center justify-center gap-2 flex-1 px-4 py-2.5 bg-danger-600 hover:bg-danger-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-colors"
          >
            {isDeleting ? (
              <>
                <Loader2 size={16} className="animate-spin" strokeWidth={2.5} />
                Removing...
              </>
            ) : (
              <>
                <Trash2 size={16} strokeWidth={2.5} />
                Remove Permanently
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
