import { useState } from 'react';
import { Pencil, X, Loader2, AlertTriangle } from 'lucide-react';
import { api } from '../../../shared/lib/api';
import type { ProductionLine } from '../pages/ProductionLines';

const UNITS = ['kg', 'L', 'Units'];

export function EditLineModal({ line, onClose, onUpdated }: { line: ProductionLine; onClose: () => void; onUpdated: (line: ProductionLine) => void }) {
  const [name, setName] = useState(line.name);
  const [description, setDescription] = useState(line.description ?? '');
  const [targetProduct, setTargetProduct] = useState(line.targetProduct ?? '');
  const [targetQuantity, setTargetQuantity] = useState(line.targetQuantity != null ? String(line.targetQuantity) : '');
  const [unit, setUnit] = useState(line.unit ?? 'kg');
  const [isActive, setIsActive] = useState(line.isActive);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError('Line name is required.');

    setSaving(true);
    try {
      const { data } = await api.patch<ProductionLine>(`/executive/lines/${line.id}`, {
        name: name.trim(),
        description: description.trim() || null,
        targetProduct: targetProduct.trim() || null,
        targetQuantity: targetQuantity ? Number(targetQuantity) : null,
        unit,
        isActive,
      });
      onUpdated(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update production line.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !saving && onClose()} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-navy-100 flex items-center justify-center">
              <Pencil size={20} className="text-navy-700" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Edit Production Line</h3>
              <p className="text-xs text-slate-500">{line.lineCode}</p>
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
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Line Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
              Description <span className="normal-case font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Default Product</label>
              <input
                type="text"
                value={targetProduct}
                onChange={(e) => setTargetProduct(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Target Qty</label>
              <input
                type="number"
                min="0"
                value={targetQuantity}
                onChange={(e) => setTargetQuantity(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Unit</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-all"
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Status</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsActive(true)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                  isActive ? 'bg-success-100 text-success-700 border-success-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setIsActive(false)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                  !isActive ? 'bg-warning-100 text-warning-700 border-warning-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Maintenance
              </button>
            </div>
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
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
