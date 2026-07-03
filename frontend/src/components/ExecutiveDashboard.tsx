import React, { useState, useEffect, useCallback } from 'react';
import {
  Factory,
  LayoutDashboard,
  Users,
  Settings2,
  BarChart3,
  LogOut,
  Bell,
  TrendingUp,
  TrendingDown,
  Package,
  Target,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  UserPlus,
  Mail,
  Calendar,
  X,
  AlertOctagon,
  Loader2,
  ChevronRight,
  Layers,
  Briefcase,
} from 'lucide-react';
import { mockKPI, mockAlerts } from '../data/mockData';
import {
  fetchManagerAccounts,
  fetchProductionLines,
  fetchActiveLineCount,
  deactivateManagerAccount,
  addManagerAccount,
  type ManagerAccount,
} from '../data/executiveData';
import type { ProductionLine } from '../types';
import { ProductionLineMatrix } from './ProductionLineMatrix';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { getSharedState, type SharedJob } from '../lib/sharedState';

interface ExecutiveDashboardProps {
  onSignOut: () => void;
}

type ExecView = 'overview' | 'managers' | 'lines' | 'jobs' | 'analytics';

interface NavItem {
  id: ExecView;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { id: 'overview', label: 'Enterprise Overview', icon: <LayoutDashboard size={20} strokeWidth={2.5} /> },
  { id: 'managers', label: 'Manager Accounts', icon: <Users size={20} strokeWidth={2.5} /> },
  { id: 'lines', label: 'Production Lines', icon: <Layers size={20} strokeWidth={2.5} /> },
  { id: 'jobs', label: 'Active Jobs', icon: <Briefcase size={20} strokeWidth={2.5} /> },
  { id: 'analytics', label: 'Historical Analytics', icon: <BarChart3 size={20} strokeWidth={2.5} /> },
];

// ============================================================
// Shared UI helpers
// ============================================================
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
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>
          {icon}
        </div>
        <span
          className={`flex items-center gap-1 text-sm font-semibold ${
            trendUp ? 'text-success-600' : 'text-danger-600'
          }`}
        >
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

// ============================================================
// E1: Enterprise Overview
// ============================================================
function EnterpriseOverview({
  activeLineCount,
  managerCount,
  unassignedLines,
  onNavigateManagers,
  onNavigateLines,
}: {
  activeLineCount: number;
  managerCount: number;
  unassignedLines: ProductionLine[];
  onNavigateManagers: () => void;
  onNavigateLines: () => void;
}) {
  const criticalAlerts = mockAlerts.filter((a) => a.severity === 'critical' && !a.isResolved);

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Strategic Overview</h2>
        <p className="text-base text-slate-500 mt-1">
          Plant-wide performance snapshot — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Macro Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Active Production Lines"
          value={`${activeLineCount}`}
          trend="Stable"
          trendUp
          icon={<Package size={20} className="text-navy-600" strokeWidth={2.5} />}
          accent="bg-navy-100"
        />
        <KPICard
          label="Active Operating Managers"
          value={`${managerCount}`}
          trend="+1 this week"
          trendUp
          icon={<Users size={20} className="text-success-600" strokeWidth={2.5} />}
          accent="bg-success-100"
        />
        <KPICard
          label="Monthly Volume Target"
          value="84%"
          trend="+6%"
          trendUp
          icon={<Target size={20} className="text-info-600" strokeWidth={2.5} />}
          accent="bg-info-100"
        />
        <KPICard
          label="Critical Alerts"
          value={`${criticalAlerts.length}`}
          trend={criticalAlerts.length > 0 ? 'Needs attention' : 'All clear'}
          trendUp={criticalAlerts.length === 0}
          icon={<AlertTriangle size={20} className="text-danger-600" strokeWidth={2.5} />}
          accent="bg-danger-100"
        />
      </div>

      {/* Main content + Quick Action sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Lines Without Managers */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/50 shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={20} className="text-warning-600" strokeWidth={2.5} />
                <h3 className="font-bold text-slate-900">Lines Without Managers</h3>
              </div>
              <button
                onClick={onNavigateLines}
                className="flex items-center gap-1 text-sm font-semibold text-navy-600 hover:text-navy-700 transition-colors"
              >
                View All
                <ChevronRight size={16} strokeWidth={2.5} />
              </button>
            </div>

            {unassignedLines.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 size={40} className="text-success-500 mb-3" strokeWidth={2} />
                <p className="text-sm font-semibold text-slate-700">All Lines Assigned</p>
                <p className="text-xs text-slate-500 mt-1">Every production line has a manager.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {unassignedLines.map((line) => (
                  <div
                    key={line.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:border-navy-300 hover:bg-navy-50/30 transition-all cursor-pointer"
                    onClick={onNavigateLines}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-navy-700">{line.lineCode}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-warning-100 text-warning-700 border border-warning-200">
                        UNASSIGNED
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{line.name}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {line.productName || 'No product set'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right: Quick-Action Panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/50 shadow-card p-6">
            <h3 className="font-bold text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={onNavigateManagers}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-sm font-bold transition-all active:scale-[0.98]"
              >
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                  <UserPlus size={18} strokeWidth={2.5} />
                </div>
                Add Manager Account
                <ChevronRight size={18} className="ml-auto opacity-70" strokeWidth={2.5} />
              </button>
              <button
                onClick={onNavigateLines}
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

          {/* Critical Alerts */}
          <div className="bg-white rounded-2xl border border-slate-200/50 shadow-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={20} className="text-danger-600" strokeWidth={2.5} />
              <h3 className="font-bold text-slate-900">Critical Alerts</h3>
            </div>
            {criticalAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CheckCircle2 size={36} className="text-success-500 mb-2" strokeWidth={2} />
                <p className="text-sm font-semibold text-slate-700">All Clear</p>
              </div>
            ) : (
              <div className="space-y-3">
                {criticalAlerts.map((alert) => (
                  <div key={alert.id} className="p-3 rounded-xl bg-danger-50 border border-danger-200">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={18} className="text-danger-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{alert.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{alert.line}</p>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <Clock size={12} strokeWidth={2.5} />
                          {new Date(alert.timestamp).toLocaleTimeString()}
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

// ============================================================
// Add Manager Modal
// ============================================================
interface AddManagerModalProps {
  onClose: () => void;
  onCreated: (m: ManagerAccount) => void;
}

function AddManagerModal({ onClose, onCreated }: AddManagerModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [assignedLine, setAssignedLine] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fullName.trim()) { setError('Full name is required.'); return; }
    if (!email.trim() || !email.includes('@')) { setError('A valid email is required.'); return; }
    if (!phone.trim()) { setError('Phone number is required.'); return; }
    setSaving(true);
    try {
      const created = await addManagerAccount({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        assignedLine: assignedLine.trim() || null,
      });
      onCreated(created);
    } catch (e: any) {
      setError(e.message || 'Failed to create manager account.');
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
              <UserPlus size={20} className="text-navy-700" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Add Manager Account</h3>
              <p className="text-xs text-slate-500">Create a new manager login</p>
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
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Full Name *</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Nakato Aisha"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Corporate Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@dojohubug.com"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Phone Number *</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+256 700 000 000"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Assigned Production Line <span className="normal-case font-normal text-slate-400">(optional)</span></label>
            <input
              type="text"
              value={assignedLine}
              onChange={(e) => setAssignedLine(e.target.value)}
              placeholder="e.g. Line E - Passion Fruit"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-xs text-slate-500">
              The manager will use their <span className="font-semibold text-slate-700">phone number</span> and the shared password{' '}
              <span className="font-mono font-semibold text-slate-700">manager2024</span> to log in.
            </p>
          </div>
        </form>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit as any}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-sm font-bold transition-colors disabled:opacity-60"
          >
            {saving ? (
              <><Loader2 size={16} className="animate-spin" strokeWidth={2.5} />Creating...</>
            ) : (
              <><UserPlus size={16} strokeWidth={2.5} />Create Account</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// E3: Jobs Directory & Analysis
// ============================================================
function JobsDirectory() {
  const [jobs, setJobs] = useState<SharedJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<SharedJob | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadJobs = () => {
      const state = getSharedState();
      setJobs(state.jobs);
    };
    loadJobs();
    const interval = setInterval(loadJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredJobs = jobs.filter(job => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      job.jobName.toLowerCase().includes(term) ||
      job.productName.toLowerCase().includes(term) ||
      job.jobId.toLowerCase().includes(term)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-success-100 text-success-700 border-success-200';
      case 'paused': return 'bg-warning-100 text-warning-700 border-warning-200';
      case 'completed': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-info-100 text-info-700 border-info-200';
    }
  };

  const getJobStatus = (job: SharedJob) => {
    const statuses = job.stages.map(s => s.status);
    if (statuses.every(s => s === 'completed')) return 'completed';
    if (statuses.some(s => s === 'running')) return 'running';
    if (statuses.some(s => s === 'paused')) return 'paused';
    return 'available';
  };

  const getProgress = (job: SharedJob) => {
    const completed = job.stages.filter(s => s.status === 'completed').length;
    return Math.round((completed / job.stages.length) * 100);
  };

  if (selectedJob) {
    const jobStatus = getJobStatus(selectedJob);
    const progress = getProgress(selectedJob);

    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedJob(null)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ChevronRight size={16} className="rotate-180" />
          Back to Jobs
        </button>

        <div className="bg-white rounded-2xl border border-slate-200/50 shadow-card p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold text-slate-900">{selectedJob.jobName}</h2>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(jobStatus)}`}>
                  {jobStatus.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-slate-500">Job ID: {selectedJob.jobId}</p>
              <p className="text-sm text-slate-500">Product: {selectedJob.productName}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-slate-900">{progress}%</p>
              <p className="text-sm text-slate-500">Complete</p>
            </div>
          </div>

          <div className="mb-6">
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-success-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-500">Target Quantity</p>
              <p className="text-lg font-bold text-slate-900">{selectedJob.targetQuantity.toLocaleString()} {selectedJob.unit}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-500">Timeline</p>
              <p className="text-lg font-bold text-slate-900">{selectedJob.timeline}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-500">Stages</p>
              <p className="text-lg font-bold text-slate-900">{selectedJob.stages.length}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-500">Manager</p>
              <p className="text-lg font-bold text-slate-900">{selectedJob.managerName || 'Unassigned'}</p>
            </div>
          </div>

          <h3 className="font-bold text-slate-900 mb-4">Process Stages</h3>
          <div className="space-y-3">
            {selectedJob.stages.sort((a, b) => a.stageOrder - b.stageOrder).map((stage, idx) => (
              <div
                key={stage.id}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    stage.status === 'completed' ? 'bg-success-100 text-success-600' :
                    stage.status === 'running' ? 'bg-navy-100 text-navy-600' :
                    stage.status === 'paused' ? 'bg-warning-100 text-warning-600' :
                    'bg-slate-100 text-slate-400'
                  }`}>
                    {stage.status === 'completed' ? <CheckCircle2 size={20} strokeWidth={2.5} /> : idx + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{stage.stageName}</p>
                    <p className="text-sm text-slate-500">{stage.operatorName} · {stage.stationTag}</p>
                  </div>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(stage.status)}`}>
                  {stage.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Active Jobs</h2>
          <p className="text-base text-slate-500 mt-1">
            View and analyze individual production jobs.
          </p>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search jobs by name, product, or ID..."
          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20"
        />
      </div>

      {filteredJobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/50 shadow-card p-12 text-center">
          <Briefcase size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-lg font-semibold text-slate-700">No Active Jobs</p>
          <p className="text-sm text-slate-500 mt-1">
            {searchTerm ? 'No jobs match your search.' : 'Jobs will appear here when managers activate them from the Job Builder.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredJobs.map(job => {
            const jobStatus = getJobStatus(job);
            const progress = getProgress(job);

            return (
              <div
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className="bg-white rounded-2xl border border-slate-200/50 shadow-card p-5 cursor-pointer hover:border-navy-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-900">{job.jobName}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(jobStatus)}`}>
                        {jobStatus.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">{job.productName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900">{progress}%</p>
                  </div>
                </div>

                <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full bg-success-500 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>{job.stages.length} stages · {job.stages.filter(s => s.status === 'completed').length} done</span>
                  <span>{job.targetQuantity.toLocaleString()} {job.unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// E2: Manager Account Administration Directory
// ============================================================
function ManagerDirectory() {
  const [managers, setManagers] = useState<ManagerAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<ManagerAccount | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const loadManagers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchManagerAccounts();
      setManagers(data);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Failed to load manager accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadManagers();
  }, [loadManagers]);

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    setIsDeactivating(true);
    try {
      await deactivateManagerAccount(deactivateTarget.id);
      setManagers((prev) =>
        prev.map((m) => (m.id === deactivateTarget.id ? { ...m, isActive: false } : m))
      );
      setDeactivateTarget(null);
    } catch (e: any) {
      setError(e.message || 'Failed to deactivate account');
    } finally {
      setIsDeactivating(false);
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatLastLogin = (iso: string | null) => {
    if (!iso) return 'Never';
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHrs < 1) return 'Just now';
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return formatDate(iso);
  };

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Manager Account Administration</h2>
          <p className="text-base text-slate-500 mt-1">
            Manage registered site managers and their system access.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-sm font-bold transition-all active:scale-[0.98]"
        >
          <UserPlus size={18} strokeWidth={2.5} />
          Add Manager
        </button>
      </div>

      {/* Manager table */}
      <div className="bg-white rounded-2xl border border-slate-200/50 shadow-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="text-navy-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertTriangle size={32} className="text-danger-600 mb-3" strokeWidth={2.5} />
            <p className="text-base font-semibold text-slate-900">Failed to load</p>
            <p className="text-sm text-slate-500">{error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-6 py-4">
                    Manager Name
                  </th>
                  <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-6 py-4">
                    Corporate Email
                  </th>
                  <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-6 py-4">
                    Date Created
                  </th>
                  <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-6 py-4">
                    Last Login
                  </th>
                  <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-6 py-4">
                    Status
                  </th>
                  <th className="text-right text-xs font-bold text-slate-500 uppercase tracking-wider px-6 py-4">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {managers.map((manager) => (
                  <tr
                    key={manager.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-navy-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-navy-700">
                            {manager.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{manager.fullName}</p>
                          {manager.assignedLine && (
                            <p className="text-xs text-slate-500">{manager.assignedLine}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-slate-400" strokeWidth={2.5} />
                        <span className="text-sm text-slate-700">{manager.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" strokeWidth={2.5} />
                        <span className="text-sm text-slate-700">{formatDate(manager.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-700">{formatLastLogin(manager.lastLoginAt)}</span>
                    </td>
                    <td className="px-6 py-4">
                      {manager.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-success-100 text-success-700 border border-success-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-success-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          Deactivated
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {manager.isActive ? (
                        <button
                          onClick={() => setDeactivateTarget(manager)}
                          className="text-sm font-semibold text-danger-600 hover:text-danger-700 hover:bg-danger-50 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Deactivate Account
                        </button>
                      ) : (
                        <span className="text-sm text-slate-400 italic">No actions available</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddManagerModal
          onClose={() => setShowAddModal(false)}
          onCreated={(m) => {
            setManagers((prev) => [m, ...prev]);
            setShowAddModal(false);
          }}
        />
      )}

      {/* Deactivation confirmation modal */}
      {deactivateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => !isDeactivating && setDeactivateTarget(null)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-danger-100 flex items-center justify-center flex-shrink-0">
                  <AlertOctagon size={26} className="text-danger-600" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900">Deactivate Manager Account?</h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    You are about to deactivate{' '}
                    <span className="font-semibold text-slate-900">{deactivateTarget.fullName}</span>.
                    This will immediately block their system access.
                  </p>
                  <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-sm text-slate-600">
                      All historic logs, blueprint records, and production data created by this
                      manager will remain <span className="font-semibold text-success-700">fully intact</span> and
                      accessible. Only their login access is revoked.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeactivateTarget(null)}
                disabled={isDeactivating}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivate}
                disabled={isDeactivating}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold transition-colors"
              >
                {isDeactivating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" strokeWidth={2.5} />
                    Deactivating...
                  </>
                ) : (
                  <>
                    <X size={16} strokeWidth={2.5} />
                    Yes, Deactivate Account
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Main Executive Dashboard Component
// ============================================================
export function ExecutiveDashboard({ onSignOut }: ExecutiveDashboardProps) {
  const [activeView, setActiveView] = useState<ExecView>('overview');
  const [activeLineCount, setActiveLineCount] = useState(0);
  const [managers, setManagers] = useState<ManagerAccount[]>([]);
  const [unassignedLines, setUnassignedLines] = useState<ProductionLine[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (dataLoaded) return;
    (async () => {
      try {
        const [lineCount, mgrs, allLines] = await Promise.all([
          fetchActiveLineCount(),
          fetchManagerAccounts(),
          fetchProductionLines(),
        ]);
        setActiveLineCount(lineCount);
        setManagers(mgrs);
        setUnassignedLines(allLines.filter((l) => !l.assignedManager));
      } catch {
        // Non-blocking
      } finally {
        setDataLoaded(true);
      }
    })();
  }, [dataLoaded]);

  const activeManagerCount = managers.filter((m) => m.isActive).length;

  return (
    <div className="h-screen flex bg-slate-50">
      {/* Left persistent executive control menu */}
      <aside className="w-64 bg-navy-950 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-navy-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
              <Factory size={22} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">Dojo Hub Uganda</h1>
              <p className="text-xs text-slate-400 leading-tight">Executive Console</p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeView === item.id
                  ? 'bg-white/10 text-white border border-white/10'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Sign out */}
        <div className="px-3 py-4 border-t border-navy-800">
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-danger-500/10 hover:text-danger-400 transition-colors"
          >
            <LogOut size={20} strokeWidth={2.5} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Welcome back, Director
            </h2>
            <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-2">
              <Clock size={14} strokeWidth={2.5} />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              <span className="text-slate-300">·</span>
              {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <Bell size={20} strokeWidth={2.5} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full" />
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success-100 border border-success-200">
              <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
              <span className="text-sm font-semibold text-success-700">System Online</span>
            </div>
            <button
              onClick={onSignOut}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors"
            >
              <LogOut size={18} strokeWidth={2.5} />
              Sign Out
            </button>
          </div>
        </header>

        {/* Scrollable body */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeView === 'overview' && (
            <EnterpriseOverview
              activeLineCount={activeLineCount}
              managerCount={activeManagerCount}
              unassignedLines={unassignedLines}
              onNavigateManagers={() => setActiveView('managers')}
              onNavigateLines={() => setActiveView('lines')}
            />
          )}
          {activeView === 'managers' && <ManagerDirectory />}
          {activeView === 'lines' && <ProductionLineMatrix />}
          {activeView === 'jobs' && <JobsDirectory />}
          {activeView === 'analytics' && <AnalyticsDashboard />}
        </main>
      </div>
    </div>
  );
}
