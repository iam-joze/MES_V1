import { useEffect, useState, useCallback } from 'react';
import { Users, Search, Plus, Phone, Shield, UserX, UserCheck2, AlertTriangle, Loader2, Calendar } from 'lucide-react';
import { api } from '../../../shared/lib/api';
import { RegisterOperatorModal } from '../components/RegisterOperatorModal';

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

function OperatorRow({ operator, onToggleStatus }: { operator: Operator; onToggleStatus: (id: string, isActive: boolean) => void }) {
  return (
    <div className={`flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200/50 shadow-card ${!operator.isActive ? 'opacity-60' : ''}`}>
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-navy-500 to-navy-700 flex items-center justify-center text-white font-semibold flex-shrink-0">
        {operator.name.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-slate-900 truncate">{operator.name}</p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            operator.isActive ? 'bg-success-100 text-success-700 border-success-200' : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}>
            {operator.isActive ? 'ACTIVE' : 'SUSPENDED'}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
          <Phone size={12} /><span>{operator.phone || operator.identifier}</span>
        </div>
      </div>

      <div className="hidden md:flex flex-wrap gap-1 max-w-[200px] justify-end">
        {operator.skills.length === 0 ? (
          <span className="text-xs text-slate-400 italic">No skills tagged</span>
        ) : (
          operator.skills.slice(0, 3).map((skill) => (
            <span key={skill} className="px-2 py-0.5 bg-navy-100 text-navy-700 text-[10px] font-medium rounded-full">
              {skill}
            </span>
          ))
        )}
        {operator.skills.length > 3 && (
          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-medium rounded-full">
            +{operator.skills.length - 3}
          </span>
        )}
      </div>

      <div className="hidden lg:flex items-center gap-1 text-xs text-slate-400 w-32 flex-shrink-0">
        <Calendar size={12} />
        <span>{operator.lastLoginAt ? new Date(operator.lastLoginAt).toLocaleDateString() : 'Never logged in'}</span>
      </div>

      <button
        onClick={() => onToggleStatus(operator.id, !operator.isActive)}
        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all flex-shrink-0 ${
          operator.isActive
            ? 'border border-danger-200 text-danger-600 hover:bg-danger-50'
            : 'border border-success-200 text-success-600 hover:bg-success-50'
        }`}
      >
        {operator.isActive ? <><UserX size={14} /> Suspend</> : <><UserCheck2 size={14} /> Reactivate</>}
      </button>
    </div>
  );
}

export function OperatorRoster() {
  const [operators, setOperators] = useState<Operator[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuspended, setShowSuspended] = useState(false);
  const [showModal, setShowModal] = useState(false);

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
    const matchesSearch = op.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      op.identifier.includes(searchQuery);
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
            placeholder="Search by name or phone..."
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

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center bg-white rounded-2xl border border-slate-200/50">
          <Users size={48} className="text-slate-300 mb-4" />
          <h3 className="font-medium text-slate-600 mb-2">No operators found</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((op) => (
            <OperatorRow key={op.id} operator={op} onToggleStatus={handleToggleStatus} />
          ))}
        </div>
      )}

      {showModal && (
        <RegisterOperatorModal
          onClose={() => setShowModal(false)}
          onRegistered={() => { setShowModal(false); loadOperators(); }}
          onSubmit={handleRegister}
        />
      )}
    </div>
  );
}