import { useState } from 'react';
import { UserPlus, X, Loader2, AlertTriangle } from 'lucide-react';
import { api } from '../../../shared/lib/api';

export interface ManagerAccount {
  id: string;
  name: string;
  identifier: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface LineOption {
  id: string;
  lineCode: string;
  name: string;
}

export function AddManagerModal({
  lines,
  onClose,
  onCreated,
}: {
  lines: LineOption[];
  onClose: () => void;
  onCreated: (manager: ManagerAccount) => void;
}) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [lineId, setLineId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) return setError('Full name is required.');
    if (!email.trim() || !email.includes('@')) return setError('A valid email is required.');
    if (!phone.trim()) return setError('Phone number is required.');

    setSaving(true);
    try {
      const { data } = await api.post<ManagerAccount>('/executive/managers', {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        lineId: lineId || null,
      });
      onCreated(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create manager account.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !saving && onClose()} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-navy-100 flex items-center justify-center">
              <UserPlus size={20} className="text-navy-700" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Add Manager Account</h3>
              <p className="text-xs text-slate-500">Create a new manager login</p>
            </div>
          </div>
          <button onClick={() => !saving && onClose()} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-danger-50 border border-danger-200">
              <AlertTriangle size={16} className="text-danger-600 flex-shrink-0" strokeWidth={2.5} />
              <p className="text-sm text-danger-700">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Full Name *</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Nakato Aisha"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Corporate Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@dojohubug.com"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Phone Number *</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+256 700 000 000"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
              Assigned Production Line <span className="normal-case font-normal text-slate-400">(optional)</span>
            </label>
            <select
              value={lineId}
              onChange={(e) => setLineId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-all"
            >
              <option value="">No line assigned yet</option>
              {lines.map((line) => (
                <option key={line.id} value={line.id}>
                  {line.lineCode} — {line.name}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-xs text-slate-500">
              The manager will use their <span className="font-semibold text-slate-700">corporate email</span> and the shared password{' '}
              <span className="font-mono font-semibold text-slate-700">manager2024</span> to log in.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-sm font-bold transition-colors disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" strokeWidth={2.5} />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus size={16} strokeWidth={2.5} />
                  Create Account
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
