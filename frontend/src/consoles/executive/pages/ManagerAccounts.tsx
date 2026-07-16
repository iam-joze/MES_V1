import { useEffect, useState } from 'react';
import { UserPlus, Mail, Calendar, Loader2, AlertTriangle } from 'lucide-react';
import { api } from '../../../shared/lib/api';
import { formatDate, formatRelativeTime, initials } from '../../../shared/lib/formatters';
import { AddManagerModal, type ManagerAccount, type LineOption } from '../components/AddManagerModal';
import { ManagerActionsMenu } from '../components/ManagerActionsMenu';
import { RemoveManagerModal } from '../components/RemoveManagerModal';

export function ManagerAccounts() {
  const [managers, setManagers] = useState<ManagerAccount[] | null>(null);
  const [lines, setLines] = useState<LineOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<ManagerAccount | null>(null);

  const loadManagers = () => {
    api
      .get<ManagerAccount[]>('/executive/managers')
      .then((res) => setManagers(res.data))
      .catch((err) => setError(err?.response?.data?.message || 'Failed to load manager accounts.'));
  };

  useEffect(() => {
    loadManagers();
    api
      .get<LineOption[]>('/executive/lines')
      .then((res) => setLines(res.data))
      .catch(() => {});
  }, []);

  const handleToggleStatus = async (manager: ManagerAccount) => {
    setPendingId(manager.id);
    setError(null);
    try {
      const action = manager.isActive ? 'deactivate' : 'activate';
      await api.patch(`/executive/managers/${manager.id}/${action}`);
      setManagers((prev) => prev?.map((m) => (m.id === manager.id ? { ...m, isActive: !manager.isActive } : m)) ?? null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update account status.');
    } finally {
      setPendingId(null);
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    await api.delete(`/executive/managers/${removeTarget.id}`);
    setManagers((prev) => prev?.filter((m) => m.id !== removeTarget.id) ?? null);
    setRemoveTarget(null);
  };

  const handleCreated = (manager: ManagerAccount) => {
    setManagers((prev) => (prev ? [manager, ...prev] : [manager]));
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Manager Account Administration</h2>
          <p className="text-base text-slate-500 mt-1">Manage registered site managers and their system access.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-sm font-bold transition-all"
        >
          <UserPlus size={18} strokeWidth={2.5} />
          Add Manager
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-danger-50 border border-danger-200 text-danger-700">
          <AlertTriangle size={20} strokeWidth={2.5} />
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/50 shadow-card overflow-hidden">
        {!managers ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 size={28} className="animate-spin" strokeWidth={2.5} />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
                <th className="px-6 py-3">Manager Name</th>
                <th className="px-6 py-3">Corporate Email</th>
                <th className="px-6 py-3">Date Created</th>
                <th className="px-6 py-3">Last Login</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {managers.map((manager) => (
                <tr key={manager.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                        {initials(manager.name)}
                      </div>
                      <span className="font-semibold text-slate-900">{manager.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-slate-400" />
                      {manager.identifier}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-slate-400" />
                      {formatDate(manager.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{formatRelativeTime(manager.lastLoginAt)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        manager.isActive ? 'bg-success-100 text-success-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${manager.isActive ? 'bg-success-500' : 'bg-slate-400'}`} />
                      {manager.isActive ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {pendingId === manager.id ? (
                      <Loader2 size={16} className="animate-spin text-slate-400 inline-block" strokeWidth={2.5} />
                    ) : (
                      <div className="flex justify-end">
                        <ManagerActionsMenu
                          manager={manager}
                          onToggleStatus={() => handleToggleStatus(manager)}
                          onRemove={() => setRemoveTarget(manager)}
                        />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && <AddManagerModal lines={lines} onClose={() => setIsModalOpen(false)} onCreated={handleCreated} />}
      {removeTarget && (
        <RemoveManagerModal manager={removeTarget} onConfirm={handleRemove} onCancel={() => setRemoveTarget(null)} />
      )}
    </div>
  );
}
