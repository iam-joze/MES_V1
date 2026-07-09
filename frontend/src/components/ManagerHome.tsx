import { useState, useMemo } from "react";
import type { ComponentType, SVGProps } from "react";
import {
  LayoutGrid,
  FileText,
  Wrench,
  Users,
  AlertTriangle,
  Search,
  Bell,
  ChevronDown,
  Play,
  Activity,
  Clock,
  User,
  MapPin,
  CheckCircle2,
  Loader2,
  PauseCircle,
  Box,
  X,
  LogOut,
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

interface NavItem {
  key: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

/* ---------------------------------------------------------------------
   Mock data — stands in for Bolt Database reads until blueprintApi.ts /
   jobMonitorApi.ts / faultApi.ts are wired up (see IMPLEMENTATION notes).
   Replace each constant below with a live fetch when the backend lands.
--------------------------------------------------------------------- */

const CURRENT_MANAGER = { name: "Babirye Janet", role: "Manager" };

const NAV_ITEMS: NavItem[] = [
  { key: "operations", label: "Operations", icon: LayoutGrid },
  { key: "blueprints", label: "Blueprint Library", icon: FileText },
  { key: "jobs", label: "Job Builder", icon: Wrench },
  { key: "roster", label: "Operator Roster", icon: Users },
  { key: "faults", label: "Fault Records", icon: AlertTriangle },
];

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
    description:
      "High-speed bottle filling and capping station with inline cap torque verification.",
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
  Available: { cls: "bg-sky-50 text-sky-700 border-sky-200", icon: Clock },
  Running: { cls: "bg-teal-50 text-teal-700 border-teal-200", icon: Loader2, spin: true },
  Completed: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  Paused: { cls: "bg-amber-50 text-amber-700 border-amber-200", icon: PauseCircle },
};

function StatusBadge({ status }: { status: StageStatus }) {
  const cfg = STATUS_STYLES[status];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${cfg.cls}`}
    >
      <Icon className={`h-3 w-3 ${cfg.spin ? "animate-spin" : ""}`} />
      {status}
    </span>
  );
}

function StageRow({ stage }: { stage: Stage }) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 rounded-lg px-4 py-3 ${
        stage.status === "Running" ? "bg-teal-50/60" : ""
      }`}
    >
      <div className="flex min-w-[220px] flex-1 items-center gap-3">
        <StatusBadge status={stage.status} />
        <div>
          <p className="text-sm font-semibold text-slate-800">{stage.name}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <User className="h-3 w-3" /> {stage.operator}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {stage.station}
            </span>
          </div>
        </div>
      </div>
      <div className="text-xs font-medium text-slate-500">
        {stage.timer ? (
          <span className="font-mono text-teal-700">{stage.timer}</span>
        ) : (
          stage.eta && <span>{stage.eta}</span>
        )}
      </div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <span className="text-2xl font-bold text-slate-900">{value}</span>
    </div>
  );
}

/* ---------------------------------------------------------------------
   Manager Home (M1)
   SRS ref: SRS 3.3, 4.2.1 | UI Brief ref: Section 5.2, M1
--------------------------------------------------------------------- */

export default function ManagerHome() {
  const [activeNav, setActiveNav] = useState<string>("operations");
  const [search, setSearch] = useState<string>("");
  const [alerts, setAlerts] = useState<ManagerAlert[]>(INITIAL_ALERTS);
  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false);
  const [stopArmed, setStopArmed] = useState<boolean>(false);

  const runningCount = useMemo(
    () => ACTIVE_JOBS.reduce((n, j) => n + j.stages.filter((s) => s.status === "Running").length, 0),
    []
  );

  const filteredJobs = useMemo<Job[]>(() => {
    if (!search.trim()) return ACTIVE_JOBS;
    const q = search.toLowerCase();
    return ACTIVE_JOBS.filter(
      (j) =>
        j.id.toLowerCase().includes(q) ||
        j.name.toLowerCase().includes(q) ||
        j.stages.some((s) => s.operator.toLowerCase().includes(q))
    );
  }, [search]);

  const metrics = {
    assignedLines: ASSIGNED_LINES.length,
    activeJobs: ACTIVE_JOBS.length,
    unresolvedFaults: alerts.length,
  };

  const dismissAlert = (id: string) => setAlerts((prev) => prev.filter((a) => a.id !== id));

  const handleBuildJob = (line: ProductionLine) => {
    // TODO: route to M3 (Job Builder) pre-selected with this line, once
    // React Router + jobMonitorApi.ts are wired up.
    console.log("Navigate to Job Builder for", line.code);
  };

  return (
    <div className="flex h-full min-h-[820px] w-full bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-5 md:flex">
        <div className="mb-8 flex items-center gap-2 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
            <Box className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight text-slate-900">Dojo Hub</p>
            <p className="text-[11px] leading-tight text-slate-500">Uganda MES</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
            const active = activeNav === key;
            return (
              <button
                key={key}
                onClick={() => setActiveNav(key)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs, operators, or faults..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
            />
          </div>

          <button
            onClick={() => setStopArmed(true)}
            disabled={stopArmed}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
          >
            <AlertTriangle className="h-4 w-4" />
            {stopArmed ? "Emergency Stop Active" : "Emergency Stop"}
          </button>

          <button className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100">
            <Bell className="h-5 w-5" />
            {alerts.length > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            )}
          </button>

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
                {CURRENT_MANAGER.name.charAt(0)}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold leading-tight text-slate-800">{CURRENT_MANAGER.name}</p>
                <p className="text-[11px] leading-tight text-slate-500">{CURRENT_MANAGER.role}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50">
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Emergency stop banner */}
        {stopArmed && (
          <div className="flex items-center justify-between gap-3 bg-red-600 px-6 py-2.5 text-sm font-medium text-white">
            <span className="inline-flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Emergency Stop active — triggered by {CURRENT_MANAGER.name}
            </span>
            <button
              onClick={() => setStopArmed(false)}
              className="rounded-md bg-white/15 px-3 py-1 text-xs font-semibold hover:bg-white/25"
            >
              Resume
            </button>
          </div>
        )}

        {/* Scrollable body */}
        <main className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
          {/* Row 1: Assigned lines + Manager metrics */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                  <LayoutGrid className="h-4 w-4 text-slate-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Your Assigned Production Lines</h2>
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
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                            <LayoutGrid className="h-4 w-4 text-emerald-600" />
                          </div>
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            {line.code}
                          </span>
                        </div>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
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
              <div className="mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-slate-500" />
                <h2 className="text-base font-bold text-slate-900">Manager Metrics</h2>
              </div>
              <div className="space-y-4">
                <MetricRow label="Your assigned lines" value={metrics.assignedLines} />
                <MetricRow label="Active production jobs" value={metrics.activeJobs} />
                <MetricRow label="Unresolved faults" value={metrics.unresolvedFaults} />
              </div>
            </section>
          </div>

          {/* Row 2: Live job monitor + alerts */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-slate-500" />
                  <h2 className="text-base font-bold text-slate-900">Live Job Monitor</h2>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-700">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {runningCount} running
                </span>
              </div>

              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Active jobs</p>

              {filteredJobs.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
                  No active jobs match your search.
                </div>
              ) : (
                <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
                  {filteredJobs.map((job) => (
                    <div key={job.id} className="overflow-hidden rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5">
                        <div className="flex items-center gap-2 text-sm">
                          <Box className="h-3.5 w-3.5 text-slate-400" />
                          <span className="font-semibold text-slate-800">{job.id}</span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-600">{job.name}</span>
                        </div>
                        <span className="text-xs font-medium text-slate-500">
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
                <h2 className="text-base font-bold text-slate-900">Live Manager Alerts</h2>
              </div>
              <p className="mb-4 text-xs text-slate-500">
                Unresolved faults or paused operations. Sorted newest first.
              </p>

              {alerts.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
                  Nothing needs your attention right now.
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-700">
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
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:underline"
                        >
                          <X className="h-3 w-3" /> Dismiss
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}