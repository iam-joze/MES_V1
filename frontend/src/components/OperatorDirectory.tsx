import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Users,
  Phone,
  KeyRound,
  Eye,
  EyeOff,
  Plus,
  CheckCircle,
  XCircle,
  Search,
  Shield,
  UserCheck,
  Loader2,
  AlertTriangle,
  MoreVertical,
  UserX,
  UserCheck2,
  Trash2,
  AlertOctagon,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { registerOperator } from '../lib/sharedState';

interface OperatorAccount {
  id: string;
  name: string;
  phone: string;
  pin: string;
  skills: string[];
  status: 'active' | 'suspended';
  registeredAt: string;
}

// ── Register Modal ────────────────────────────────────────────

interface RegisterOperatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; phone: string; pin: string; skills: string[] }) => Promise<void>;
}

function RegisterOperatorModal({ isOpen, onClose, onSubmit }: RegisterOperatorModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const availableSkills = [
    'Pasteurization', 'Blender Ops', 'Filling', 'Capping', 'Labeling',
    'Packaging', 'QC Certified', 'Washing', 'Pulping', 'Mixing',
    'Maintenance', 'Lab Testing', 'All Stations', 'Sorting',
  ];

  const reset = () => {
    setName(''); setPhone(''); setPin(''); setConfirmPin('');
    setSkills([]); setErrors({});
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) e.name = 'Name is required (min 2 characters)';
    if (!/^\+?[\d\s-]{10,15}$/.test(phone.trim())) e.phone = 'Valid phone number required (10–15 digits)';
    if (!/^\d{4}$/.test(pin)) e.pin = 'PIN must be exactly 4 digits';
    if (pin !== confirmPin) e.confirmPin = 'PINs do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      await onSubmit({ name: name.trim(), phone: phone.trim(), pin, skills });
      reset();
      onClose();
    } catch (err: any) {
      setErrors({ submit: err.message || 'Failed to register operator' });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSkill = (skill: string) =>
    setSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-navy-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-card shadow-card-elevated overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-navy-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-navy-100 rounded-lg flex items-center justify-center">
                <UserCheck size={20} className="text-navy-700" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">Register New Operator</h2>
                <p className="text-xs text-slate-500">Saved to database — persists across sessions</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <XCircle size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {errors.submit && (
            <div className="flex items-center gap-2 p-3 bg-danger-50 border border-danger-200 rounded-lg text-sm text-danger-700">
              <AlertTriangle size={16} />
              {errors.submit}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name <span className="text-danger-500">*</span></label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Operator full name"
              className={`w-full px-3 py-2.5 bg-slate-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 ${errors.name ? 'border-danger-500' : 'border-slate-200'}`}
            />
            {errors.name && <p className="text-xs text-danger-600 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <Phone size={14} className="inline mr-1" />Phone Number (Login ID) <span className="text-danger-500">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+256 700 000000"
              className={`w-full px-3 py-2.5 bg-slate-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 ${errors.phone ? 'border-danger-500' : 'border-slate-200'}`}
            />
            {errors.phone && <p className="text-xs text-danger-600 mt-1">{errors.phone}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <KeyRound size={14} className="inline mr-1" />4-Digit PIN <span className="text-danger-500">*</span>
              </label>
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="XXXX"
                className={`w-full px-3 py-2.5 bg-slate-50 border rounded-lg text-sm text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 ${errors.pin ? 'border-danger-500' : 'border-slate-200'}`}
              />
              {errors.pin && <p className="text-xs text-danger-600 mt-1">{errors.pin}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm PIN <span className="text-danger-500">*</span></label>
              <input
                type="password"
                maxLength={4}
                value={confirmPin}
                onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="XXXX"
                className={`w-full px-3 py-2.5 bg-slate-50 border rounded-lg text-sm text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 ${errors.confirmPin ? 'border-danger-500' : 'border-slate-200'}`}
              />
              {errors.confirmPin && <p className="text-xs text-danger-600 mt-1">{errors.confirmPin}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Shield size={14} className="inline mr-1" />Skill Certifications
            </label>
            <div className="flex flex-wrap gap-1.5">
              {availableSkills.map(skill => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                    skills.includes(skill) ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t border-slate-200 bg-slate-50">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex items-center justify-center gap-2 flex-1 px-4 py-2.5 bg-navy-900 hover:bg-navy-800 disabled:opacity-60 text-white font-medium rounded-lg transition-colors"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
            <span>{isSaving ? 'Saving...' : 'Create Account'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirmation Modal ─────────────────────────────────

interface DeleteConfirmModalProps {
  operator: OperatorAccount | null;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

function DeleteConfirmModal({ operator, onConfirm, onCancel }: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => { setConfirmText(''); }, [operator]);

  if (!operator) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  const canDelete = confirmText === operator.name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md bg-white rounded-card shadow-card-elevated overflow-hidden">
        {/* Danger header */}
        <div className="px-6 py-5 bg-danger-50 border-b border-danger-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-danger-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertOctagon size={24} className="text-danger-600" />
            </div>
            <div>
              <h2 className="font-bold text-danger-900 text-lg">Remove Operator from System</h2>
              <p className="text-sm text-danger-700 mt-0.5">
                This permanently deletes all data and cannot be undone.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* What will be deleted */}
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Will be permanently deleted</p>
            <div className="space-y-1.5 text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <Trash2 size={14} className="text-danger-500 flex-shrink-0" />
                <span>Account for <strong>{operator.name}</strong> ({operator.phone})</span>
              </div>
              <div className="flex items-center gap-2">
                <Trash2 size={14} className="text-danger-500 flex-shrink-0" />
                <span>All login credentials and PIN</span>
              </div>
              <div className="flex items-center gap-2">
                <Trash2 size={14} className="text-danger-500 flex-shrink-0" />
                <span>Skill certifications and profile data</span>
              </div>
            </div>
          </div>

          {/* Typed confirmation */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Type <strong>{operator.name}</strong> to confirm deletion
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder={operator.name}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-danger-500/20 focus:border-danger-500"
            />
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canDelete || isDeleting}
            className="flex items-center justify-center gap-2 flex-1 px-4 py-2.5 bg-danger-600 hover:bg-danger-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {isDeleting ? (
              <><Loader2 size={16} className="animate-spin" /><span>Removing...</span></>
            ) : (
              <><Trash2 size={16} /><span>Remove Permanently</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── PIN Display ───────────────────────────────────────────────

function PINField({ pin }: { pin: string }) {
  const [isRevealed, setIsRevealed] = useState(false);
  return (
    <div className="flex items-center gap-1">
      <span className="font-mono text-slate-700 tracking-widest">{isRevealed ? pin : '••••'}</span>
      <button
        onClick={() => setIsRevealed(v => !v)}
        className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
      >
        {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
}

// ── Actions Dropdown ──────────────────────────────────────────

interface ActionsMenuProps {
  operator: OperatorAccount;
  onToggleStatus: () => void;
  onDelete: () => void;
}

function ActionsMenu({ operator, onToggleStatus, onDelete }: ActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-30 w-52 bg-white rounded-xl border border-slate-200 shadow-card-elevated overflow-hidden">
          {/* Toggle deactivate / activate */}
          <button
            onClick={() => { setOpen(false); onToggleStatus(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors text-left ${
              operator.status === 'active'
                ? 'text-warning-700 hover:bg-warning-50'
                : 'text-success-700 hover:bg-success-50'
            }`}
          >
            {operator.status === 'active' ? (
              <><UserX size={16} className="flex-shrink-0" /><span>Deactivate Account</span></>
            ) : (
              <><UserCheck2 size={16} className="flex-shrink-0" /><span>Reactivate Account</span></>
            )}
          </button>

          <div className="border-t border-slate-100" />

          {/* Remove permanently */}
          <button
            onClick={() => { setOpen(false); onDelete(); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-danger-600 hover:bg-danger-50 transition-colors text-left"
          >
            <Trash2 size={16} className="flex-shrink-0" />
            <div>
              <span>Remove from System</span>
              <p className="text-xs text-danger-400 font-normal">Deletes all data permanently</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────

export function OperatorDirectory() {
  const [operators, setOperators] = useState<OperatorAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<OperatorAccount | null>(null);

  const fetchOperators = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    const { data, error } = await supabase
      .from('operator_accounts')
      .select('id, name, phone, pin, skills, status, registered_at')
      .order('registered_at', { ascending: false });

    if (error) {
      setFetchError(error.message);
    } else {
      setOperators(
        (data || []).map(row => ({
          id: row.id,
          name: row.name,
          phone: row.phone,
          pin: row.pin,
          skills: row.skills || [],
          status: row.status as 'active' | 'suspended',
          registeredAt: row.registered_at,
        }))
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchOperators(); }, [fetchOperators]);

  const handleRegister = async (data: { name: string; phone: string; pin: string; skills: string[] }) => {
    const { data: inserted, error } = await supabase
      .from('operator_accounts')
      .insert({ name: data.name, phone: data.phone, pin: data.pin, skills: data.skills, status: 'active' })
      .select('id, name, phone, pin, skills, status, registered_at')
      .single();

    if (error) throw new Error(error.message);

    setOperators(prev => [{
      id: inserted.id,
      name: inserted.name,
      phone: inserted.phone,
      pin: inserted.pin,
      skills: inserted.skills || [],
      status: inserted.status as 'active' | 'suspended',
      registeredAt: inserted.registered_at,
    }, ...prev]);

    registerOperator(data);
  };

  // ── Toggle active / suspended ───────────────────────────────
  const handleToggleStatus = async (operator: OperatorAccount) => {
    const next = operator.status === 'active' ? 'suspended' : 'active';
    setOperators(prev => prev.map(op => op.id === operator.id ? { ...op, status: next } : op));
    const { error } = await supabase
      .from('operator_accounts')
      .update({ status: next })
      .eq('id', operator.id);
    if (error) {
      // Roll back optimistic update on failure
      setOperators(prev => prev.map(op => op.id === operator.id ? { ...op, status: operator.status } : op));
    }
  };

  // ── Permanent delete ────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase
      .from('operator_accounts')
      .delete()
      .eq('id', deleteTarget.id);

    if (error) throw new Error(error.message);

    // Remove from local list immediately
    setOperators(prev => prev.filter(op => op.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const filteredOperators = operators.filter(op =>
    op.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    op.phone.includes(searchQuery) ||
    op.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeCount = operators.filter(o => o.status === 'active').length;
  const suspendedCount = operators.filter(o => o.status === 'suspended').length;

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Users size={24} className="text-navy-600" />
            <h1 className="text-2xl font-bold text-slate-900">Operator Directory</h1>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? 'Loading...' : `${activeCount} active${suspendedCount > 0 ? ` · ${suspendedCount} suspended` : ''}`}
          </p>
        </div>
        <button
          onClick={() => setIsRegisterModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-navy-900 hover:bg-navy-800 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all"
        >
          <Plus size={18} />
          <span>Register Operator</span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, or skill..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-navy-500" />
        </div>
      )}

      {/* Error */}
      {fetchError && !loading && (
        <div className="flex items-center gap-3 p-4 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 mb-4">
          <AlertTriangle size={20} />
          <div>
            <p className="font-semibold">Failed to load operators</p>
            <p className="text-sm">{fetchError}</p>
          </div>
          <button onClick={fetchOperators} className="ml-auto px-3 py-1.5 bg-danger-100 hover:bg-danger-200 rounded-lg text-sm font-medium transition-colors">
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="flex-1 overflow-auto">
          <div className="bg-white rounded-card border border-slate-200 overflow-hidden">
            {/* Column headers — 7 cols: name(2), phone, pin, skills, status, actions */}
            <div className="grid grid-cols-[2fr_1.4fr_1fr_1.4fr_1fr_auto] gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <div>Operator</div>
              <div>Phone / Login</div>
              <div>PIN</div>
              <div>Skills</div>
              <div>Status</div>
              <div className="w-16 text-center">Actions</div>
            </div>

            <div className="divide-y divide-slate-200">
              {filteredOperators.map(operator => (
                <div
                  key={operator.id}
                  className={`grid grid-cols-[2fr_1.4fr_1fr_1.4fr_1fr_auto] gap-4 px-6 py-4 items-center hover:bg-slate-50 transition-colors ${
                    operator.status === 'suspended' ? 'opacity-60' : ''
                  }`}
                >
                  {/* Name + avatar */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                      operator.status === 'suspended' ? 'bg-slate-100' : 'bg-navy-100'
                    }`}>
                      <span className={`font-semibold text-sm ${
                        operator.status === 'suspended' ? 'text-slate-400' : 'text-navy-700'
                      }`}>
                        {operator.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">{operator.name}</p>
                      <p className="text-xs text-slate-400">
                        Registered {new Date(operator.registeredAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center gap-1.5 text-sm text-slate-700 min-w-0">
                    <Phone size={13} className="text-slate-400 flex-shrink-0" />
                    <span className="truncate">{operator.phone}</span>
                  </div>

                  {/* PIN */}
                  <div>
                    <PINField pin={operator.pin} />
                  </div>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1">
                    {operator.skills.slice(0, 2).map(skill => (
                      <span key={skill} className="px-1.5 py-0.5 bg-navy-100 text-navy-700 text-[10px] font-medium rounded truncate max-w-[90px]">
                        {skill}
                      </span>
                    ))}
                    {operator.skills.length > 2 && (
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded">
                        +{operator.skills.length - 2}
                      </span>
                    )}
                  </div>

                  {/* Status badge */}
                  <div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      operator.status === 'active'
                        ? 'bg-success-100 text-success-700 border-success-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {operator.status === 'active' ? (
                        <><CheckCircle size={11} /><span>Active</span></>
                      ) : (
                        <><XCircle size={11} /><span>Suspended</span></>
                      )}
                    </span>
                  </div>

                  {/* Actions dropdown */}
                  <div className="w-16 flex justify-center">
                    <ActionsMenu
                      operator={operator}
                      onToggleStatus={() => handleToggleStatus(operator)}
                      onDelete={() => setDeleteTarget(operator)}
                    />
                  </div>
                </div>
              ))}

              {filteredOperators.length === 0 && !loading && (
                <div className="p-12 text-center text-slate-400">
                  <Users size={48} className="mx-auto mb-3 opacity-50" />
                  <p>No operators found{searchQuery ? ' matching your search' : ''}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <RegisterOperatorModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSubmit={handleRegister}
      />

      <DeleteConfirmModal
        operator={deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
