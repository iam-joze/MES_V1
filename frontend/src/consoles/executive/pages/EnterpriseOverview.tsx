import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Package,
  Users,
  Target,
  AlertTriangle,
  CheckCircle2,
  Clock,
  UserPlus,
  Plus,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { api } from '../../../shared/lib/api';

interface UnassignedLine {
  id: string;
  lineCode: string;
  name: string;
  targetProduct: string | null;
}

interface CriticalAlert {
  id: string;
  title: string;
  line: string;
  loggedAt: string;
}

interface OverviewData {
  activeLineCount: number;
  activeManagerCount: number;
  monthlyVolumeTargetPct: number;
  unassignedLines: UnassignedLine[];
  criticalAlerts: CriticalAlert[];
}

function KPICard({
  label,
  value,
  unit,
  trend,
  trendUp,
  icon,
  accent,
}: {
  label: string;
  value: string;
  unit?: string;
  trend: string;
  trendUp: boolean;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/50 shadow-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>{icon}</div>
        <span className={`flex items-center gap-1 text-sm font-semibold ${trendUp ? 'text-success-600' : 'text-danger-600'}`}>
          {trendUp ? <TrendingUp size={16} strokeWidth={2.5} /> : <TrendingDown size={16} strokeWidth={2.5} />}
          {trend}
        </span>
      </div>
      <p className="text-3xl font-bold text-slate-900 tabular-nums">
        {value}
        {unit && <span className="text-lg text-slate-400 ml-1">{unit}</span>}
      </p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
    </div>
  );
}

export function EnterpriseOverview() {
  const navigate = useNavigate();
  const [data, setData] = useState<OverviewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<OverviewData>('/executive/overview')
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.response?.data?.message || 'Failed to load overview data.');
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

  if (!data) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 size={28} className="animate-spin" strokeWidth={2.5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Strategic Overview</h2>
        <p className="text-base text-slate-500 mt-1">
          Plant-wide performance snapshot — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Active Production Lines"
          value={`${data.activeLineCount}`}
          trend="Stable"
          trendUp
          icon={<Package size={20} className="text-navy-600" strokeWidth={2.5} />}
          accent="bg-navy-100"
        />
        <KPICard
          label="Active Operating Managers"
          value={`${data.activeManagerCount}`}
          trend="Stable"
          trendUp
          icon={<Users size={20} className="text-success-600" strokeWidth={2.5} />}
          accent="bg-success-100"
        />
        <KPICard
          label="Monthly Volume Target"
          value={`${data.monthlyVolumeTargetPct}`}
          unit="%"
          trend={data.monthlyVolumeTargetPct >= 50 ? 'On track' : 'Behind'}
          trendUp={data.monthlyVolumeTargetPct >= 50}
          icon={<Target size={20} className="text-info-600" strokeWidth={2.5} />}
          accent="bg-info-100"
        />
        <KPICard
          label="Critical Alerts"
          value={`${data.criticalAlerts.length}`}
          trend={data.criticalAlerts.length > 0 ? 'Needs attention' : 'All clear'}
          trendUp={data.criticalAlerts.length === 0}
          icon={<AlertTriangle size={20} className="text-danger-600" strokeWidth={2.5} />}
          accent="bg-danger-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/50 shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={20} className="text-warning-600" strokeWidth={2.5} />
                <h3 className="font-bold text-slate-900">Lines Without Managers</h3>
              </div>
              <button
                onClick={() => navigate('/executive/lines')}
                className="flex items-center gap-1 text-sm font-semibold text-navy-600 hover:text-navy-700 transition-colors"
              >
                View All
                <ChevronRight size={16} strokeWidth={2.5} />
              </button>
            </div>

            {data.unassignedLines.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 size={40} className="text-success-500 mb-3" strokeWidth={2} />
                <p className="text-sm font-semibold text-slate-700">All Lines Assigned</p>
                <p className="text-xs text-slate-500 mt-1">Every production line has a manager.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.unassignedLines.map((line) => (
                  <div
                    key={line.id}
                    onClick={() => navigate('/executive/lines')}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:border-navy-300 hover:bg-navy-50/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-navy-700">{line.lineCode}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-warning-100 text-warning-700 border border-warning-200">
                        UNASSIGNED
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{line.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{line.targetProduct || 'No product set'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/50 shadow-card p-6">
            <h3 className="font-bold text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/executive/managers')}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-sm font-bold transition-all active:scale-[0.98]"
              >
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                  <UserPlus size={18} strokeWidth={2.5} />
                </div>
                Add Manager Account
                <ChevronRight size={18} className="ml-auto opacity-70" strokeWidth={2.5} />
              </button>
              <button
                onClick={() => navigate('/executive/lines')}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-sm font-bold transition-all active:scale-[0.98]"
              >
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                  <Plus size={18} strokeWidth={2.5} />
                </div>
                Create Production Line
                <ChevronRight size={18} className="ml-auto opacity-70" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/50 shadow-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={20} className="text-danger-600" strokeWidth={2.5} />
              <h3 className="font-bold text-slate-900">Critical Alerts</h3>
            </div>
            {data.criticalAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CheckCircle2 size={36} className="text-success-500 mb-2" strokeWidth={2} />
                <p className="text-sm font-semibold text-slate-700">All Clear</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.criticalAlerts.map((alert) => (
                  <div key={alert.id} className="p-3 rounded-xl bg-danger-50 border border-danger-200">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={18} className="text-danger-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{alert.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{alert.line}</p>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <Clock size={12} strokeWidth={2.5} />
                          {new Date(alert.loggedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
