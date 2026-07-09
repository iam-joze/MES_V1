import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Factory,
  Activity,
  Package,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { api } from '../../../shared/lib/api';

interface AssignedLine {
  id: string;
  lineCode: string;
  name: string;
  description: string | null;
  targetProduct: string | null;
  isActive: boolean;
}

interface MetricsData {
  activeJobCount: number;
  unresolvedFaultCount: number;
}

function MetricCard({ label, value, icon, accent, danger }: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
  danger?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/50 shadow-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>{icon}</div>
      </div>
      <p className={`text-3xl font-bold tabular-nums ${danger ? 'text-danger-600' : 'text-slate-900'}`}>
        {value}
      </p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
    </div>
  );
}

function LineCard({ line, onBuildJob }: { line: AssignedLine; onBuildJob: () => void }) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:border-navy-300 hover:bg-navy-50/30 transition-all">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-navy-700">{line.lineCode}</span>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
            line.isActive
              ? 'bg-success-100 text-success-700 border-success-200'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}
        >
          {line.isActive ? 'ACTIVE' : 'INACTIVE'}
        </span>
      </div>
      <p className="text-sm font-semibold text-slate-900">{line.name}</p>
      <p className="text-xs text-slate-500 mt-1">{line.targetProduct || 'No product set'}</p>
      <button
        onClick={onBuildJob}
        className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-sm font-semibold transition-all active:scale-[0.98]"
      >
        Build Job
      </button>
    </div>
  );
}

export function Operations() {
  const navigate = useNavigate();
  const [lines, setLines] = useState<AssignedLine[] | null>(null);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      api.get<{ lines: AssignedLine[] }>('/manager/lines'),
      api.get<MetricsData>('/manager/metrics'),
    ])
      .then(([linesRes, metricsRes]) => {
        if (cancelled) return;
        setLines(linesRes.data.lines);
        setMetrics(metricsRes.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.response?.data?.message || 'Failed to load your operations data.');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-danger-50 border border-danger-200 text-danger-700">
        <AlertTriangle size={20} strokeWidth={2.5} />
        {error}
      </div>
    );
  }

  if (!lines || !metrics) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 size={28} className="animate-spin" strokeWidth={2.5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Operations</h2>
        <p className="text-base text-slate-500 mt-1">
          Your assigned production lines — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MetricCard
          label="Active Production Jobs"
          value={metrics.activeJobCount}
          icon={<Activity size={20} className="text-navy-600" strokeWidth={2.5} />}
          accent="bg-navy-100"
        />
        <MetricCard
          label="Unresolved Faults"
          value={metrics.unresolvedFaultCount}
          icon={<AlertTriangle size={20} className="text-danger-600" strokeWidth={2.5} />}
          accent="bg-danger-100"
          danger={metrics.unresolvedFaultCount > 0}
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/50 shadow-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Factory size={20} className="text-navy-600" strokeWidth={2.5} />
          <h3 className="font-bold text-slate-900">Your Assigned Production Lines</h3>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Package size={36} className="text-slate-300 mb-3" strokeWidth={2} />
            <p className="text-sm font-semibold text-slate-700">No Lines Assigned</p>
            <p className="text-xs text-slate-500 mt-1">Ask an executive to assign a production line to your account.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {lines.map((line) => (
              <LineCard key={line.id} line={line} onBuildJob={() => navigate('/manager/job-builder')} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}