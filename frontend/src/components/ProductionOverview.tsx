import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  Play,
  Pause,
  Loader2,
  Package,
} from 'lucide-react';
import type { ActiveProductionJob, ProductionKPI, ProcessStage, StageStatus } from '../types';

// Stage display configuration
const stageLabels: Record<ProcessStage, string> = {
  washing: 'Washing',
  pulping: 'Pulping',
  pasteurization: 'Pasteurization',
  mixing: 'Mixing',
  filling: 'Filling',
  capping: 'Capping',
  labeling: 'Labeling',
};

const stageStatusIcons: Record<StageStatus, React.ReactNode> = {
  completed: <CheckCircle2 size={16} className="text-success-500" />,
  running: <Loader2 size={16} className="text-info-500 animate-spin" />,
  available: <Circle size={16} className="text-slate-400" />,
  paused: <Pause size={16} className="text-warning-500" />,
};

const stageStatusBadge: Record<StageStatus, string> = {
  completed: 'status-badge-success',
  running: 'status-badge-info',
  available: 'bg-slate-100 text-slate-600 border border-slate-200',
  paused: 'status-badge-warning',
};

interface JobCardProps {
  job: ActiveProductionJob;
}

function JobCard({ job }: JobCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const completedStages = job.stages.filter(s => s.status === 'completed').length;

  return (
    <div className="card card-hover p-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Package size={16} className="text-navy-500" />
            <span className="font-semibold text-slate-900">{job.jobId}</span>
          </div>
          <p className="text-sm text-slate-600 mt-1">{job.productName} - {job.batch}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`status-badge ${job.stages.find(s => s.stage === job.currentStage)?.status === 'running' ? 'status-badge-info' : 'status-badge-warning'}`}>
            {completedStages}/{job.stages.length} stages
          </span>
          {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-navy-600 to-navy-500 rounded-full transition-all duration-500"
          style={{ width: `${job.progress}%` }}
        />
      </div>

      {/* Expanded Timeline */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            {job.stages.map((stage, index) => (
              <div key={stage.stage} className="flex flex-col items-center relative">
                {/* Connector Line */}
                {index < job.stages.length - 1 && (
                  <div className={`absolute top-2.5 left-[50%] w-full h-0.5 ${
                    stage.status === 'completed' ? 'bg-success-400' : 'bg-slate-200'
                  }`} />
                )}
                {/* Node */}
                <div className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center ${
                  stage.status === 'completed' ? 'bg-success-100' :
                  stage.status === 'running' ? 'bg-info-100' :
                  stage.status === 'paused' ? 'bg-warning-100' : 'bg-slate-100'
                }`}>
                  {stageStatusIcons[stage.status]}
                </div>
                {/* Label */}
                <span className={`mt-2 text-[10px] font-medium text-center max-w-[60px] ${
                  stage.status === 'completed' ? 'text-success-600' :
                  stage.status === 'running' ? 'text-info-600' :
                  stage.status === 'paused' ? 'text-warning-600' : 'text-slate-400'
                }`}>
                  {stageLabels[stage.stage]}
                </span>
                {/* Status Badge */}
                <span className={`mt-1 status-badge text-[8px] px-1.5 py-0.5 ${stageStatusBadge[stage.status]}`}>
                  {stage.status}
                </span>
              </div>
            ))}
          </div>

          {/* Current Stage Info */}
          <div className="mt-4 bg-slate-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm">
              <Play size={14} className="text-info-500" />
              <span className="font-medium text-slate-700">Current: {stageLabels[job.currentStage]}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Started at {new Date(job.startTime).toLocaleTimeString()} • Assigned: {job.assignedOperators.join(', ')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

interface GaugeChartProps {
  value: number;
  size?: number;
  strokeWidth?: number;
}

function GaugeChart({ value, size = 120, strokeWidth = 12 }: GaugeChartProps) {
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const startAngle = -225;
  const endAngle = 45;

  const getColor = () => {
    if (value >= 85) return '#16a34a';
    if (value >= 70) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size / 1.5} className="overflow-visible">
        {/* Background Arc */}
        <path
          d={`M ${center + radius * Math.cos((startAngle * Math.PI) / 180)} ${center + radius * Math.sin((startAngle * Math.PI) / 180)}
              A ${radius} ${radius} 0 1 1 ${center + radius * Math.cos((endAngle * Math.PI) / 180)} ${center + radius * Math.sin((endAngle * Math.PI) / 180)}`}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Progress Arc */}
        <path
          d={`M ${center + radius * Math.cos((startAngle * Math.PI) / 180)} ${center + radius * Math.sin((startAngle * Math.PI) / 180)}
              A ${radius} ${radius} 0 ${value > 66 ? 1 : 0} 1 ${center + radius * Math.cos(((startAngle + (value / 100) * 270) * Math.PI) / 180)} ${center + radius * Math.sin(((startAngle + (value / 100) * 270) * Math.PI) / 180)}`}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      {/* Center Value */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
        <span className="text-2xl font-bold text-slate-900">{value}%</span>
        <span className="text-xs text-slate-500">OEE</span>
      </div>
    </div>
  );
}

interface CircularProgressProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
}

function CircularProgress({ value, max, size = 80, strokeWidth = 6 }: CircularProgressProps) {
  const percentage = (value / max) * 100;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#334e68"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <span className="text-lg font-bold text-navy-700">{percentage.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
}

interface ProductionOverviewProps {
  kpi: ProductionKPI;
  jobs: ActiveProductionJob[];
}

export function ProductionOverview({ kpi, jobs }: ProductionOverviewProps) {
  return (
    <div className="space-y-4">
      {/* Today's Output Card */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target size={18} className="text-navy-500" />
            <h3 className="font-semibold text-slate-900">Today's Output</h3>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-navy-900">
              {kpi.todayOutput.toLocaleString()}L
            </p>
            <p className="text-sm text-slate-500">{kpi.productName}</p>
          </div>
          <CircularProgress value={kpi.todayOutput} max={kpi.todayTarget} />
        </div>
        <div className="mt-3 flex items-center gap-2 text-sm">
          <span className="text-slate-500">Target: {kpi.todayTarget.toLocaleString()}L</span>
          <span className={`flex items-center gap-1 ${kpi.todayOutput >= kpi.todayTarget * 0.8 ? 'text-success-600' : 'text-warning-600'}`}>
            {kpi.todayOutput >= kpi.todayTarget * 0.8 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{((kpi.todayOutput / kpi.todayTarget) * 100).toFixed(0)}%</span>
          </span>
        </div>
      </div>

      {/* OEE Widget */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={18} className="text-navy-500" />
          <h3 className="font-semibold text-slate-900">Overall Equipment Effectiveness</h3>
        </div>
        <div className="flex items-center justify-center py-2">
          <GaugeChart value={kpi.oee} />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-50 rounded-lg p-2">
            <p className="text-lg font-semibold text-slate-900">{kpi.activeJobs}</p>
            <p className="text-xs text-slate-500">Active Jobs</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-2">
            <p className="text-lg font-semibold text-slate-900">{kpi.completedJobs}</p>
            <p className="text-xs text-slate-500">Completed</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-2">
            <p className="text-lg font-semibold text-slate-900">{kpi.oee}%</p>
            <p className="text-xs text-slate-500">OEE Score</p>
          </div>
        </div>
      </div>

      {/* Active Production Jobs */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-navy-500" />
            <h3 className="font-semibold text-slate-900">Active Production Jobs</h3>
          </div>
          <span className="status-badge status-badge-info">{jobs.length} running</span>
        </div>
        <div className="space-y-3">
          {jobs.map(job => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </div>
    </div>
  );
}
