import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Link2,
  Workflow,
  Hash,
  ClipboardList,
  Tag,
  Target,
  CalendarDays,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowDown,
  Save,
  Play,
} from "lucide-react";

/* ---------------------------------------------------------------------
   Types
--------------------------------------------------------------------- */

type TemplateCategory = "Processing" | "Packaging" | "Quality Control";

interface ProcessTemplate {
  id: string;
  name: string;
  duration: number;
  station: string;
  category: TemplateCategory;
}

interface Operator {
  id: string;
  name: string;
  skills: string[];
}

interface WorkOrder {
  id: string;
  product: string;
  targetOutput: number;
  unit: string;
}

interface PipelineStage {
  id: string;
  templateId: string;
  operatorId: string | null;
}

/* ---------------------------------------------------------------------
   Mock data — stands in for blueprintApi / jobMonitorApi reads until
   the backend is wired up.
--------------------------------------------------------------------- */

const CATEGORY_STYLES: Record<TemplateCategory, { border: string; text: string }> = {
  Processing: { border: "border-sky-200", text: "text-sky-700" },
  Packaging: { border: "border-amber-200", text: "text-amber-700" },
  "Quality Control": { border: "border-emerald-200", text: "text-emerald-700" },
};

const TEMPLATES: ProcessTemplate[] = [
  { id: "t-juice", name: "Juice Extraction", duration: 60, station: "Station B", category: "Processing" },
  { id: "t-uht", name: "UHT Pasteurization", duration: 90, station: "Station C", category: "Processing" },
  { id: "t-mango", name: "Mango Pulp Blending", duration: 75, station: "Station E", category: "Processing" },
  { id: "t-tetra", name: "TetraPak Filling", duration: 45, station: "Station D", category: "Packaging" },
  { id: "t-bottle", name: "Bottle Sterilization", duration: 40, station: "Station F", category: "Packaging" },
  { id: "t-label", name: "Labeling & Date Coding", duration: 25, station: "Station G", category: "Packaging" },
  { id: "t-qc", name: "Quality Inspection Gate", duration: 30, station: "QC Station", category: "Quality Control" },
];

const OPERATORS: Operator[] = [
  { id: "op-jim", name: "Jim Kim", skills: ["Sorting", "Pulping", "Labeling"] },
  { id: "op-nakato", name: "Nakato Grace", skills: ["Pasteurization", "QC Certified", "Washing"] },
  { id: "op-jack", name: "Jack Mark", skills: ["Extraction", "Filling", "Sorting"] },
  { id: "op-auma", name: "Auma Lydia", skills: ["Labeling", "Packaging", "QC Certified"] },
];

const WORK_ORDERS: WorkOrder[] = [
  { id: "WO-2024-004", product: "Dairy Yoghurt Cups", targetOutput: 4000, unit: "Cups" },
  { id: "WO-2024-005", product: "Orange & Passion Juice", targetOutput: 2500, unit: "Bottles" },
  { id: "WO-2024-006", product: "Mango Pulp Concentrate", targetOutput: 1200, unit: "Litres" },
];

const UNITS = ["Cups", "Bottles", "Litres", "Cartons", "Units"];

let uidCounter = 1;
const nextStageId = () => `stage-${uidCounter++}`;
const generateJobId = () => {
  const rand = (n: number) =>
    Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "").padEnd(n, "0").slice(0, n);
  return `JOB-${rand(8)}-${rand(4)}`;
};

/* ---------------------------------------------------------------------
   Helpers
--------------------------------------------------------------------- */

function formatTime(d: Date): string {
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function formatDateTimeInput(d: Date): string {
  const dd = d.getDate().toString().padStart(2, "0");
  const mm = (d.getMonth() + 1).toString().padStart(2, "0");
  const yyyy = d.getFullYear();
  let h = d.getHours();
  const min = d.getMinutes().toString().padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${h.toString().padStart(2, "0")}:${min}`;
}

function addMinutes(d: Date, mins: number): Date {
  return new Date(d.getTime() + mins * 60000);
}

/* ---------------------------------------------------------------------
   Job Builder (M3)
   SRS ref: SRS 3.3, 4.2.3 | UI Brief ref: Section 5.2, M3
--------------------------------------------------------------------- */

export default function JobBuilder() {
  const [jobId] = useState(generateJobId());
  const [workOrderId, setWorkOrderId] = useState("WO-2024-004");
  const [jobTitle, setJobTitle] = useState("Yogurt Kisaasi");
  const [targetOutput, setTargetOutput] = useState(4000);
  const [targetUnit, setTargetUnit] = useState("Cups");
  const [scheduledStart, setScheduledStart] = useState(new Date(2026, 6, 10, 15, 15));
  const [pickerOpen, setPickerOpen] = useState(false);

  const [pipeline, setPipeline] = useState<PipelineStage[]>([
    { id: nextStageId(), templateId: "t-juice", operatorId: "op-jim" },
    { id: nextStageId(), templateId: "t-tetra", operatorId: "op-nakato" },
    { id: nextStageId(), templateId: "t-label", operatorId: null },
  ]);

  const workOrder = WORK_ORDERS.find((w) => w.id === workOrderId) || null;

  const templatesByCategory = useMemo(() => {
    const map: Record<TemplateCategory, ProcessTemplate[]> = { Processing: [], Packaging: [], "Quality Control": [] };
    TEMPLATES.forEach((t) => map[t.category].push(t));
    return map;
  }, []);

  const stageWindows = useMemo(() => {
    let cursor = scheduledStart;
    return pipeline.map((stage) => {
      const template = TEMPLATES.find((t) => t.id === stage.templateId)!;
      const start = cursor;
      const end = addMinutes(start, template.duration);
      cursor = end;
      return { start, end, template };
    });
  }, [pipeline, scheduledStart]);

  const totalDuration = stageWindows.reduce((sum, s) => sum + s.template.duration, 0);
  const operatorsAssigned = pipeline.filter((s) => s.operatorId).length;
  const windowLabel =
    stageWindows.length > 0
      ? `${formatTime(stageWindows[0].start)} – ${formatTime(stageWindows[stageWindows.length - 1].end)}`
      : "—";

  const addStage = (templateId: string) => {
    setPipeline((prev) => [...prev, { id: nextStageId(), templateId, operatorId: null }]);
  };
  const removeStage = (id: string) => setPipeline((prev) => prev.filter((s) => s.id !== id));
  const setStageOperator = (id: string, operatorId: string) =>
    setPipeline((prev) => prev.map((s) => (s.id === id ? { ...s, operatorId } : s)));

  return (
    <div className="-m-6 flex h-[calc(100%+3rem)] w-[calc(100%+3rem)] min-h-[820px] bg-slate-50 text-slate-900">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header form */}
        <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
          <div className="mb-3 flex items-center gap-2">
            <Workflow className="h-5 w-5 text-slate-700" />
            <h1 className="text-lg font-bold text-slate-900">Job Builder</h1>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-5">
            <Field label="Job ID" icon={Hash}>
              <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-semibold text-slate-500">
                {jobId}
              </div>
            </Field>

            <Field label="Work Order" icon={ClipboardList}>
              <select
                value={workOrderId}
                onChange={(e) => {
                  setWorkOrderId(e.target.value);
                  const wo = WORK_ORDERS.find((w) => w.id === e.target.value);
                  if (wo) {
                    setTargetOutput(wo.targetOutput);
                    setTargetUnit(wo.unit);
                  }
                }}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
              >
                {WORK_ORDERS.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.id}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Job Title" icon={Tag}>
              <input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
              />
            </Field>

            <Field label="Target Output" icon={Target}>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  value={targetOutput}
                  onChange={(e) => setTargetOutput(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                />
                <select
                  value={targetUnit}
                  onChange={(e) => setTargetUnit(e.target.value)}
                  className="rounded-lg border border-slate-200 px-2 py-2 text-sm outline-none focus:border-slate-400"
                >
                  {UNITS.map((u) => (
                    <option key={u}>{u}</option>
                  ))}
                </select>
              </div>
            </Field>

            <Field label="Scheduled Start" icon={CalendarDays}>
              <div className="relative">
                <button
                  onClick={() => setPickerOpen((v) => !v)}
                  className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left text-sm outline-none hover:border-slate-300"
                >
                  {formatDateTimeInput(scheduledStart)}
                  <CalendarDays className="h-4 w-4 text-slate-400" />
                </button>
                {pickerOpen && (
                  <DateTimePicker
                    value={scheduledStart}
                    onChange={(d) => setScheduledStart(d)}
                    onClose={() => setPickerOpen(false)}
                  />
                )}
              </div>
            </Field>
          </div>

          {workOrder && (
            <p className="flex items-center gap-1.5 text-xs text-slate-500">
              <Link2 className="h-3.5 w-3.5" /> Linked to: <span className="font-semibold text-slate-700">{workOrder.product}</span>
            </p>
          )}
        </div>

        {/* Builder area */}
        <div className="flex min-h-0 flex-1 gap-4 overflow-hidden p-4 sm:p-6">
          {/* Process templates */}
          <div className="flex w-64 shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="shrink-0 border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                <ClipboardList className="h-4 w-4 text-slate-500" /> Process Templates
              </div>
              <p className="text-xs text-slate-500">Click to add to pipeline</p>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto px-3 py-3">
              {(Object.keys(templatesByCategory) as TemplateCategory[]).map((cat) => (
                <div key={cat}>
                  <p className="mb-1.5 px-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">{cat}</p>
                  <div className="space-y-2">
                    {templatesByCategory[cat].map((t) => {
                      const addedCount = pipeline.filter((s) => s.templateId === t.id).length;
                      return (
                        <button
                          key={t.id}
                          onClick={() => addStage(t.id)}
                          className={`w-full rounded-lg border ${CATEGORY_STYLES[cat].border} bg-white px-3 py-2 text-left transition-colors hover:bg-slate-50`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-800">{t.name}</p>
                            {addedCount > 0 && (
                              <span className="shrink-0 rounded-full bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                {addedCount > 1 ? `×${addedCount}` : "✓"}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-400">
                            <span className="inline-flex items-center gap-0.5">
                              <Clock className="h-3 w-3" /> {t.duration} min
                            </span>
                            <span className="inline-flex items-center gap-0.5">
                              <MapPin className="h-3 w-3" /> {t.station}
                            </span>
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pipeline */}
          <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4">
            {pipeline.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 py-16 text-center text-sm text-slate-400">
                <ClipboardList className="h-8 w-8 text-slate-200" />
                Click a process template on the left to start building this job's pipeline.
              </div>
            ) : (
              <div className="mx-auto max-w-md">
                {stageWindows.map(({ start, end, template }, i) => {
                  const stage = pipeline[i];
                  const operator = OPERATORS.find((o) => o.id === stage.operatorId) || null;
                  return (
                    <div key={stage.id}>
                      <div className="relative rounded-xl border border-slate-200 p-4">
                        <button
                          onClick={() => removeStage(stage.id)}
                          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>

                        <div className="mb-1 flex items-center gap-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
                            {i + 1}
                          </span>
                          <h3 className="flex-1 text-sm font-bold text-slate-900">{template.name}</h3>
                          <span className="text-xs font-medium text-slate-400">#{i + 1}</span>
                        </div>

                        <p className="ml-8 flex items-center gap-3 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" /> {template.duration} min
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" /> {template.station}
                          </span>
                        </p>
                        <p className="ml-8 mt-0.5 flex items-center gap-1 text-xs font-medium text-slate-400">
                          <Clock className="h-3 w-3" /> {formatTime(start)} - {formatTime(end)}
                        </p>

                        <div className="ml-8 mt-3">
                          <label className="mb-1 block text-[11px] font-semibold text-slate-500">Assigned Operator</label>
                          <select
                            value={stage.operatorId ?? ""}
                            onChange={(e) => setStageOperator(stage.id, e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                          >
                            <option value="">Select operator</option>
                            {OPERATORS.map((o) => (
                              <option key={o.id} value={o.id}>
                                {o.name}
                              </option>
                            ))}
                          </select>

                          {operator && (
                            <div className="mt-2 flex items-start gap-2">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[11px] font-bold text-slate-600">
                                {operator.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-slate-700">{operator.name}</p>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {operator.skills.map((s) => (
                                    <span
                                      key={s}
                                      className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500"
                                    >
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {i < stageWindows.length - 1 && (
                        <div className="flex justify-center py-1.5">
                          <ArrowDown className="h-4 w-4 text-slate-300" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer summary */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span>
              <span className="font-semibold text-slate-700">{pipeline.length}</span> stages configured
            </span>
            <span className="text-slate-300">|</span>
            <span>
              <span className="font-semibold text-slate-700">{operatorsAssigned}</span> operators assigned
            </span>
            <span className="text-slate-300">|</span>
            <span>
              Total duration: <span className="font-semibold text-slate-700">{totalDuration} min</span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" /> Window: <span className="font-semibold text-slate-700">{windowLabel}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              <Save className="h-4 w-4" /> Save Draft
            </button>
            <button
              disabled={pipeline.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Play className="h-4 w-4" /> Activate Production Run
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   Small field wrapper
--------------------------------------------------------------------- */

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: typeof Hash;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-slate-500">
        <Icon className="h-3 w-3" /> {label}
      </label>
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------------
   Date + time picker popover
--------------------------------------------------------------------- */

function DateTimePicker({
  value,
  onChange,
  onClose,
}: {
  value: Date;
  onChange: (d: Date) => void;
  onClose: () => void;
}) {
  const [viewMonth, setViewMonth] = useState(value.getMonth());
  const [viewYear, setViewYear] = useState(value.getFullYear());

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const days = useMemo(() => {
    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    const startOffset = (firstOfMonth.getDay() + 6) % 7; // Monday-first
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells: { date: number; inMonth: boolean; full: Date }[] = [];
    for (let i = startOffset - 1; i >= 0; i--) {
      cells.push({ date: daysInPrevMonth - i, inMonth: false, full: new Date(viewYear, viewMonth - 1, daysInPrevMonth - i) });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: d, inMonth: true, full: new Date(viewYear, viewMonth, d) });
    }
    while (cells.length % 7 !== 0 || cells.length < 42) {
      const nextDate = cells.length - (startOffset + daysInMonth) + 1;
      cells.push({ date: nextDate, inMonth: false, full: new Date(viewYear, viewMonth + 1, nextDate) });
    }
    return cells;
  }, [viewMonth, viewYear]);

  const shiftMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setViewMonth(m);
    setViewYear(y);
  };

  const selectDay = (full: Date) => {
    const updated = new Date(full);
    updated.setHours(value.getHours(), value.getMinutes());
    onChange(updated);
  };

  const setHour = (h: number) => {
    const updated = new Date(value);
    updated.setHours(h);
    onChange(updated);
  };
  const setMinute = (m: number) => {
    const updated = new Date(value);
    updated.setMinutes(m);
    onChange(updated);
  };

  const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const today = new Date();

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full z-50 mt-1 flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
        {/* Calendar */}
        <div className="w-72 p-3">
          <div className="mb-2 flex items-center justify-between">
            <button onClick={() => shiftMonth(-1)} className="rounded p-1 hover:bg-slate-100">
              <ChevronLeft className="h-4 w-4 text-slate-500" />
            </button>
            <span className="text-sm font-semibold text-slate-800">{monthLabel}</span>
            <button onClick={() => shiftMonth(1)} className="rounded p-1 hover:bg-slate-100">
              <ChevronRight className="h-4 w-4 text-slate-500" />
            </button>
          </div>
          <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-semibold text-slate-400">
            {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {days.map((cell, i) => {
              const selected = isSameDay(cell.full, value);
              const isToday = isSameDay(cell.full, today);
              return (
                <button
                  key={i}
                  onClick={() => selectDay(cell.full)}
                  className={`aspect-square rounded-md text-xs ${
                    selected
                      ? "bg-slate-900 font-bold text-white"
                      : cell.inMonth
                      ? isToday
                        ? "font-semibold text-slate-900 ring-1 ring-inset ring-slate-300"
                        : "text-slate-700 hover:bg-slate-100"
                      : "text-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {cell.date}
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-xs font-semibold">
            <button onClick={() => selectDay(today)} className="text-slate-400 hover:text-slate-600">
              Clear
            </button>
            <button onClick={() => selectDay(today)} className="text-slate-700 hover:underline">
              Today
            </button>
          </div>
        </div>

        {/* Time wheels */}
        <div className="flex border-l border-slate-100">
          <TimeWheel values={Array.from({ length: 24 }, (_, i) => i)} selected={value.getHours()} onSelect={setHour} />
          <TimeWheel values={Array.from({ length: 60 }, (_, i) => i)} selected={value.getMinutes()} onSelect={setMinute} />
        </div>
      </div>
    </>
  );
}

function TimeWheel({ values, selected, onSelect }: { values: number[]; selected: number; onSelect: (v: number) => void }) {
  return (
    <div className="h-64 w-14 overflow-y-auto py-1">
      {values.map((v) => (
        <button
          key={v}
          onClick={() => onSelect(v)}
          className={`block w-full py-1.5 text-center text-xs font-semibold ${
            v === selected ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          {v.toString().padStart(2, "0")}
        </button>
      ))}
    </div>
  );
}