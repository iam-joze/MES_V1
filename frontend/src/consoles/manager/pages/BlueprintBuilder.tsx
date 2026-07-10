import { useState } from "react";
import type { ComponentType, SVGProps } from "react";
import {
  X,
  FileText,
  CheckSquare,
  BarChart3,
  ClipboardCheck,
  AlertTriangle,
  ChevronUp,
  Trash2,
  ImageIcon,
  Camera,
  Info,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

/* ---------------------------------------------------------------------
   Shared types — also imported by BlueprintCatalog.tsx
--------------------------------------------------------------------- */

export type BlueprintCategory = "Preparation" | "Processing" | "Packaging" | "Quality Control";

export type FeatureKey =
  | "guidelines"
  | "checklist"
  | "quantity"
  | "qcForm"
  | "faults";

export interface Blueprint {
  id: string;
  name: string;
  description: string;
  category: BlueprintCategory;
  duration: number;
  station: string;
  archived: boolean;
  features: FeatureKey[];
}

export const CATEGORIES: BlueprintCategory[] = ["Preparation", "Processing", "Packaging", "Quality Control"];

export const FEATURE_TAGS: Record<string, { label: string; icon: ComponentType<SVGProps<SVGSVGElement>> }> = {
  guidelines: { label: "Guidelines", icon: FileText },
  checklist: { label: "Checklist", icon: CheckSquare },
  quantity: { label: "Quantity", icon: BarChart3 },
  qcForm: { label: "QC Form", icon: ClipboardCheck },
  faults: { label: "Faults", icon: AlertTriangle },
};

const UNITS = ["kg", "g", "L", "ml", "units", "pcs"];
const QC_TYPES = ["Pass/Fail", "Yes/No", "Numeric", "Text"];
const TIMINGS = ["Before Start", "Before Completion", "Both Stages"] as const;

let uidCounter = 100;
const nextId = () => `id-${uidCounter++}`;

/* ---------------------------------------------------------------------
   Form-state types
--------------------------------------------------------------------- */

interface ChecklistItem {
  id: string;
  text: string;
}
interface QuantityMetric {
  id: string;
  label: string;
  unit: string;
}
interface QcQuestion {
  id: string;
  text: string;
  type: string;
  required: boolean;
}
interface FaultCategory {
  id: string;
  name: string;
  severity: "Minor" | "Critical";
  photoAllowed: boolean;
}
interface PauseReason {
  id: string;
  text: string;
}
interface BaseSection {
  enabled: boolean;
  mandatory: boolean;
}

interface GuidelinesSection extends BaseSection {
  instructions: string;
}
interface ChecklistSection extends BaseSection {
  timing: (typeof TIMINGS)[number];
  items: ChecklistItem[];
}
interface QuantitySection extends BaseSection {
  metrics: QuantityMetric[];
}
interface QcFormSection extends BaseSection {
  questions: QcQuestion[];
}
interface FaultsSection extends BaseSection {
  categories: FaultCategory[];
  pauseReasons: PauseReason[];
}

interface BlueprintSections {
  guidelines: GuidelinesSection;
  checklist: ChecklistSection;
  quantity: QuantitySection;
  qcForm: QcFormSection;
  faults: FaultsSection;
}

interface BlueprintForm {
  name: string;
  description: string;
  category: BlueprintCategory;
  station: string;
  duration: number | string;
  sections: BlueprintSections;
}

function emptyForm(): BlueprintForm {
  return {
    name: "",
    description: "",
    category: "Preparation",
    station: "",
    duration: 30,
    sections: {
      guidelines: { enabled: false, mandatory: false, instructions: "" },
      checklist: {
        enabled: false,
        mandatory: false,
        timing: "Before Start",
        items: [
          { id: nextId(), text: "" },
          { id: nextId(), text: "" },
        ],
      },
      quantity: {
        enabled: false,
        mandatory: false,
        metrics: [
          { id: nextId(), label: "", unit: "kg" },
          { id: nextId(), label: "", unit: "kg" },
          { id: nextId(), label: "", unit: "kg" },
        ],
      },
      qcForm: {
        enabled: false,
        mandatory: false,
        questions: [
          { id: nextId(), text: "", type: "Pass/Fail", required: true },
          { id: nextId(), text: "", type: "Pass/Fail", required: true },
          { id: nextId(), text: "", type: "Pass/Fail", required: true },
        ],
      },
      faults: {
        enabled: false,
        mandatory: false,
        categories: [
          { id: nextId(), name: "", severity: "Minor", photoAllowed: false },
          { id: nextId(), name: "", severity: "Critical", photoAllowed: false },
          { id: nextId(), name: "", severity: "Minor", photoAllowed: false },
        ],
        pauseReasons: [{ id: nextId(), text: "" }],
      },
    },
  };
}

function mapBlueprintToForm(bp: Blueprint): BlueprintForm {
  const base = emptyForm();
  base.name = bp.name;
  base.description = bp.description;
  base.category = bp.category;
  base.station = bp.station;
  base.duration = bp.duration;
  bp.features.forEach((f) => {
    const section = base.sections[f] as BaseSection | undefined;
    if (section) section.enabled = true;
  });
  return base;
}

/* ---------------------------------------------------------------------
   Section metadata for rendering the toggle list
--------------------------------------------------------------------- */

const SECTION_META: {
  key: keyof BlueprintSections;
  label: string;
  subtitle: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  color: string;
}[] = [
  { key: "guidelines", label: "Guidelines", subtitle: "Operator instructions and reference materials", icon: FileText, color: "text-indigo-600 bg-indigo-50" },
  { key: "checklist", label: "Operator Checklist", subtitle: "Pre-task verification items", icon: CheckSquare, color: "text-blue-600 bg-blue-50" },
  { key: "quantity", label: "Quantity Logging", subtitle: "Track material quantities and flow", icon: BarChart3, color: "text-purple-600 bg-purple-50" },
  { key: "qcForm", label: "Quality Control Form", subtitle: "Inspection checkpoints and measurements", icon: ClipboardCheck, color: "text-teal-600 bg-teal-50" },
  { key: "faults", label: "Fault Categories", subtitle: "Predefined fault reporting options", icon: AlertTriangle, color: "text-red-600 bg-red-50" },
];

/* ---------------------------------------------------------------------
   Small shared controls
--------------------------------------------------------------------- */

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  const Icon = checked ? ToggleRight : ToggleLeft;
  return (
    <button type="button" onClick={() => onChange(!checked)} className="shrink-0 leading-none">
      <Icon className={checked ? "h-7 w-7 text-slate-900" : "h-7 w-7 text-slate-300"} strokeWidth={1.5} />
    </button>
  );
}

function MandatoryRow({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="mt-3 flex cursor-pointer items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
      <span className="text-xs font-medium text-slate-600">
        Mark as mandatory — operator can't end the process until this is satisfied
      </span>
      <Toggle checked={checked} onChange={onChange} />
    </label>
  );
}

/* ---------------------------------------------------------------------
   Blueprint Builder (M2a)
   SRS ref: SRS 3.3, 4.2.2 | UI Brief ref: Section 5.2, M2a
--------------------------------------------------------------------- */

interface BlueprintBuilderDrawerProps {
  initial: Blueprint | null;
  onClose: () => void;
  onSave: (bp: Omit<Blueprint, "id" | "archived">) => void;
}

export default function BlueprintBuilderDrawer({ initial, onClose, onSave }: BlueprintBuilderDrawerProps) {
  const [form, setForm] = useState<BlueprintForm>(() => (initial ? mapBlueprintToForm(initial) : emptyForm()));
  const [confirmClose, setConfirmClose] = useState(false);

  const updateSection = <K extends keyof BlueprintSections>(key: K, patch: Partial<BlueprintSections[K]>) =>
    setForm((f) => ({ ...f, sections: { ...f.sections, [key]: { ...f.sections[key], ...patch } } }));

  const anyEnabled = Object.values(form.sections).some((s) => s.enabled);
  const canSave = form.name.trim().length > 0 && anyEnabled;

  const handleAttemptClose = () => {
    if (form.name || form.description || anyEnabled) setConfirmClose(true);
    else onClose();
  };

  const handleCreate = () => {
    if (!canSave) return;
    onSave({
      name: form.name,
      description: form.description,
      category: form.category,
      duration: Number(form.duration) || 0,
      station: form.station || "—",
      features: (Object.entries(form.sections) as [FeatureKey, BaseSection][])
        .filter(([, v]) => v.enabled)
        .map(([k]) => k),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={handleAttemptClose} />

      <div className="relative flex h-full w-full max-w-[460px] flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{initial ? "Edit Blueprint" : "Create Blueprint"}</h2>
            <p className="text-xs text-slate-500">Configure stage template settings</p>
          </div>
          <button onClick={handleAttemptClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Basic Information */}
          <div className="mb-6 rounded-xl border border-slate-200 p-4">
            <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <Info className="h-3.5 w-3.5" /> Basic Information
            </div>

            <label className="mb-1 block text-xs font-semibold text-slate-600">Process Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g., Mixing Tank Sterilization"
              className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
            />

            <label className="mb-1 block text-xs font-semibold text-slate-600">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Brief description of this process stage..."
              rows={3}
              className="mb-3 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
            />

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as BlueprintCategory }))}
                  className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm outline-none focus:border-slate-400"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Station Tag</label>
                <input
                  value={form.station}
                  onChange={(e) => setForm((f) => ({ ...f, station: e.target.value }))}
                  placeholder="e.g., Station A"
                  className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm outline-none focus:border-slate-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Duration (min)</label>
                <input
                  type="number"
                  min={0}
                  value={form.duration}
                  onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm outline-none focus:border-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Feature Configuration */}
          <div className="mb-2">
            <h3 className="text-sm font-bold text-slate-900">Feature Configuration</h3>
            <p className="text-xs text-slate-500">Toggle features to enable and configure additional process controls</p>
          </div>

          <div className="space-y-3">
            {SECTION_META.map(({ key, label, subtitle, icon: Icon, color }) => {
              const section = form.sections[key];
              return (
                <div key={key} className="rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Toggle
                      checked={section.enabled}
                      onChange={(v) => updateSection(key, { enabled: v, ...(v ? {} : { mandatory: false }) } as Partial<BlueprintSections[typeof key]>)}
                    />
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800">{label}</p>
                      <p className="text-xs text-slate-500">{subtitle}</p>
                    </div>
                    {section.enabled && <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" />}
                  </div>

                  {section.enabled && (
                    <div className="border-t border-slate-100 px-4 py-4">
                      {key === "guidelines" && (
                        <GuidelinesFields section={form.sections.guidelines} onChange={(p) => updateSection("guidelines", p)} />
                      )}
                      {key === "checklist" && (
                        <ChecklistFields section={form.sections.checklist} onChange={(p) => updateSection("checklist", p)} />
                      )}
                      {key === "quantity" && (
                        <QuantityFields section={form.sections.quantity} onChange={(p) => updateSection("quantity", p)} />
                      )}
                      {key === "qcForm" && (
                        <QcFormFields section={form.sections.qcForm} onChange={(p) => updateSection("qcForm", p)} />
                      )}
                      {key === "faults" && (
                        <FaultFields section={form.sections.faults} onChange={(p) => updateSection("faults", p)} />
                      )}
                      <MandatoryRow checked={section.mandatory} onChange={(v) => updateSection(key, { mandatory: v } as Partial<BlueprintSections[typeof key]>)} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button
            onClick={handleAttemptClose}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!canSave}
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {initial ? "Save Changes" : "Create Blueprint"}
          </button>
        </div>
      </div>

      {confirmClose && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900">Discard unsaved changes?</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Your blueprint hasn't been saved yet. Closing now will lose what you've entered.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setConfirmClose(false)}
                className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Keep editing
              </button>
              <button onClick={onClose} className="rounded-lg bg-red-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-red-700">
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------
   Section field editors
--------------------------------------------------------------------- */

function GuidelinesFields({ section, onChange }: { section: GuidelinesSection; onChange: (p: Partial<GuidelinesSection>) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-slate-600">Operator Instructions</label>
      <textarea
        value={section.instructions}
        onChange={(e) => onChange({ instructions: e.target.value })}
        placeholder="Enter detailed guidelines for operators..."
        rows={3}
        className="mb-4 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
      />
      <label className="mb-1 block text-xs font-semibold text-slate-600">Reference Images</label>
      <div className="flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-slate-200 py-6 text-center">
        <ImageIcon className="h-5 w-5 text-slate-300" />
        <p className="text-xs font-medium text-slate-500">Drag & drop images or click to upload</p>
        <p className="text-[11px] text-slate-400">PNG, JPG up to 5MB each</p>
      </div>
    </div>
  );
}

function ChecklistFields({ section, onChange }: { section: ChecklistSection; onChange: (p: Partial<ChecklistSection>) => void }) {
  const setItem = (id: string, text: string) =>
    onChange({ items: section.items.map((it) => (it.id === id ? { ...it, text } : it)) });
  const addItem = () => onChange({ items: [...section.items, { id: nextId(), text: "" }] });
  const removeItem = (id: string) => onChange({ items: section.items.filter((it) => it.id !== id) });

  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-600">Validation Timing</label>
      <div className="mb-4 grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">
        {TIMINGS.map((t) => (
          <button
            key={t}
            onClick={() => onChange({ timing: t })}
            className={`rounded-md px-2 py-1.5 text-xs font-semibold ${
              section.timing === t ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-600">Checklist Items</label>
        <button onClick={addItem} className="text-xs font-semibold text-slate-700 hover:underline">
          + Add Item
        </button>
      </div>
      <div className="space-y-2">
        {section.items.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            <input
              value={item.text}
              onChange={(e) => setItem(item.id, e.target.value)}
              placeholder="Enter checklist item..."
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
            <button onClick={() => removeItem(item.id)} className="p-1.5 text-slate-300 hover:text-red-500">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuantityFields({ section, onChange }: { section: QuantitySection; onChange: (p: Partial<QuantitySection>) => void }) {
  const setMetric = (id: string, patch: Partial<QuantityMetric>) =>
    onChange({ metrics: section.metrics.map((m) => (m.id === id ? { ...m, ...patch } : m)) });
  const addMetric = () => onChange({ metrics: [...section.metrics, { id: nextId(), label: "", unit: "kg" }] });
  const removeMetric = (id: string) => onChange({ metrics: section.metrics.filter((m) => m.id !== id) });

  return (
    <div>
      <div className="space-y-3">
        {section.metrics.map((m, i) => (
          <div key={m.id} className="flex items-end gap-2">
            <span className="mb-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
              {i + 1}
            </span>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-semibold text-slate-600">Metric Label</label>
              <input
                value={m.label}
                onChange={(e) => setMetric(m.id, { label: e.target.value })}
                placeholder="e.g., Raw Fruit Weight Input"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
              />
            </div>
            <div className="w-24">
              <label className="mb-1 block text-xs font-semibold text-slate-600">Unit</label>
              <select
                value={m.unit}
                onChange={(e) => setMetric(m.id, { unit: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm outline-none focus:border-slate-400"
              >
                {UNITS.map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
            </div>
            <button onClick={() => removeMetric(m.id)} className="mb-2 p-1.5 text-slate-300 hover:text-red-500">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addMetric}
        className="mt-3 w-full rounded-lg border border-dashed border-slate-200 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50"
      >
        + Add Another Quantity Metric
      </button>

      <div className="mt-4 rounded-lg bg-sky-50 p-3">
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-sky-700">
          <Info className="h-3.5 w-3.5" /> Example: Pineapple Pulping Run Configuration
        </p>
        {[
          ["1", "Raw Fruit Weight Input", "kg"],
          ["2", "Pure Extracted Pulp Yield", "L"],
          ["3", "Fibrous Scrap Material", "kg"],
        ].map(([n, l, u]) => (
          <div key={n} className="flex items-center justify-between py-0.5 text-xs text-sky-800">
            <span>
              {n}. {l}
            </span>
            <span className="font-semibold">{u}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function QcFormFields({ section, onChange }: { section: QcFormSection; onChange: (p: Partial<QcFormSection>) => void }) {
  const setQ = (id: string, patch: Partial<QcQuestion>) =>
    onChange({ questions: section.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)) });
  const addQ = () => onChange({ questions: [...section.questions, { id: nextId(), text: "", type: "Pass/Fail", required: true }] });
  const removeQ = (id: string) => onChange({ questions: section.questions.filter((q) => q.id !== id) });

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-600">Add quality inspection checkpoints</label>
        <button onClick={addQ} className="text-xs font-semibold text-slate-700 hover:underline">
          + Add Question
        </button>
      </div>
      <div className="space-y-3">
        {section.questions.map((q) => (
          <div key={q.id} className="rounded-lg border border-slate-100 p-2.5">
            <div className="mb-2 flex items-center gap-2">
              <input
                value={q.text}
                onChange={(e) => setQ(q.id, { text: e.target.value })}
                placeholder="Enter inspection question..."
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
              />
              <button onClick={() => removeQ(q.id)} className="p-1.5 text-slate-300 hover:text-red-500">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={q.type}
                onChange={(e) => setQ(q.id, { type: e.target.value })}
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-slate-400"
              >
                {QC_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <input type="checkbox" checked={q.required} onChange={(e) => setQ(q.id, { required: e.target.checked })} />
                Required
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FaultFields({ section, onChange }: { section: FaultsSection; onChange: (p: Partial<FaultsSection>) => void }) {
  const setCat = (id: string, patch: Partial<FaultCategory>) =>
    onChange({ categories: section.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  const addCat = () =>
    onChange({ categories: [...section.categories, { id: nextId(), name: "", severity: "Minor", photoAllowed: false }] });
  const removeCat = (id: string) => onChange({ categories: section.categories.filter((c) => c.id !== id) });

  const setReason = (id: string, text: string) =>
    onChange({ pauseReasons: section.pauseReasons.map((r) => (r.id === id ? { ...r, text } : r)) });
  const addReason = () => onChange({ pauseReasons: [...section.pauseReasons, { id: nextId(), text: "" }] });
  const removeReason = (id: string) => onChange({ pauseReasons: section.pauseReasons.filter((r) => r.id !== id) });

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-600">Define fault reasons for this stage</label>
        <button onClick={addCat} className="text-xs font-semibold text-slate-700 hover:underline">
          + Add Fault
        </button>
      </div>
      <div className="space-y-2">
        {section.categories.map((c) => (
          <div key={c.id} className="flex items-center gap-2">
            <input
              value={c.name}
              onChange={(e) => setCat(c.id, { name: e.target.value })}
              placeholder="e.g., Cap Feed Jam"
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
            <select
              value={c.severity}
              onChange={(e) => setCat(c.id, { severity: e.target.value as "Minor" | "Critical" })}
              className={`rounded-lg border px-2 py-2 text-xs font-semibold outline-none ${
                c.severity === "Critical" ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-700"
              }`}
            >
              <option>Minor</option>
              <option>Critical</option>
            </select>
            <button
              onClick={() => setCat(c.id, { photoAllowed: !c.photoAllowed })}
              className={`rounded-lg border p-2 ${c.photoAllowed ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-400"}`}
              title="Allow photo attachment"
            >
              <Camera className="h-4 w-4" />
            </button>
            <button onClick={() => removeCat(c.id)} className="p-1.5 text-slate-300 hover:text-red-500">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 mb-2 flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-600">Pause reasons (optional)</label>
        <button onClick={addReason} className="text-xs font-semibold text-slate-700 hover:underline">
          + Add Reason
        </button>
      </div>
      <div className="space-y-2">
        {section.pauseReasons.map((r) => (
          <div key={r.id} className="flex items-center gap-2">
            <input
              value={r.text}
              onChange={(e) => setReason(r.id, e.target.value)}
              placeholder="e.g., Waiting on materials"
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
            <button onClick={() => removeReason(r.id)} className="p-1.5 text-slate-300 hover:text-red-500">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}