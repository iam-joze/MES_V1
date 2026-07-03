import { useState, useEffect, useCallback } from 'react';
import {
  Factory,
  Package,
  Activity,
  CheckCircle2,
  Pause,
  Clock,
  AlertCircle,
  Loader2,
  Layers,
  Plus,
  UserCog,
  X,
  UserCheck,
  AlertTriangle,
  Users,
  Calendar,
  Wrench,
} from 'lucide-react';
import {
  fetchProductionLines,
  fetchAssignableManagers,
  assignManagerToLine,
  unassignManagerFromLine,
  createProductionLine,
  type NewProductionLinePayload,
} from '../data/executiveData';
import type { ManagerAccount } from '../data/executiveData';
import type { ProductionLine, AssignedManager } from '../types';

const MAX_LINES = 10;

// Status config for lines
const statusConfig: Record<string, { label: string; bgClass: string; textClass: string; dotClass: string }> = {
  active: { label: 'Active', bgClass: 'bg-success-100', textClass: 'text-success-700', dotClass: 'bg-success-500' },
  inactive: { label: 'Inactive', bgClass: 'bg-slate-100', textClass: 'text-slate-600', dotClass: 'bg-slate-400' },
  maintenance: { label: 'Maintenance', bgClass: 'bg-warning-100', textClass: 'text-warning-700', dotClass: 'bg-warning-500' },
};

// ============================================================
// Assign Manager Modal
// ============================================================
interface AssignManagerModalProps {
  line: ProductionLine;
  onClose: () => void;
  onAssigned: (manager: AssignedManager) => void;
  onUnassigned: () => void;
}

function AssignManagerModal({ line, onClose, onAssigned, onUnassigned }: AssignManagerModalProps) {
  const [managers, setManagers] = useState<ManagerAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchAssignableManagers();
        if (!cancelled) {
          setManagers(data);
          if (line.assignedManager) {
            const current: ManagerAccount = {
              id: line.assignedManager.id,
              fullName: line.assignedManager.fullName,
              email: line.assignedManager.email,
              phone: '',
              assignedLine: line.name,
              isActive: true,
              createdAt: '',
              lastLoginAt: null,
            };
            setManagers((prev) => [current, ...prev.filter((m) => m.id !== current.id)]);
            setSelectedId(current.id);
          }
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load managers');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [line.assignedManager, line.name]);

  const handleAssign = async () => {
    if (!selectedId) {
      setError('Please select a manager.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await assignManagerToLine(line.id, selectedId);
      const chosen = managers.find((m) => m.id === selectedId);
      if (chosen) {
        onAssigned({ id: chosen.id, fullName: chosen.fullName, email: chosen.email });
      }
    } catch (e: any) {
      setError(e.message || 'Failed to assign manager');
    } finally {
      setSaving(false);
    }
  };

  const handleUnassign = async () => {
    setSaving(true);
    setError(null);
    try {
      await unassignManagerFromLine(line.id);
      onUnassigned();
    } catch (e: any) {
      setError(e.message || 'Failed to unassign manager');
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
              <UserCog size={20} className="text-navy-700" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Assign Manager</h3>
              <p className="text-xs text-slate-500">{line.name}</p>
            </div>
          </div>
          <button onClick={() => !saving && onClose()} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-danger-50 border border-danger-200">
              <AlertTriangle size={16} className="text-danger-600 flex-shrink-0" strokeWidth={2.5} />
              <p className="text-sm text-danger-700">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={24} className="text-navy-500 animate-spin" />
            </div>
          ) : managers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users size={32} className="text-slate-300 mb-2" strokeWidth={2} />
              <p className="text-sm font-semibold text-slate-700">No managers available</p>
              <p className="text-xs text-slate-500 mt-1">Create a manager account first.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {managers.map((m) => {
                const isSelected = selectedId === m.id;
                const isCurrent = line.assignedManager?.id === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedId(m.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-navy-500 bg-navy-50 ring-2 ring-navy-500/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-navy-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-navy-700">
                        {m.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{m.fullName}</p>
                      <p className="text-xs text-slate-500 truncate">{m.email}</p>
                    </div>
                    {isCurrent && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-success-100 text-success-700 border border-success-200">
                        Current
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          {line.assignedManager ? (
            <button
              onClick={handleUnassign}
              disabled={saving || loading}
              className="text-sm font-semibold text-danger-600 hover:text-danger-700 hover:bg-danger-50 px-3 py-2.5 rounded-xl transition-colors disabled:opacity-60"
            >
              Unassign
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={saving || loading || !selectedId}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-sm font-bold transition-colors disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" strokeWidth={2.5} />
                  Saving...
                </>
              ) : (
                <>
                  <UserCheck size={16} strokeWidth={2.5} />
                  Assign Manager
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Create New Line Modal
// ============================================================
interface CreateLineModalProps {
  onClose: () => void;
  onCreated: (line: ProductionLine) => void;
}

function CreateLineModal({ onClose, onCreated }: CreateLineModalProps) {
  const [lineCode, setLineCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [productName, setProductName] = useState('');
  const [targetQuantity, setTargetQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!lineCode.trim()) {
      setError('Line code is required (e.g., LINE-A).');
      return;
    }
    if (!name.trim()) {
      setError('Line name is required.');
      return;
    }
    setSaving(true);
    try {
      const payload: NewProductionLinePayload = {
        lineCode: lineCode.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim() || undefined,
        productName: productName.trim() || undefined,
        targetQuantity: targetQuantity ? parseInt(targetQuantity, 10) : undefined,
        unit: unit.trim() || 'kg',
      };
      const created = await createProductionLine(payload);
      onCreated(created);
    } catch (e: any) {
      setError(e.message || 'Failed to create production line.');
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
            <div className="w-10 h-10 rounded-xl bg-success-100 flex items-center justify-center">
              <Plus size={20} className="text-success-700" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Create Production Line</h3>
              <p className="text-xs text-slate-500">Provision a new manufacturing line</p>
            </div>
          </div>
          <button onClick={() => !saving && onClose()} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-danger-50 border border-danger-200">
              <AlertTriangle size={16} className="text-danger-600 flex-shrink-0" strokeWidth={2.5} />
              <p className="text-sm text-danger-700">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                Line Code *
              </label>
              <input
                type="text"
                value={lineCode}
                onChange={(e) => setLineCode(e.target.value.toUpperCase())}
                placeholder="LINE-A"
                maxLength={10}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-all"
              >
                <option value="kg">kg</option>
                <option value="L">L</option>
                <option value="Units">Units</option>
                <option value="Boxes">Boxes</option>
                <option value="Cartons">Cartons</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
              Line Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Line A — Tropical Pulping & Extraction"
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
              placeholder="e.g. Primary washing, sorting, and extraction line..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                Default Product
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Mango Concentrate"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                Target Qty
              </label>
              <input
                type="number"
                value={targetQuantity}
                onChange={(e) => setTargetQuantity(e.target.value)}
                placeholder="5000"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-xs text-slate-500">
              The line starts with <span className="font-semibold text-slate-700">Active</span> status.
              Assign a manager from the line card once created.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-success-500 hover:bg-success-600 text-white text-sm font-bold transition-colors disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" strokeWidth={2.5} />
                Creating...
              </>
            ) : (
              <>
                <Plus size={16} strokeWidth={2.5} />
                Create Line
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Production Line Card
// ============================================================
interface ProductionLineCardProps {
  line: ProductionLine;
  onAssignManager: (line: ProductionLine) => void;
}

function ProductionLineCardView({ line, onAssignManager }: ProductionLineCardProps) {
  const config = statusConfig[line.status] || statusConfig.active;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5 hover:shadow-lg hover:border-slate-300 transition-all duration-300 group flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
            line.status === 'active' ? 'bg-success-100' :
            line.status === 'maintenance' ? 'bg-warning-100' : 'bg-slate-100'
          }`}>
            {line.status === 'active' ? (
              <Factory size={22} className="text-success-600" strokeWidth={2.5} />
            ) : line.status === 'maintenance' ? (
              <Wrench size={22} className="text-warning-600" strokeWidth={2.5} />
            ) : (
              <Package size={22} className="text-slate-500" strokeWidth={2.5} />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{line.lineCode}</p>
            <h3 className="text-sm font-bold text-slate-900 leading-tight group-hover:text-navy-700 transition-colors truncate">
              {line.name}
            </h3>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${config.bgClass} ${config.textClass}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
          {config.label}
        </span>
      </div>

      {/* Description */}
      {line.description && (
        <p className="text-xs text-slate-600 leading-relaxed mb-3 line-clamp-2">{line.description}</p>
      )}

      {/* Target Output */}
      <div className="mb-3 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
          <Package size={14} className="text-slate-500" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-400 font-medium">Default Product</p>
          <p className="text-sm font-semibold text-slate-800">
            {line.productName || 'Not set'}
            {line.targetQuantity && (
              <span className="text-slate-500 font-normal"> — {line.targetQuantity.toLocaleString()} {line.unit}</span>
            )}
          </p>
        </div>
      </div>

      {/* Assigned Manager */}
      <div className="mb-4">
        <p className="text-xs text-slate-400 font-medium mb-1.5">Assigned Manager</p>
        {line.assignedManager ? (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-navy-50 border border-navy-100">
            <div className="w-8 h-8 rounded-full bg-navy-200 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-navy-700">
                {line.assignedManager.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 truncate">{line.assignedManager.fullName}</p>
              <p className="text-xs text-slate-500 truncate">{line.assignedManager.email}</p>
            </div>
            <UserCheck size={16} className="text-navy-600 flex-shrink-0" strokeWidth={2.5} />
          </div>
        ) : (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-dashed border-slate-200">
            <UserCog size={16} className="text-slate-400 flex-shrink-0" strokeWidth={2.5} />
            <p className="text-xs text-slate-500">No manager assigned</p>
          </div>
        )}
      </div>

      {/* Created date */}
      <div className="flex items-center gap-2 mt-auto text-xs text-slate-400 mb-3">
        <Clock size={12} strokeWidth={2.5} />
        <span>Created {new Date(line.createdAt).toLocaleDateString()}</span>
      </div>

      {/* Assign Manager action */}
      <button
        onClick={() => onAssignManager(line)}
        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-navy-900 hover:text-white text-slate-700 text-sm font-semibold transition-all active:scale-[0.98]"
      >
        <UserCog size={16} strokeWidth={2.5} />
        {line.assignedManager ? 'Reassign Manager' : 'Assign Manager'}
      </button>
    </div>
  );
}

// Empty state
function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Factory size={32} className="text-slate-400" strokeWidth={2} />
      </div>
      <p className="text-lg font-bold text-slate-700">No Production Lines</p>
      <p className="text-sm text-slate-500 mt-1 max-w-xs">
        Create production lines and assign managers to enable batch job creation.
      </p>
    </div>
  );
}

// Main Component
export function ProductionLineMatrix() {
  const [lines, setLines] = useState<ProductionLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [assignTarget, setAssignTarget] = useState<ProductionLine | null>(null);

  const loadLines = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchProductionLines();
      setLines(data);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Failed to load production lines');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLines();
  }, [loadLines]);

  const activeLines = lines.filter((l) => l.status === 'active');
  const maintenanceLines = lines.filter((l) => l.status === 'maintenance');
  const assignedCount = lines.filter((l) => l.assignedManager).length;
  const atCapacity = lines.length >= MAX_LINES;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Production Lines</h2>
          <p className="text-base text-slate-500 mt-1">
            Manage manufacturing lines and assign managers ({lines.length}/{MAX_LINES} lines).
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={atCapacity}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-success-500 hover:bg-success-600 text-white text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          title={atCapacity ? `Maximum of ${MAX_LINES} lines reached` : 'Create a new production line'}
        >
          <Plus size={18} strokeWidth={2.5} />
          New Line
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center">
            <Activity size={18} className="text-success-600" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{activeLines.length}</p>
            <p className="text-xs text-slate-500">Active Lines</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-warning-100 flex items-center justify-center">
            <Wrench size={18} className="text-warning-600" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{maintenanceLines.length}</p>
            <p className="text-xs text-slate-500">In Maintenance</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-navy-100 flex items-center justify-center">
            <UserCheck size={18} className="text-navy-600" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{assignedCount}</p>
            <p className="text-xs text-slate-500">Assigned</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
            <Factory size={18} className="text-slate-500" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{lines.length}</p>
            <p className="text-xs text-slate-500">Total Lines</p>
          </div>
        </div>
      </div>

      {/* Card grid */}
      <div className="bg-white rounded-2xl border border-slate-200/50 shadow-card p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="text-navy-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle size={32} className="text-danger-600 mb-3" strokeWidth={2.5} />
            <p className="text-base font-semibold text-slate-900">Failed to Load</p>
            <p className="text-sm text-slate-500">{error}</p>
          </div>
        ) : lines.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {lines.map((line) => (
              <ProductionLineCardView key={line.id} line={line} onAssignManager={(l) => setAssignTarget(l)} />
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateLineModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(newLine) => {
            setLines((prev) => [newLine, ...prev]);
            setShowCreateModal(false);
          }}
        />
      )}

      {assignTarget && (
        <AssignManagerModal
          line={assignTarget}
          onClose={() => setAssignTarget(null)}
          onAssigned={(manager) => {
            setLines((prev) =>
              prev.map((l) => (l.id === assignTarget.id ? { ...l, assignedManager: manager } : l))
            );
            setAssignTarget(null);
          }}
          onUnassigned={() => {
            setLines((prev) =>
              prev.map((l) => (l.id === assignTarget.id ? { ...l, assignedManager: null } : l))
            );
            setAssignTarget(null);
          }}
        />
      )}
    </div>
  );
}
