import { useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import {
  Calendar,
  Download,
  Clock,
  AlertTriangle,
  AlertOctagon,
  Trash2,
  Users,
  ChevronDown,
  ChevronRight,
  Loader2,
  AlertCircle,
  TrendingUp,
  Activity,
  Package,
  BarChart3,
  Filter,
} from 'lucide-react';
import {
  fetchDowntimeRecords,
  fetchFaultRecords,
  fetchScrapRecords,
  fetchOperatorMetrics,
  fetchJobStageAnalytics,
} from '../data/executiveData';
import type {
  DowntimeRecord,
  FaultRecord,
  ScrapRecord,
  OperatorMetric,
  JobStageAnalytic,
} from '../types';

// ============================================================
// Types & Constants
// ============================================================

type AnalyticsTab = 'timelines' | 'downtime' | 'scrap' | 'operators';

const tabConfig: { id: AnalyticsTab; label: string; icon: React.ReactNode }[] = [
  { id: 'timelines', label: 'Job Timelines', icon: <Clock size={18} strokeWidth={2.5} /> },
  { id: 'downtime', label: 'Downtime & Faults', icon: <AlertTriangle size={18} strokeWidth={2.5} /> },
  { id: 'scrap', label: 'Scrap Tracking', icon: <Trash2 size={18} strokeWidth={2.5} /> },
  { id: 'operators', label: 'Operator Output', icon: <Users size={18} strokeWidth={2.5} /> },
];

const downtimeReasonLabels: Record<string, string> = {
  machine_jam: 'Machine Jam',
  material_delay: 'Material Delay',
  scheduled_maintenance: 'Scheduled Maintenance',
  quality_hold: 'Quality Hold',
  operator_break: 'Operator Break',
  power_outage: 'Power Outage',
  equipment_failure: 'Equipment Failure',
  changeover: 'Changeover',
};

const downtimeColors: Record<string, string> = {
  machine_jam: '#f59e0b',
  material_delay: '#3b82f6',
  scheduled_maintenance: '#8b5cf6',
  quality_hold: '#ec4899',
  operator_break: '#6b7280',
  power_outage: '#ef4444',
  equipment_failure: '#f97316',
  changeover: '#14b8a6',
};

// ============================================================
// Mock Data (Demo visuals for empty states)
// ============================================================

interface MockJobRow {
  jobId: string;
  lineName: string;
  productName: string;
  targetQty: number;
  actualQty: number;
  completionDate: string;
  status: 'completed' | 'cancelled';
  stages: { name: string; duration: number }[];
}

const mockJobHistory: MockJobRow[] = [
  {
    jobId: 'JOB-402',
    lineName: 'Line A — Tropical Pulping',
    productName: 'Mango Nectar 500ml',
    targetQty: 1200,
    actualQty: 1180,
    completionDate: '2026-06-28',
    status: 'completed',
    stages: [
      { name: 'Pulping & Extraction', duration: 42 },
      { name: 'Thermal Evaporation', duration: 120 },
      { name: 'Pasteurization', duration: 35 },
      { name: 'Bottling & Capping', duration: 58 },
    ],
  },
  {
    jobId: 'JOB-403',
    lineName: 'Line C — Dairy Fluid Processing',
    productName: 'Strawberry Yoghurt 250ml',
    targetQty: 800,
    actualQty: 0,
    completionDate: '2026-06-28',
    status: 'cancelled',
    stages: [
      { name: 'Mix & Standardize', duration: 25 },
      { name: 'Homogenization', duration: 0 },
    ],
  },
  {
    jobId: 'JOB-405',
    lineName: 'Line B — PET Bottle Blow-Mold',
    productName: 'Spring Water 1L',
    targetQty: 2400,
    actualQty: 2385,
    completionDate: '2026-06-29',
    status: 'completed',
    stages: [
      { name: 'Preform Heating', duration: 18 },
      { name: 'Blow-Mold Forming', duration: 47 },
      { name: 'Quality Inspection', duration: 22 },
      { name: 'Palletizing', duration: 33 },
    ],
  },
  {
    jobId: 'JOB-407',
    lineName: 'Line A — Tropical Pulping',
    productName: 'Pineapple Juice 1L',
    targetQty: 1000,
    actualQty: 960,
    completionDate: '2026-06-30',
    status: 'completed',
    stages: [
      { name: 'Pulping & Extraction', duration: 38 },
      { name: 'Thermal Evaporation', duration: 110 },
      { name: 'Pasteurization', duration: 30 },
      { name: 'Bottling & Capping', duration: 52 },
    ],
  },
];

interface MockDowntimeRow {
  reason: string;
  frequency: number;
  totalHours: number;
  severity: 'critical' | 'minor';
}

const mockDowntimeByReason = [
  { reason: 'Equipment Malfunction', minutes: 245, color: '#ef4444' },
  { reason: 'Scheduled Cleaning', minutes: 180, color: '#3b82f6' },
  { reason: 'Material Delay', minutes: 120, color: '#f59e0b' },
  { reason: 'Shift Handover', minutes: 65, color: '#64748b' },
];

const mockFaultBreakdown: MockDowntimeRow[] = [
  { reason: 'Equipment Malfunction', frequency: 4, totalHours: 4.1, severity: 'critical' },
  { reason: 'Material Delay', frequency: 6, totalHours: 2.0, severity: 'minor' },
  { reason: 'Scheduled Cleaning', frequency: 3, totalHours: 3.0, severity: 'minor' },
  { reason: 'Shift Handover', frequency: 5, totalHours: 1.1, severity: 'minor' },
  { reason: 'Power Outage', frequency: 1, totalHours: 0.8, severity: 'critical' },
];

interface MockScrapRow {
  lineName: string;
  process: string;
  quantity: number;
  unit: string;
  wasteType: string;
}

const mockScrapData: MockScrapRow[] = [
  {
    lineName: 'Line A',
    process: 'Tropical Pulping',
    quantity: 150,
    unit: 'kg',
    wasteType: 'Refined Fruit Pulp Skim',
  },
  {
    lineName: 'Line B',
    process: 'PET Bottle Blow-Mold',
    quantity: 45,
    unit: 'Units',
    wasteType: 'Deformed Preforms',
  },
  {
    lineName: 'Line C',
    process: 'Dairy Fluid Processing',
    quantity: 12,
    unit: 'Liters',
    wasteType: 'Pasteurized Spillage',
  },
];

// ============================================================
// Date Range Picker Component
// ============================================================

function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200">
        <Calendar size={16} className="text-slate-400" strokeWidth={2.5} />
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="text-sm text-slate-700 bg-transparent outline-none"
        />
      </div>
      <span className="text-sm text-slate-400">to</span>
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200">
        <Calendar size={16} className="text-slate-400" strokeWidth={2.5} />
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="text-sm text-slate-700 bg-transparent outline-none"
        />
      </div>
    </div>
  );
}

// ============================================================
// Export Button Component
// ============================================================

function ExportButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-bold transition-all active:scale-[0.98]"
    >
      <Download size={18} strokeWidth={2.5} />
      Export to CSV/Excel
    </button>
  );
}

// ============================================================
// Empty State Component
// ============================================================

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Filter size={28} className="text-slate-400" strokeWidth={2} />
      </div>
      <p className="text-base font-semibold text-slate-700">No Records Available</p>
      <p className="text-sm text-slate-500 mt-1 max-w-sm">{message}</p>
    </div>
  );
}

// ============================================================
// Tab 1: Job Timelines
// ============================================================

function JobTimelinesTab({ data }: { data: JobStageAnalytic[] }) {
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());

  const jobsGrouped = useMemo(() => {
    const groups: Record<string, JobStageAnalytic[]> = {};
    data.forEach((item) => {
      if (!groups[item.jobId]) {
        groups[item.jobId] = [];
      }
      groups[item.jobId].push(item);
    });
    return groups;
  }, [data]);

  const toggleExpand = (jobId: string) => {
    setExpandedJobs((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      return next;
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-success-100 text-success-700 border border-success-200">
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-warning-100 text-warning-700 border border-warning-200">
            {status}
          </span>
        );
    }
  };

  if (data.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Job ID</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Production Line</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Product Name</th>
                  <th className="text-center px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Target Qty</th>
                  <th className="text-center px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actual Qty</th>
                  <th className="text-center px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Completion Date</th>
                  <th className="text-center px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {mockJobHistory.map((job) => {
                  const isExpanded = expandedJobs.has(job.jobId);
                  return (
                    <Fragment key={job.jobId}>
                      <tr
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors cursor-pointer"
                        onClick={() => toggleExpand(job.jobId)}
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown size={16} className="text-slate-400" strokeWidth={2.5} />
                            ) : (
                              <ChevronRight size={16} className="text-slate-400" strokeWidth={2.5} />
                            )}
                            <span className="text-base font-bold text-slate-900">{job.jobId}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-base text-slate-700">{job.lineName}</td>
                        <td className="px-6 py-5 text-base text-slate-700">{job.productName}</td>
                        <td className="px-6 py-5 text-center text-base text-slate-700">{job.targetQty.toLocaleString()}</td>
                        <td className="px-6 py-5 text-center text-base font-semibold text-slate-800">{job.actualQty.toLocaleString()}</td>
                        <td className="px-6 py-5 text-center text-base text-slate-600">{job.completionDate}</td>
                        <td className="px-6 py-5 text-center">{getStatusBadge(job.status)}</td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-50">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="pl-6 border-l-2 border-navy-200 space-y-3">
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Process Duration Breakdown</p>
                              {job.stages.map((stage, i) => (
                                <div key={i} className="flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full bg-navy-400 flex-shrink-0" />
                                  <span className="text-base text-slate-700 flex-1">{stage.name}</span>
                                  <span className="text-base font-semibold text-slate-900">{stage.duration} mins</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-xs text-slate-400 text-center">Demo data reflecting typical aggregation pipeline output for the selected date range.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
        <div className="col-span-4">Job / Product</div>
        <div className="col-span-2 text-center">Status</div>
        <div className="col-span-2 text-center">Stages</div>
        <div className="col-span-2 text-right">Est. Duration</div>
        <div className="col-span-2 text-right">Actual Duration</div>
      </div>

      {/* Job rows */}
      {Object.entries(jobsGrouped).map(([jobId, stages]) => {
        const isExpanded = expandedJobs.has(jobId);
        const firstStage = stages[0];
        const totalEstimated = stages.reduce(
          (sum, s) => sum + (s.estimatedDurationMinutes || 0),
          0
        );
        const totalActual = stages.reduce(
          (sum, s) => sum + (s.actualDurationMinutes || 0),
          0
        );

        return (
          <div key={jobId} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Main row */}
            <button
              onClick={() => toggleExpand(jobId)}
              className="w-full grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-slate-50 transition-colors text-left"
            >
              <div className="col-span-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-navy-100 flex items-center justify-center flex-shrink-0">
                  <Clock size={16} className="text-navy-600" strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{firstStage.jobName}</p>
                  <p className="text-xs text-slate-500">{firstStage.productName}</p>
                </div>
              </div>
              <div className="col-span-2 flex justify-center">{getStatusBadge(firstStage.status)}</div>
              <div className="col-span-2 text-center text-sm text-slate-700">{stages.length} stages</div>
              <div className="col-span-2 text-right text-sm font-medium text-slate-600">
                {totalEstimated} min
              </div>
              <div className="col-span-2 flex items-center justify-end gap-2">
                <span className="text-sm font-bold text-slate-900">
                  {firstStage.status === 'completed' ? `${totalActual} min` : '-'}
                </span>
                {isExpanded ? (
                  <ChevronDown size={18} className="text-slate-400" strokeWidth={2.5} />
                ) : (
                  <ChevronRight size={18} className="text-slate-400" strokeWidth={2.5} />
                )}
              </div>
            </button>

            {/* Expanded details */}
            {isExpanded && (
              <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-500 uppercase">
                      <th className="text-left py-2 pl-11">Stage</th>
                      <th className="text-center py-2">Est. (min)</th>
                      <th className="text-center py-2">Actual (min)</th>
                      <th className="text-center py-2">Variance</th>
                      <th className="text-right py-2">Operator</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stages
                      .sort((a, b) => a.stageOrder - b.stageOrder)
                      .map((stage) => {
                        const variance =
                          stage.actualDurationMinutes && stage.estimatedDurationMinutes
                            ? stage.actualDurationMinutes - stage.estimatedDurationMinutes
                            : null;
                        return (
                          <tr key={stage.id} className="border-t border-slate-200">
                            <td className="py-2 pl-11">
                              <span className="text-xs text-slate-500 mr-2">{stage.stageOrder}.</span>
                              <span className="font-medium text-slate-800">{stage.stageName}</span>
                            </td>
                            <td className="text-center py-2 text-slate-600">
                              {stage.estimatedDurationMinutes || '-'}
                            </td>
                            <td className="text-center py-2 font-medium text-slate-800">
                              {stage.actualDurationMinutes || '-'}
                            </td>
                            <td className="text-center py-2">
                              {variance !== null ? (
                                <span
                                  className={`font-medium ${
                                    variance > 0 ? 'text-danger-600' : 'text-success-600'
                                  }`}
                                >
                                  {variance > 0 ? '+' : ''}
                                  {variance}
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="text-right py-2 text-slate-600">
                              {stage.operatorName || '-'}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// Tab 2: Downtime & Fault Analytics
// ============================================================

function DowntimeAnalyticsTab({
  downtimeData,
  faultData,
}: {
  downtimeData: DowntimeRecord[];
  faultData: FaultRecord[];
}) {
  const [tooltipContent, setTooltipContent] = useState<{
    x: number;
    y: number;
    content: React.ReactNode;
  } | null>(null);

  const downtimeByReason = useMemo(() => {
    const aggregated: Record<string, number> = {};
    downtimeData.forEach((r) => {
      aggregated[r.reason] = (aggregated[r.reason] || 0) + r.durationMinutes;
    });
    return Object.entries(aggregated).map(([reason, totalMinutes]) => ({
      reason,
      label: downtimeReasonLabels[reason] || reason,
      totalMinutes,
      hours: (totalMinutes / 60).toFixed(1),
      color: downtimeColors[reason] || '#64748b',
    }));
  }, [downtimeData]);

  const faultsByDate = useMemo(() => {
    const aggregated: Record<string, { minor: number; critical: number }> = {};
    faultData.forEach((f) => {
      const date = f.loggedAt.split('T')[0];
      if (!aggregated[date]) {
        aggregated[date] = { minor: 0, critical: 0 };
      }
      if (f.severity === 'minor') {
        aggregated[date].minor++;
      } else {
        aggregated[date].critical++;
      }
    });
    return Object.entries(aggregated)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({
        date,
        ...counts,
        total: counts.minor + counts.critical,
      }));
  }, [faultData]);

  const maxHours = Math.max(...downtimeByReason.map((d) => parseFloat(d.hours)), 1);
  const maxFaults = Math.max(...faultsByDate.map((f) => f.total), 1);

  if (downtimeData.length === 0 && faultData.length === 0) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart - Downtime by Reason Category */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 size={20} className="text-navy-600" strokeWidth={2.5} />
              <h3 className="text-base font-bold text-slate-900">Downtime by Reason Category</h3>
            </div>
            <div className="space-y-4">
              {mockDowntimeByReason.map((item) => {
                const maxMinutes = Math.max(...mockDowntimeByReason.map((d) => d.minutes));
                const widthPct = (item.minutes / maxMinutes) * 100;
                return (
                  <div key={item.reason}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-base text-slate-700">{item.reason}</span>
                      <span className="text-base font-semibold text-slate-900">
                        {(item.minutes / 60).toFixed(1)} hrs
                      </span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${widthPct}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Fault Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fault Category</th>
                    <th className="text-center px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Frequency</th>
                    <th className="text-center px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Total Downtime</th>
                    <th className="text-center px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {mockFaultBreakdown.map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5 text-base text-slate-700">{row.reason}</td>
                      <td className="px-6 py-5 text-center text-base font-semibold text-slate-800">{row.frequency}</td>
                      <td className="px-6 py-5 text-center text-base text-slate-700">{row.totalHours.toFixed(1)} hrs</td>
                      <td className="px-6 py-5 text-center">
                        {row.severity === 'critical' ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-danger-100 text-danger-700 border border-danger-200">
                            <AlertOctagon size={12} strokeWidth={2.5} />
                            Critical
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-warning-100 text-warning-700 border border-warning-200">
                            <AlertTriangle size={12} strokeWidth={2.5} />
                            Minor
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-400 text-center">Demo data reflecting typical aggregation pipeline output for the selected date range.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stacked Bar Chart - Downtime by Reason */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900">Total Downtime by Reason</h3>
          <span className="text-sm text-slate-500">
            {downtimeByReason.reduce((sum, d) => sum + d.totalMinutes, 0)} total minutes
          </span>
        </div>

        {downtimeByReason.length > 0 ? (
          <div className="space-y-3">
            {downtimeByReason
              .sort((a, b) => b.totalMinutes - a.totalMinutes)
              .map((item) => (
                <div key={item.reason} className="flex items-center gap-4">
                  <div className="w-36 text-sm text-slate-700 truncate">{item.label}</div>
                  <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden relative">
                    <div
                      className="h-full rounded-lg transition-all duration-500 hover:opacity-80"
                      style={{
                        width: `${(parseFloat(item.hours) / maxHours) * 100}%`,
                        backgroundColor: item.color,
                      }}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltipContent({
                          x: rect.left + rect.width / 2,
                          y: rect.top - 10,
                          content: (
                            <div className="text-center">
                              <p className="font-bold">{item.label}</p>
                              <p className="text-sm">{item.hours} hours</p>
                              <p className="text-xs text-slate-400">{item.totalMinutes} minutes</p>
                            </div>
                          ),
                        });
                      }}
                      onMouseLeave={() => setTooltipContent(null)}
                    />
                  </div>
                  <div className="w-16 text-right text-sm font-semibold text-slate-700">
                    {item.hours}h
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-4">No downtime data available</p>
        )}
      </div>

      {/* Area Chart - Fault Trend */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900">Fault Frequency Trend</h3>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500" />
              Minor
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-500" />
              Critical
            </span>
          </div>
        </div>

        {faultsByDate.length > 0 ? (
          <div className="relative h-48">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-8 w-10 flex flex-col justify-between text-xs text-slate-400 text-right pr-2">
              <span>{maxFaults}</span>
              <span>{Math.floor(maxFaults / 2)}</span>
              <span>0</span>
            </div>

            {/* Chart area */}
            <div className="ml-12 h-40 relative">
              {/* Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="border-t border-slate-100" />
                ))}
              </div>

              {/* Bars */}
              <div className="absolute inset-0 flex items-end justify-around gap-1">
                {faultsByDate.map((day, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-0.5 h-full justify-end">
                    <div
                      className="w-full bg-red-500 rounded-t-sm transition-all duration-500"
                      style={{ height: `${(day.critical / maxFaults) * 100}%` }}
                      title={`${day.critical} critical`}
                    />
                    <div
                      className="w-full bg-amber-500 rounded-t-sm transition-all duration-500"
                      style={{ height: `${(day.minor / maxFaults) * 100}%` }}
                      title={`${day.minor} minor`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* X-axis labels */}
            <div className="ml-12 flex justify-around text-xs text-slate-400 mt-2">
              {faultsByDate.slice(0, 7).map((day, idx) => (
                <span key={idx} className="flex-1 text-center truncate">
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-4">No fault data available</p>
        )}
      </div>

      {/* Tooltip */}
      {tooltipContent && (
        <div
          className="fixed z-50 px-3 py-2 bg-slate-900 text-white text-sm rounded-lg shadow-lg pointer-events-none"
          style={{
            left: tooltipContent.x,
            top: tooltipContent.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {tooltipContent.content}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Tab 3: Scrap Tracking
// ============================================================

function ScrapTrackingTab({ data }: { data: ScrapRecord[] }) {
  const scrapByProduct = useMemo(() => {
    const aggregated: Record<string, number> = {};
    const byLine: Record<string, Record<string, number>> = {};

    data.forEach((r) => {
      aggregated[r.productType] = (aggregated[r.productType] || 0) + r.quantityKg;
      if (!byLine[r.lineName]) {
        byLine[r.lineName] = {};
      }
      byLine[r.lineName][r.productType] = (byLine[r.lineName][r.productType] || 0) + r.quantityKg;
    });

    return {
      byProduct: Object.entries(aggregated)
        .map(([productType, totalKg]) => ({ productType, totalKg }))
        .sort((a, b) => b.totalKg - a.totalKg),
      byLine: Object.entries(byLine)
        .map(([lineName, products]) => ({
          lineName,
          total: Object.values(products).reduce((sum, v) => sum + v, 0),
          products,
        }))
        .sort((a, b) => b.total - a.total),
    };
  }, [data]);

  const maxKg = Math.max(...scrapByProduct.byProduct.map((d) => d.totalKg), 1);

  const productColors: Record<string, string> = {
    'Mango Juice': '#f59e0b',
    'Pineapple Juice': '#10b981',
    'Mixed Fruit': '#8b5cf6',
    Yoghurt: '#ec4899',
    Water: '#3b82f6',
  };

  if (data.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Trash2 size={20} className="text-navy-600" strokeWidth={2.5} />
              <h3 className="text-base font-bold text-slate-900">Scrap & Waste Tracking</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Production Line</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Process</th>
                  <th className="text-center px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Quantity Wasted</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Waste Type</th>
                </tr>
              </thead>
              <tbody>
                {mockScrapData.map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <span className="text-base font-bold text-slate-900">{row.lineName}</span>
                    </td>
                    <td className="px-6 py-5 text-base text-slate-700">{row.process}</td>
                    <td className="px-6 py-5 text-center">
                      <span className="text-base font-semibold text-slate-900">{row.quantity}</span>
                      <span className="text-base text-slate-500 ml-1">{row.unit}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        {row.wasteType}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-xs text-slate-400 text-center">Demo data reflecting typical aggregation pipeline output for the selected date range.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-danger-100 flex items-center justify-center">
              <Trash2 size={18} className="text-danger-600" strokeWidth={2.5} />
            </div>
            <span className="text-sm text-slate-600">Total Scrap Volume</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {scrapByProduct.byProduct.reduce((sum, d) => sum + d.totalKg, 0).toFixed(1)} kg
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-navy-100 flex items-center justify-center">
              <Package size={18} className="text-navy-600" strokeWidth={2.5} />
            </div>
            <span className="text-sm text-slate-600">Product Types</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{scrapByProduct.byProduct.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-info-100 flex items-center justify-center">
              <Activity size={18} className="text-info-600" strokeWidth={2.5} />
            </div>
            <span className="text-sm text-slate-600">Production Lines</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{scrapByProduct.byLine.length}</p>
        </div>
      </div>

      {/* Scrap by Product Type */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-base font-bold text-slate-900 mb-4">Scrap by Beverage Type</h3>
        <div className="space-y-3">
          {scrapByProduct.byProduct.map((item) => (
            <div key={item.productType} className="flex items-center gap-4">
              <div className="w-32 text-sm text-slate-700">{item.productType}</div>
              <div className="flex-1 h-7 bg-slate-100 rounded-lg overflow-hidden">
                <div
                  className="h-full rounded-lg transition-all duration-500"
                  style={{
                    width: `${(item.totalKg / maxKg) * 100}%`,
                    backgroundColor: productColors[item.productType] || '#64748b',
                  }}
                />
              </div>
              <div className="w-20 text-right text-sm font-semibold text-slate-700">
                {item.totalKg.toFixed(1)} kg
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scrap by Production Line */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-base font-bold text-slate-900 mb-4">Scrap by Production Line</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {scrapByProduct.byLine.map((line) => (
            <div key={line.lineName} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-800">{line.lineName}</span>
                <span className="text-sm font-bold text-danger-600">{line.total.toFixed(1)} kg</span>
              </div>
              <div className="text-xs text-slate-500">
                {Object.keys(line.products).length} product types
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Tab 4: Operator Output Summary (No Rankings! FR-4.6.4-2)
// ============================================================

interface OperatorOutputRow {
  operatorName: string;
  entriesCompleted: number;
  avgActualDuration: number;
  avgBlueprintEstimate: number;
  totalFaultsLogged: number;
}

const mockOperatorOutput: OperatorOutputRow[] = [
  {
    operatorName: 'Jim Kim',
    entriesCompleted: 42,
    avgActualDuration: 18.4,
    avgBlueprintEstimate: 15.0,
    totalFaultsLogged: 3,
  },
  {
    operatorName: 'Jack Mark',
    entriesCompleted: 35,
    avgActualDuration: 22.1,
    avgBlueprintEstimate: 20.0,
    totalFaultsLogged: 0,
  },
  {
    operatorName: 'Nankinga Sarah',
    entriesCompleted: 51,
    avgActualDuration: 14.7,
    avgBlueprintEstimate: 16.5,
    totalFaultsLogged: 5,
  },
  {
    operatorName: 'Okello David',
    entriesCompleted: 28,
    avgActualDuration: 25.3,
    avgBlueprintEstimate: 22.0,
    totalFaultsLogged: 1,
  },
];

function OperatorOutputTab({ data }: { data: OperatorMetric[] }) {
  const aggregatedData = useMemo<OperatorOutputRow[]>(() => {
    if (data.length === 0) {
      return mockOperatorOutput;
    }

    const byOperator: Record<string, OperatorMetric[]> = {};
    data.forEach((m) => {
      if (!byOperator[m.operatorName]) {
        byOperator[m.operatorName] = [];
      }
      byOperator[m.operatorName].push(m);
    });

    return Object.entries(byOperator).map(([name, metrics]) => {
      const entriesCompleted = metrics.reduce((sum, m) => sum + m.tasksCompleted, 0);
      const durations = metrics
        .filter((m) => m.avgTaskDurationMinutes)
        .map((m) => m.avgTaskDurationMinutes!);
      const avgActualDuration =
        durations.length > 0
          ? durations.reduce((sum, d) => sum + d, 0) / durations.length
          : 0;
      const totalFaultsLogged = metrics.reduce((sum, m) => sum + m.faultsLogged, 0);

      return {
        operatorName: name,
        entriesCompleted,
        avgActualDuration,
        avgBlueprintEstimate: 18.0,
        totalFaultsLogged,
      };
    });
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Summary banner */}
      <div className="bg-gradient-to-r from-navy-900 to-navy-800 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Users size={20} strokeWidth={2.5} />
          <h3 className="text-base font-bold">Operator Output Summary</h3>
        </div>
        <p className="text-sm text-slate-300 max-w-2xl">
          Objective metrics for operator task completion and fault logging. This view displays raw
          operational data without evaluative rankings or scores.
        </p>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Operator Name
                </th>
                <th className="text-center px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Entries Completed
                </th>
                <th className="text-center px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Avg. Actual Duration
                </th>
                <th className="text-center px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Avg. Blueprint Estimate
                </th>
                <th className="text-center px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Total Faults Logged
                </th>
              </tr>
            </thead>
            <tbody>
              {aggregatedData.map((row, idx) => (
                <tr
                  key={idx}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-navy-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-navy-700">
                          {row.operatorName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)}
                        </span>
                      </div>
                      <span className="text-base font-bold text-slate-900">
                        {row.operatorName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="text-base font-semibold text-slate-800">
                      {row.entriesCompleted}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="text-base text-slate-700">
                      {row.avgActualDuration.toFixed(1)} min
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="text-base text-slate-700">
                      {row.avgBlueprintEstimate.toFixed(1)} min
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-base font-semibold text-slate-800">
                        {row.totalFaultsLogged}
                      </span>
                      {row.totalFaultsLogged > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-warning-100 text-warning-700 border border-warning-200">
                          <AlertTriangle size={12} strokeWidth={2.5} />
                          Flagged
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Date range note */}
      <p className="text-xs text-slate-400 text-center">
        Data reflects aggregation pipeline output for the selected date range.
      </p>
    </div>
  );
}

// ============================================================
// Main Analytics Dashboard
// ============================================================

export function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('timelines');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Data states
  const [downtimeData, setDowntimeData] = useState<DowntimeRecord[]>([]);
  const [faultData, setFaultData] = useState<FaultRecord[]>([]);
  const [scrapData, setScrapData] = useState<ScrapRecord[]>([]);
  const [operatorData, setOperatorData] = useState<OperatorMetric[]>([]);
  const [jobData, setJobData] = useState<JobStageAnalytic[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [downtime, faults, scrap, operators, jobs] = await Promise.all([
        fetchDowntimeRecords(startDate, endDate),
        fetchFaultRecords(startDate, endDate),
        fetchScrapRecords(startDate, endDate),
        fetchOperatorMetrics(startDate, endDate),
        fetchJobStageAnalytics(startDate, endDate),
      ]);
      setDowntimeData(downtime);
      setFaultData(faults);
      setScrapData(scrap);
      setOperatorData(operators);
      setJobData(jobs);
    } catch (e: any) {
      setError(e.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleExport = () => {
    const csvContent = [
      'Type,Line Name,Date,Duration/Quantity,Details',
      ...downtimeData.map(
        (d) => `Downtime,${d.lineName},${d.occurredAt},${d.durationMinutes} min,${d.reason}`
      ),
      ...faultData.map(
        (f) => `Fault,${f.lineName},${f.loggedAt},${f.severity},"${f.title}"`
      ),
      ...scrapData.map(
        (s) => `Scrap,${s.lineName},${s.loggedAt},${s.quantityKg} kg,${s.ingredientName}`
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `production-analytics-${startDate}-to-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Historical Data Analytics</h2>
        <p className="text-base text-slate-500 mt-1">
          Comprehensive production analytics and reporting engine.
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white rounded-xl border border-slate-200/80 p-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Filter size={16} className="text-slate-400" strokeWidth={2.5} />
          <span className="font-medium">Filters:</span>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
        </div>
        <ExportButton onClick={handleExport} disabled={loading} />
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-1 -mb-px">
          {tabConfig.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-navy-700 border border-b-white border-slate-200 -mb-px'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="bg-slate-50 rounded-b-xl">
        {loading ? (
          <div className="flex items-center justify-center py-20 bg-white rounded-xl border border-slate-200">
            <Loader2 size={28} className="text-navy-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-slate-200 text-center">
            <AlertCircle size={32} className="text-danger-600 mb-3" strokeWidth={2.5} />
            <p className="text-base font-semibold text-slate-900">Failed to Load Data</p>
            <p className="text-sm text-slate-500">{error}</p>
          </div>
        ) : (
          <>
            {activeTab === 'timelines' && <JobTimelinesTab data={jobData} />}
            {activeTab === 'downtime' && (
              <DowntimeAnalyticsTab downtimeData={downtimeData} faultData={faultData} />
            )}
            {activeTab === 'scrap' && <ScrapTrackingTab data={scrapData} />}
            {activeTab === 'operators' && <OperatorOutputTab data={operatorData} />}
          </>
        )}
      </div>
    </div>
  );
}
