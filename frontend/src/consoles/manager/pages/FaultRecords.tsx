import { useEffect, useState, useCallback } from 'react';
import {
  AlertTriangle, AlertCircle, CheckCircle2, Clock, Filter, Loader2, Wrench,
} from 'lucide-react';
import { api } from '../../../shared/lib/api';
import { ResolveFaultModal } from '../components/ResolveFaultModal';

interface FaultRecord {
  id: string;
  title: string;
  description: string | null;
  severity: 'CRITICAL' | 'MINOR';
  category: string | null;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  loggedAt: string;
  job: { id: string; jobId: string; name: string; line: { id: string; lineCode: string; name: string } };
  operator: { id: string; name: string } | null;
  stage: { id: string; stageName: string } | null;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function FaultRow({ fault, onResolve }: { fault: FaultRecord; onResolve: (fault: FaultRecord) => void }) {
  const isCritical = fault.severity === 'CRITICAL';
  const isResolved = !!fault.resolvedAt;

  return (
    <div className={`p-4 bg-white rounded-2xl border shadow-card ${isResolved ? 'border-slate-200/50 opacity-70' : isCritical ? 'border-danger-200' : 'border-warning-200'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isCritical ? 'bg-danger-100 text-danger-600' : 'bg-warning-100 text-warning-600'}`}>
            {isCritical ? <AlertCircle size={18} /> : <AlertTriangle size={18} />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-slate-900">{fault.title}</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isCritical ? 'bg-danger-100 text-danger-700 border-danger-200' : 'bg-warning-100 text-warning-700 border-warning-200'
              }`}>
                {fault.severity}
              </span>
              {isResolved && (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-success-100 text-success-700 border border-success-200">
                  <CheckCircle2 size={10} /> RESOLVED
                </span>
              )}
            </div>
            {fault.description && <p className="text-sm text-slate-500 mt-1">{fault.description}</p>}
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-2 flex-wrap">
              <span className="flex items-center gap-1"><Wrench size={12} />{fault.job.line.lineCode} — {fault.job.name}</span>
              {fault.operator && <span>Logged by {fault.operator.name}</span>}
              <span className="flex items-center gap-1"><Clock size={12} />{formatDateTime(fault.loggedAt)}</span>
            </div>
            {isResolved && fault.resolutionNotes && (
              <p className="text-xs text-success-700 bg-success-50 border border-success-200 rounded-lg px-3 py-2 mt-2">
                {fault.resolutionNotes}
              </p>
            )}
          </div>
        </div>

        {!isResolved && (
          <button
            onClick={() => onResolve(fault)}
            className="px-3 py-2 bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold rounded-lg flex-shrink-0"
          >
            Resolve
          </button>
        )}
      </div>
    </div>
  );
}

export function FaultRecords() {
  const [faults, setFaults] = useState<FaultRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'unresolved' | 'resolved' | 'all'>('unresolved');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'CRITICAL' | 'MINOR'>('all');
  const [resolvingFault, setResolvingFault] = useState<FaultRecord | null>(null);

  const loadFaults = useCallback(() => {
    api.get<{ faults: FaultRecord[] }>('/faults')
      .then((res) => setFaults(res.data.faults))
      .catch((err) => setError(err?.response?.data?.message || 'Failed to load fault records.'));
  }, []);

  useEffect(() => { loadFaults(); }, [loadFaults]);

  const handleResolve = async (id: string, resolutionNotes: string) => {
    await api.patch(`/faults/${id}/resolve`, { resolutionNotes });
    setResolvingFault(null);
    loadFaults();
  };

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-danger-50 border border-danger-200 text-danger-700">
        <AlertTriangle size={20} strokeWidth={2.5} />{error}
      </div>
    );
  }

  if (!faults) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 size={28} className="animate-spin" strokeWidth={2.5} />
      </div>
    );
  }

  const filtered = faults.filter((f) => {
    const matchesStatus = statusFilter === 'all' ? true : statusFilter === 'resolved' ? !!f.resolvedAt : !f.resolvedAt;
    const matchesSeverity = severityFilter === 'all' || f.severity === severityFilter;
    return matchesStatus && matchesSeverity;
  });

  const unresolvedCount = faults.filter((f) => !f.resolvedAt).length;
  const criticalCount = faults.filter((f) => !f.resolvedAt && f.severity === 'CRITICAL').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Fault Records</h1>
        <p className="text-sm text-slate-500">
          {unresolvedCount} unresolved {criticalCount > 0 && `· ${criticalCount} critical`}
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {(['unresolved', 'resolved', 'all'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${
                statusFilter === s ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Filter size={14} className="text-slate-400" />
          {(['all', 'CRITICAL', 'MINOR'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg capitalize transition-colors ${
                severityFilter === s ? 'bg-navy-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {s.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center bg-white rounded-2xl border border-slate-200/50">
          <CheckCircle2 size={48} className="text-success-400 mb-4" />
          <h3 className="font-medium text-slate-600">No fault records match these filters</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((f) => (
            <FaultRow key={f.id} fault={f} onResolve={setResolvingFault} />
          ))}
        </div>
      )}

      {resolvingFault && (
        <ResolveFaultModal
          fault={resolvingFault}
          onClose={() => setResolvingFault(null)}
          onSubmit={handleResolve}
        />
      )}
    </div>
  );
}