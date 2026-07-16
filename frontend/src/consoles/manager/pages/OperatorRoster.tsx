import { useEffect, useState, useCallback } from 'react';
import { Users, Search, Plus, Phone, Shield, AlertTriangle, Loader2, Calendar, UserCheck2 } from 'lucide-react';
import { api } from '../../../shared/lib/api';
import { formatDate } from '../../../shared/lib/formatters';
import { RegisterOperatorModal } from '../components/RegisterOperatorModal';
import { OperatorActionsMenu } from '../components/OperatorActionsMenu';
import { EditOperatorSkillsModal } from '../components/EditOperatorSkillsModal';
import { RemoveOperatorModal } from '../components/RemoveOperatorModal';
import { ResetPinModal } from '../components/ResetPinModal';

interface Operator {
  id: string;
  name: string;
  identifier: string;
  phone: string | null;
  skills: string[];
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

interface ResetPinResult {
  name: string;
  phone: string | null;
  pin: string;
}

function OperatorTableRow({ operator, onToggleStatus, onEditSkills, onResetPin, onRemove }: {
  operator: Operator;
  onToggleStatus: (id: string, isActive: boolean) => void;
  onEditSkills: (operator: Operator) => void;
  onResetPin: (operator: Operator) => void;
  onRemove: (operator: Operator) => void;
}) {
  return (
    <tr className={`border-b border-slate-100 last:border-0 ${!operator.isActive ? 'opacity-60' : ''}`}>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-navy-500 to-navy-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {operator.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 truncate">{operator.name}</p>
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <Calendar size={10} />
              Registered {formatDate(operator.createdAt)}
            </p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-slate-600">
        <div className="flex items-center gap-2">
          <Phone size={14} className="text-slate-400" />
          {operator.phone || operator.identifier}
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="font-mono text-slate-400 tracking-widest">••••</span>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1 max-w-[220px]">
          {operator.skills.length === 0 ? (
            <span className="text-xs text-slate-400 italic">No certifications</span>
          ) : (
            <>
              {operator.skills.slice(0, 2).map((skill) => (
                <span key={skill} className="px-2 py-0.5 bg-navy-100 text-navy-700 text-[10px] font-medium rounded-full whitespace-nowrap">
                  {skill}
                </span>
              ))}
              {operator.skills.length > 2 && (
                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-medium rounded-full">
                  +{operator.skills.length - 2}
                </span>
              )}
            </>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
          operator.isActive ? 'bg-success-100 text-success-700' : 'bg-slate-100 text-slate-500'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${operator.isActive ? 'bg-success-500' : 'bg-slate-400'}`} />
          {operator.isActive ? 'Active' : 'Suspended'}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          {!operator.isActive && (
            <button
              onClick={() => onToggleStatus(operator.id, true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-success-200 text-success-700 hover:bg-success-50 transition-colors"
            >
              <UserCheck2 size={14} strokeWidth={2.5} />
              Reactivate
            </button>
          )}
          <OperatorActionsMenu
            isActive={operator.isActive}
            onEditSkills={() => onEditSkills(operator)}
            onResetPin={() => onResetPin(operator)}
            onToggleStatus={() => onToggleStatus(operator.id, !operator.isActive)}
            onRemove={() => onRemove(operator)}
          />
        </div>
      </td>
    </tr>
  );
}

export function OperatorRoster() {
  const [operators, setOperators] = useState<Operator[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuspended, setShowSuspended] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [skillsTarget, setSkillsTarget] = useState<Operator | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Operator | null>(null);
  const [pinResult, setPinResult] = useState<ResetPinResult | null>(null);

  const loadOperators = useCallback(() => {
    api.get<{ operators: Operator[] }>('/operators')
      .then((res) => setOperators(res.data.operators))
      .catch((err) => setError(err?.response?.data?.message || 'Failed to load operators.'));
  }, []);

  useEffect(() => { loadOperators(); }, [loadOperators]);

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    try {
      await api.patch(`/operators/${id}/status`, { isActive });
      loadOperators();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update operator status.');
    }
  };

  const handleRegister = async (data: { name: string; phone: string; pin: string; skills: string[] }) => {
    await api.post('/operators', data);
  };

  const handleSkillsSaved = (operatorId: string, skills: string[]) => {
    setOperators((prev) => prev?.map((o) => (o.id === operatorId ? { ...o, skills } : o)) ?? null);
    setSkillsTarget(null);
  };

  const handleResetPin = async (operator: Operator) => {
    try {
      const { data } = await api.patch<{ pin: string }>(`/operators/${operator.id}/pin`);
      setPinResult({ name: operator.name, phone: operator.phone || operator.identifier, pin: data.pin });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to reset PIN.');
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    await api.delete(`/operators/${removeTarget.id}`);
    setOperators((prev) => prev?.filter((o) => o.id !== removeTarget.id) ?? null);
    setRemoveTarget(null);
  };

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-danger-50 border border-danger-200 text-danger-700">
        <AlertTriangle size={20} strokeWidth={2.5} />{error}
      </div>
    );
  }

  if (!operators) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 size={28} className="animate-spin" strokeWidth={2.5} />
      </div>
    );
  }

  const filtered = operators.filter((op) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = op.name.toLowerCase().includes(q) ||
      op.identifier.includes(searchQuery) ||
      op.skills.some((s) => s.toLowerCase().includes(q));
    const matchesStatus = showSuspended ? !op.isActive : op.isActive;
    return matchesSearch && matchesStatus;
  });

  const activeCount = operators.filter((o) => o.isActive).length;
  const suspendedCount = operators.filter((o) => !o.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={24} className="text-navy-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Operator Roster</h1>
            <p className="text-sm text-slate-500">{activeCount} active {suspendedCount > 0 && `· ${suspendedCount} suspended`}</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-navy-900 hover:bg-navy-800 text-white font-medium rounded-lg shadow-sm"
        >
          <Plus size={18} /> Register Operator
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, or skill..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500"
          />
        </div>
        <button
          onClick={() => setShowSuspended(!showSuspended)}
          className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            showSuspended ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Shield size={16} /> Suspended
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/50 shadow-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Users size={48} className="text-slate-300 mb-4" />
            <h3 className="font-medium text-slate-600 mb-2">No operators found</h3>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
                <th className="px-6 py-3">Operator</th>
                <th className="px-6 py-3">Phone / Login</th>
                <th className="px-6 py-3">PIN</th>
                <th className="px-6 py-3">Skills</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((op) => (
                <OperatorTableRow
                  key={op.id}
                  operator={op}
                  onToggleStatus={handleToggleStatus}
                  onEditSkills={setSkillsTarget}
                  onResetPin={handleResetPin}
                  onRemove={setRemoveTarget}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <RegisterOperatorModal
          onClose={() => setShowModal(false)}
          onRegistered={() => { setShowModal(false); loadOperators(); }}
          onSubmit={handleRegister}
        />
      )}

      {skillsTarget && (
        <EditOperatorSkillsModal
          operator={skillsTarget}
          onClose={() => setSkillsTarget(null)}
          onSaved={handleSkillsSaved}
        />
      )}

      {removeTarget && (
        <RemoveOperatorModal
          operator={removeTarget}
          onConfirm={handleRemove}
          onCancel={() => setRemoveTarget(null)}
        />
      )}

      {pinResult && (
        <ResetPinModal
          name={pinResult.name}
          phone={pinResult.phone}
          pin={pinResult.pin}
          onClose={() => setPinResult(null)}
        />
      )}
    </div>
  );
}
