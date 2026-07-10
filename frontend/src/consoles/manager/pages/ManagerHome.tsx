import { useState, useMemo } from "react";
import type { ComponentType, SVGProps } from "react";
import {
  LayoutGrid,
  Activity,
  Clock,
  User,
  MapPin,
  CheckCircle2,
  Loader2,
  PauseCircle,
  Box,
  X,
  Play,
  AlertTriangle,
} from "lucide-react";

/* ---------------------------------------------------------------------
   Types
--------------------------------------------------------------------- */

type StageStatus = "Available" | "Running" | "Completed" | "Paused";

interface Stage {
  name: string;
  status: StageStatus;
  operator: string;
  station: string;
  eta?: string;
  timer?: string;
}

interface Job {
  id: string;
  name: string;
  completed: number;
  total: number;
  stages: Stage[];
}

interface ProductionLine {
  id: string;
  code: string;
  title: string;
  description: string;
  product: string;
  quantity: string;
  status: "Active" | "Idle";
}

interface ManagerAlert {
  id: string;
  type: string;
  time: string;
  message: string;
  meta: string;
}

/* ---------------------------------------------------------------------
   Mock data — stands in for Bolt Database reads until blueprintApi.ts /
   jobMonitorApi.ts / faultApi.ts are wired up.
--------------------------------------------------------------------- */

const ASSIGNED_LINES: ProductionLine[] = [
  {
    id: "line-b",
    code: "LINE-B",
    title: "Line B — Juice Blending & Pasteurization",
    description:
      "Secondary blending and thermal treatment of extracted fruit pulps for shelf-stable juice products.",
    product: "Premium Fruit Juice Blend",
    quantity: "3,000 L",
    status: "Active",
  },
  {
    id: "line-c",
    code: "LINE-C",
    title: "Line C — Automated Bottling",
    description: "High-speed bottle filling and capping station with inline cap torque verification.",
    product: "Bottled Fruit Beverage",
    quantity: "10,000 Units",
    status: "Active",
  },
];

const ACTIVE_JOBS: Job[] = [
  {
    id: "JOB-E1F601BD",
    name: "Orange & Passion Juice",
    completed: 0,
    total: 4,
    stages: [
      { name: "Juice Extraction", status: "Available", operator: "Jack Mark", station: "Station B", eta: "~60 min" },
      { name: "TetraPak Filling", status: "Available", operator: "Jim Kim", station: "Station D", eta: "~45 min" },
      { name: "Labeling & Date Coding", status: "Available", operator: "Jim Kim", station: "Station G", eta: "~25 min" },
      { name: "Quality Inspection Gate", status: "Available", operator: "Nakato Grace", station: "QC Station", eta: "~30 min" },
    ],
  },
  {
    id: "JOB-B677E0B5",
    name: "Strawberry Yoghurt Kisa...",
    completed: 0,
    total: 2,
    stages: [
      { name: "Labeling & Date Coding", status: "Available", operator: "Nakato Grace", station: "Station G", eta: "~25 min" },
      { name: "Quality Inspection Gate", status: "Running", operator: "Jim Kim", station: "QC Station", timer: "00:01:31" },
    ],
  },
  {
    id: "JOB-F1D66620",
    name: "xcfdg",
    completed: 1,
    total: 4,
    stages: [
      { name: "Juice Extraction", status: "Completed", operator: "Jim Kim", station: "Station B" },
      { name: "Mango Pulp Blending", status: "Available", operator: "Jim Kim", station: "Station E", eta: "~75 min" },
      { name: "Labeling & Date Coding", status: "Available", operator: "Auma Lydia", station: "Station G", eta: "~25 min" },
      { name: "Quality Inspection Gate", status: "Available", operator: "Jim Kim", station: "QC Station", eta: "~30 min" },
    ],
  },
  {
    id: "JOB-6A20526A",
    name: "Morning Pinaapp",
    completed: 0,
    total: 3,
    stages: [
      { name: "Juice Extraction", status: "Available", operator: "Jim Kim", station: "Station B", eta: "~60 min" },
      { name: "Labeling & Date Coding", status: "Available", operator: "Nakato Grace", station: "Station G", eta: "~25 min" },
      { name: "Quality Inspection Gate", status: "Available", operator: "Jim Kim", station: "QC Station", eta: "~30 min" },
    ],
  },
  {
    id: "JOB-3802CB6D",
    name: "Evening Mango Juice",
    completed: 0,
    total: 4,
    stages: [
      { name: "Juice Extraction", status: "Available", operator: "Jim Kim", station: "Station B", eta: "~60 min" },
      { name: "Mango Pulp Blending", status: "Available", operator: "Jim Kim", station: "Station E", eta: "~75 min" },
      { name: "Labeling & Date Coding", status: "Available", operator: "Nakato Grace", station: "Station G", eta: "~25 min" },
      { name: "Quality Inspection Gate", status: "Available", operator: "Jim Kim", station: "QC Station", eta: "~30 min" },
    ],
  },
];

const INITIAL_ALERTS: ManagerAlert[] = [
  {
    id: "alert-1",
    type: "PROCESS PAUSED",
    time: "10:37 AM",
    message: "Juice Extraction on xcfdg was paused. Reason: equipment_cleaning",
    meta: "Jim Kim / JOB-F1D66620",
  },
];

/* ---------------------------------------------------------------------
   Small presentational helpers
--------------------------------------------------------------------- */

const STATUS_STYLES: Record<StageStatus, { cls: string; icon: ComponentType<SVGProps<SVGSVGElement>>; spin?: boolean }> = {
  Available: { cls: "bg-sky-50 text-sky-700 border-sky-100", icon: Clock },
  Running: { cls: "bg-teal-50 text-teal-700 border-teal-100", icon: Loader2, spin: true },
  Completed: { cls: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: CheckCircle2 },
  Paused: { cls: "bg-amber-50 text-amber-700 border-amber-100", icon: PauseCircle },
};

function StatusBadge({ status }: { status: StageStatus }) {
  const cfg = STATUS_STYLES[status];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${cfg.cls}`}
    >
      <Icon className={`h-3 w-3 ${cfg.spin ? "animate-spin" : ""}`} />
      {status}
    </span>
  );
}

function StageRow({ stage }: { stage: Stage }) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 px-4 py-3 ${
        stage.status === "Running" ? "bg-teal-50/50" : ""
      }`}
    >
      <div className="flex min-w-[220px] flex-1 items-center gap-3">
        <StatusBadge status={stage.status} />
        <div>
          <p className="text-sm font-semibold text-slate-800">{stage.name}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1">
              <User className="h-3 w-3" /> {stage.operator}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {stage.station}
            </span>
          </div>
        </div>
      </div>
      <div className="text-xs font-medium text-slate-400">
        {stage.timer ? (
          <span className="font-mono text-teal-700">{stage.timer}</span>
        ) : (
          stage.eta && <span>{stage.eta}</span>
        )}
      </div>
    </div>
  );
}

function MetricRow({ label, value, last }: { label: string; value: number; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-3.5 ${!last ? "border-b border-slate-100" : ""}`}>
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <span className="text-2xl font-bold text-slate-900">{value}</span>
    </div>
  );
}

/* ---------------------------------------------------------------------
   Manager Home (M1) — content only; ManagerShell owns sidebar/top bar.
   SRS ref: SRS 3.3, 4.2.1 | UI Brief ref: Section 5.2, M1
--------------------------------------------------------------------- */

export default function ManagerHome() {
  const [alerts, setAlerts] = useState<ManagerAlert[]>(INITIAL_ALERTS);

  const runningCount = useMemo(
    () => ACTIVE_JOBS.reduce((n, j) => n + j.stages.filter((s) => s.status === "Running").length, 0),
    []
  );

  const metrics = {
    assignedLines: ASSIGNED_LINES.length,
    activeJobs: ACTIVE_JOBS.length,
    unresolvedFaults: alerts.length,
  };

  const dismissAlert = (id: string) => setAlerts((prev) => prev.filter((a) => a.id !== id));

  const handleBuildJob = (line: ProductionLine) => {
    // TODO: navigate("/manager/jobs", { state: { lineId: line.id } }) once
    // Job Builder accepts a pre-selected line via route state.
    console.log("Navigate to Job Builder for", line.code);
  };

  return (
    <div className="space-y-4">
      {/* Row 1: Assigned lines + Manager metrics */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_260px]">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
              <LayoutGrid className="h-4 w-4 text-slate-600" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-slate-900">Your Assigned Production Lines</h2>
              <p className="text-xs text-slate-500">
                Select a line to build a production job and orchestrate process workflows.
              </p>
            </div>
          </div>

          {ASSIGNED_LINES.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
              No production lines assigned yet. Lines will appear here once your Executive assigns one to you.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {ASSIGNED_LINES.map((line) => (
                <div key={line.id} className="flex flex-col rounded-xl border border-slate-200 p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50">
                        <LayoutGrid className="h-3.5 w-3.5 text-emerald-600" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{line.code}</span>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-700">
                      {line.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{line.title}</h3>
                  <p className="mt-1 flex-1 text-xs leading-relaxed text-slate-500">{line.description}</p>
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                    <Box className="h-3.5 w-3.5" />
                    {line.product} · {line.quantity}
                  </div>
                  <button
                    onClick={() => handleBuildJob(line)}
                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    <Play className="h-3.5 w-3.5" /> Build Job
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-slate-500" />
            <h2 className="text-[15px] font-bold text-slate-900">Manager Metrics</h2>
          </div>
          <div>
            <MetricRow label="Your assigned lines" value={metrics.assignedLines} />
            <MetricRow label="Active production jobs" value={metrics.activeJobs} />
            <MetricRow label="Unresolved faults" value={metrics.unresolvedFaults} last />
          </div>
        </section>
      </div>

      {/* Row 2: Live job monitor + alerts */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_260px]">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-slate-500" />
            <h2 className="text-[15px] font-bold text-slate-900">Live Job Monitor</h2>
          </div>

          <div className="mb-3 flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active jobs</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-bold uppercase text-teal-700">
              <Loader2 className="h-3 w-3 animate-spin" />
              {runningCount} running
            </span>
          </div>

          {ACTIVE_JOBS.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
              No active jobs right now.
            </div>
          ) : (
            <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
              {ACTIVE_JOBS.map((job) => (
                <div key={job.id} className="overflow-hidden rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5">
                    <div className="flex items-center gap-2 text-sm">
                      <Box className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-800">{job.id}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-600">{job.name}</span>
                    </div>
                    <span className="text-xs font-medium text-slate-400">
                      {job.completed} / {job.total} stages
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {job.stages.map((stage, i) => (
                      <StageRow key={i} stage={stage} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-1 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h2 className="text-[15px] font-bold text-slate-900">Live Manager Alerts</h2>
          </div>
          <p className="mb-4 text-xs leading-relaxed text-slate-500">
            Unresolved faults or paused operations. Sorted newest first.
          </p>

          {alerts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
              Nothing needs your attention right now.
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="rounded-lg border border-amber-100 bg-amber-50/60 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                      <PauseCircle className="h-3.5 w-3.5" />
                      {alert.type}
                    </div>
                    <span className="text-[11px] text-amber-600">{alert.time}</span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-amber-900">{alert.message}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-amber-600">{alert.meta}</span>
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="text-[10px] font-bold uppercase tracking-wide text-teal-700 hover:underline"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}