import { useEffect, useState } from 'react';
import { Activity, Wrench, Users, Layers, Plus, Package, UserCog, Loader2, AlertTriangle } from 'lucide-react';
import { api } from '../../../shared/lib/api';
import { formatDate, initials } from '../../../shared/lib/formatters';
import { CreateLineModal } from '../components/CreateLineModal';
import { ReassignManagerModal } from '../components/ReassignManagerModal';
import type { ManagerAccount } from '../components/AddManagerModal';

export interface ProductionLine {
  id: string;
  lineCode: string;
  name: string;
  description: string | null;
  targetProduct: string | null;
  targetQuantity: number | null;
  unit: string | null;
  isActive: boolean;
  createdAt: string;
  managerId: string | null;
  manager: { id: string; name: string; identifier: string } | null;
}

function StatCard({ icon, value, label, accent }: { icon: React.ReactNode; value: number; label: string; accent: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/50 shadow-card p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${accent}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export function ProductionLines() {
  const [lines, setLines] = useState<ProductionLine[] | null>(null);
  const [managers, setManagers] = useState<ManagerAccount[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [reassignTarget, setReassignTarget] = useState<ProductionLine | null>(null);

  const loadLines = () => {
    api
      .get<ProductionLine[]>('/executive/lines')
      .then((res) => setLines(res.data))
      .catch((err) => setError(err?.response?.data?.message || 'Failed to load production lines.'));
  };

  useEffect(() => {
    loadLines();
    api
      .get<ManagerAccount[]>('/executive/managers')
      .then((res) => setManagers(res.data.filter((m) => m.isActive)))
      .catch(() => {});
  }, []);

  const handleCreated = (line: ProductionLine) => {
    setLines((prev) => (prev ? [...prev, line].sort((a, b) => a.lineCode.localeCompare(b.lineCode)) : [line]));
    setIsCreateOpen(false);
  };

  const handleAssigned = (updated: ProductionLine) => {
    setLines((prev) => prev?.map((l) => (l.id === updated.id ? updated : l)) ?? null);
    setReassignTarget(null);
  };

  const activeCount = lines?.filter((l) => l.isActive).length ?? 0;
  const maintenanceCount = lines?.filter((l) => !l.isActive).length ?? 0;
  const assignedCount = lines?.filter((l) => l.managerId).length ?? 0;
  const totalCount = lines?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Production Lines</h2>
          <p className="text-base text-slate-500 mt-1">
            Manage manufacturing lines and assign managers ({totalCount} line{totalCount === 1 ? '' : 's'}).
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-success-600 hover:bg-success-700 text-white text-sm font-bold transition-all"
        >
          <Plus size={18} strokeWidth={2.5} />
          New Line
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-danger-50 border border-danger-200 text-danger-700">
          <AlertTriangle size={20} strokeWidth={2.5} />
          {error}
        </div>
      )}

      {!lines ? (
        <div className="flex items-center justify-center py-24 text-slate-400">
          <Loader2 size={28} className="animate-spin" strokeWidth={2.5} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<Activity size={20} className="text-success-700" strokeWidth={2.5} />} value={activeCount} label="Active Lines" accent="bg-success-100" />
            <StatCard icon={<Wrench size={20} className="text-warning-700" strokeWidth={2.5} />} value={maintenanceCount} label="In Maintenance" accent="bg-warning-100" />
            <StatCard icon={<Users size={20} className="text-navy-700" strokeWidth={2.5} />} value={assignedCount} label="Assigned" accent="bg-navy-100" />
            <StatCard icon={<Layers size={20} className="text-slate-700" strokeWidth={2.5} />} value={totalCount} label="Total Lines" accent="bg-slate-100" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {lines.map((line) => (
              <div key={line.id} className="bg-white rounded-2xl border border-slate-200/50 shadow-card p-5 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${line.isActive ? 'bg-success-100' : 'bg-warning-100'}`}>
                    {line.isActive ? (
                      <Layers size={18} className="text-success-700" strokeWidth={2.5} />
                    ) : (
                      <Wrench size={18} className="text-warning-700" strokeWidth={2.5} />
                    )}
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      line.isActive ? 'bg-success-100 text-success-700 border border-success-200' : 'bg-warning-100 text-warning-700 border border-warning-200'
                    }`}
                  >
                    {line.isActive ? 'Active' : 'Maintenance'}
                  </span>
                </div>

                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{line.lineCode}</p>
                <p className="text-sm font-bold text-slate-900 mb-2">{line.name}</p>
                {line.description && <p className="text-xs text-slate-500 mb-3 line-clamp-2">{line.description}</p>}

                {line.targetProduct && (
                  <div className="flex items-start gap-2 mb-3">
                    <Package size={14} className="text-slate-400 mt-0.5" strokeWidth={2.5} />
                    <div>
                      <p className="text-xs text-slate-400 uppercase font-semibold">Default Product</p>
                      <p className="text-sm font-semibold text-slate-800">
                        {line.targetProduct}
                        {line.targetQuantity ? ` — ${line.targetQuantity.toLocaleString()} ${line.unit ?? ''}` : ''}
                      </p>
                    </div>
                  </div>
                )}

                <div className="mb-3">
                  <p className="text-xs text-slate-400 uppercase font-semibold mb-1.5">Assigned Manager</p>
                  {line.manager ? (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                        {initials(line.manager.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">{line.manager.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{line.manager.identifier}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No manager assigned</p>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 mb-3">Created {formatDate(line.createdAt)}</p>

                <button
                  onClick={() => setReassignTarget(line)}
                  className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors"
                >
                  <UserCog size={16} strokeWidth={2.5} />
                  Reassign Manager
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {isCreateOpen && <CreateLineModal onClose={() => setIsCreateOpen(false)} onCreated={handleCreated} />}
      {reassignTarget && (
        <ReassignManagerModal
          line={reassignTarget}
          managers={managers}
          onClose={() => setReassignTarget(null)}
          onAssigned={handleAssigned}
        />
      )}
    </div>
  );
}
