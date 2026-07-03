import { useState, useEffect } from 'react';
import {
  X,
  ChevronDown,
  ChevronUp,
  ToggleLeft,
  ToggleRight,
  Image as ImageIcon,
  Plus,
  Trash2,
  GripVertical,
  Info,
  Clock,
  MapPin,
  FileText,
  CheckSquare,
  BarChart3,
  ClipboardCheck,
  AlertTriangle,
  Save,
  Camera,
} from 'lucide-react';
import type {
  BlueprintFormData,
  BlueprintCategory,
  ChecklistValidationTiming,
  QuantityInputFrequency,
  QCResponseType,
  FaultSeverity,
} from '../types';

interface TogglePanelProps {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  children: React.ReactNode;
}

function TogglePanel({ title, description, icon, enabled, onToggle, children }: TogglePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (enabled) {
      setIsExpanded(true);
    } else {
      setIsExpanded(false);
    }
  }, [enabled]);

  return (
    <div className={`card overflow-hidden transition-all duration-300 ${enabled ? 'ring-2 ring-navy-500/20' : ''}`}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-slate-50/50">
        <button
          onClick={() => onToggle(!enabled)}
          className="flex-shrink-0"
        >
          {enabled ? (
            <ToggleRight size={22} className="text-navy-600" />
          ) : (
            <ToggleLeft size={22} className="text-slate-300" />
          )}
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            enabled ? 'bg-navy-100 text-navy-700' : 'bg-slate-100 text-slate-400'
          }`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold ${enabled ? 'text-slate-900' : 'text-slate-500'}`}>{title}</h3>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
        </div>
        {enabled && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        )}
      </div>

      {/* Expandable Content */}
      {enabled && isExpanded && (
        <div className="p-4 border-t border-slate-200 bg-white animate-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}

// Panel A: Guidelines
interface GuidelinesPanelProps {
  content: string;
  onChange: (content: string) => void;
}

function GuidelinesPanel({ content, onChange }: GuidelinesPanelProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Operator Instructions
        </label>
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter detailed guidelines for operators..."
          className="w-full h-40 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 resize-none"
        />
      </div>

      {/* Mock image attachments */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Reference Images
        </label>
        <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 bg-slate-50/50 text-center">
          <ImageIcon size={32} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm text-slate-500">Drag & drop images or click to upload</p>
          <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 5MB each</p>
        </div>
      </div>
    </div>
  );
}

// Panel B: Operator Checklist
interface ChecklistPanelProps {
  validationTiming: ChecklistValidationTiming;
  items: Array<{ itemText: string; isRequired: boolean }>;
  onTimingChange: (timing: ChecklistValidationTiming) => void;
  onItemsChange: (items: Array<{ itemText: string; isRequired: boolean }>) => void;
}

function ChecklistPanel({ validationTiming, items, onTimingChange, onItemsChange }: ChecklistPanelProps) {
  const addItem = () => {
    onItemsChange([...items, { itemText: '', isRequired: true }]);
  };

  const updateItem = (index: number, updates: Partial<{ itemText: string; isRequired: boolean }>) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updates };
    onItemsChange(newItems);
  };

  const removeItem = (index: number) => {
    onItemsChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Validation Timing
        </label>
        <div className="flex gap-2">
          {[
            { key: 'before_start' as const, label: 'Before Start' },
            { key: 'before_completion' as const, label: 'Before Completion' },
            { key: 'both' as const, label: 'Both Stages' },
          ].map(opt => (
            <button
              key={opt.key}
              onClick={() => onTimingChange(opt.key)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                validationTiming === opt.key
                  ? 'bg-navy-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-slate-700">Checklist Items</label>
          <button
            onClick={addItem}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-navy-700 hover:bg-navy-100 rounded transition-colors"
          >
            <Plus size={14} />
            <span>Add Item</span>
          </button>
        </div>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg group">
              <GripVertical size={16} className="text-slate-400 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
              <input
                type="text"
                value={item.itemText}
                onChange={(e) => updateItem(index, { itemText: e.target.value })}
                placeholder="Enter checklist item..."
                className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20"
              />
              <button
                onClick={() => removeItem(index)}
                className="p-1 text-slate-400 hover:text-danger-600 hover:bg-danger-50 rounded transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-slate-400 italic py-4 text-center">No checklist items added yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Panel C: Quantity Logging (Multi-Metric)
// State shape: a flat array of { id, label, unit } rows for simplicity.
// Mapped to full BlueprintFormData.quantityMetrics shape at save time.
interface QuantityMetricRow {
  id: number;
  label: string;
  unit: string;
}

const UNIT_OPTIONS = ['kg', 'g', 't', 'L', 'mL', 'Units', 'Boxes', 'Cartons', 'Bags', 'Pcs'];

function QuantityPanel({
  metrics,
  onMetricsChange,
}: {
  metrics: QuantityMetricRow[];
  onMetricsChange: (metrics: QuantityMetricRow[]) => void;
}) {
  const addMetric = () => {
    onMetricsChange([...metrics, { id: Date.now(), label: '', unit: 'kg' }]);
  };

  const update = (id: number, field: 'label' | 'unit', value: string) => {
    onMetricsChange(metrics.map(m => (m.id === id ? { ...m, [field]: value } : m)));
  };

  const remove = (id: number) => {
    onMetricsChange(metrics.filter(m => m.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Metric rows */}
      <div className="space-y-3">
        {metrics.map((metric, index) => (
          <div key={metric.id} className="flex items-end gap-3">
            {/* Slot number */}
            <div className="mb-2.5 w-6 h-6 rounded-full bg-navy-100 text-navy-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
              {index + 1}
            </div>

            {/* Metric Label — wide */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Metric Label</label>
              <input
                type="text"
                value={metric.label}
                onChange={(e) => update(metric.id, 'label', e.target.value)}
                placeholder="e.g., Raw Fruit Weight Input"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500"
              />
            </div>

            {/* Unit of Measure — narrow dropdown */}
            <div className="w-28">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Unit of Measure</label>
              <select
                value={metric.unit}
                onChange={(e) => update(metric.id, 'unit', e.target.value)}
                className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500"
              >
                {UNIT_OPTIONS.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            {/* Remove button — disabled when only one row remains */}
            <button
              onClick={() => remove(metric.id)}
              disabled={metrics.length === 1}
              title={metrics.length === 1 ? 'At least one metric is required' : 'Remove metric'}
              className={`mb-0.5 p-2 rounded-lg transition-colors ${
                metrics.length === 1
                  ? 'text-slate-200 cursor-not-allowed'
                  : 'text-slate-400 hover:text-danger-600 hover:bg-danger-50'
              }`}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Add Another Quantity Metric — distinct bottom action */}
      <button
        onClick={addMetric}
        className="w-full py-3 border-2 border-dashed border-navy-200 text-navy-600 text-sm font-semibold rounded-xl hover:bg-navy-50 hover:border-navy-400 transition-all flex items-center justify-center gap-2 group"
      >
        <Plus size={15} className="group-hover:scale-110 transition-transform" />
        + Add Another Quantity Metric
      </button>

      {/* Helper preview card */}
      <div className="p-4 bg-slate-100 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <Info size={13} className="text-slate-500 flex-shrink-0" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide leading-none">
            Example: Pineapple Pulping Run Configuration
          </p>
        </div>
        <div className="space-y-2">
          {[
            { n: 1, name: 'Raw Fruit Weight Input', unit: 'kg' },
            { n: 2, name: 'Pure Extracted Pulp Yield', unit: 'L' },
            { n: 3, name: 'Fibrous Scrap Material', unit: 'kg' },
          ].map(ex => (
            <div key={ex.n} className="flex items-center gap-2.5 text-sm">
              <span className="w-5 h-5 rounded-full bg-slate-300 text-slate-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                {ex.n}
              </span>
              <span className="text-slate-600 flex-1">{ex.name}</span>
              <span className="font-semibold text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200 text-xs">
                {ex.unit}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Panel D: Quality Control Form Builder
interface QCFormPanelProps {
  questions: Array<{
    questionText: string;
    responseType: QCResponseType;
    numericMinValue: number | null;
    numericMaxValue: number | null;
    numericTolerance: number | null;
    isRequired: boolean;
  }>;
  onQuestionsChange: (questions: QCFormPanelProps['questions']) => void;
}

function QCFormPanel({ questions, onQuestionsChange }: QCFormPanelProps) {
  const addQuestion = () => {
    onQuestionsChange([
      ...questions,
      { questionText: '', responseType: 'pass_fail', numericMinValue: null, numericMaxValue: null, numericTolerance: null, isRequired: true },
    ]);
  };

  const updateQuestion = (index: number, updates: Partial<QCFormPanelProps['questions'][0]>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    onQuestionsChange(newQuestions);
  };

  const removeQuestion = (index: number) => {
    onQuestionsChange(questions.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Add quality inspection checkpoints</p>
        <button
          onClick={addQuestion}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-navy-700 hover:bg-navy-100 rounded transition-colors"
        >
          <Plus size={14} />
          <span>Add Question</span>
        </button>
      </div>

      <div className="space-y-3">
        {questions.map((q, index) => (
          <div key={index} className="p-4 bg-slate-50 rounded-lg space-y-3 group">
            <div className="flex items-start gap-2">
              <GripVertical size={16} className="text-slate-400 mt-3 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex-1">
                <input
                  type="text"
                  value={q.questionText}
                  onChange={(e) => updateQuestion(index, { questionText: e.target.value })}
                  placeholder="Enter inspection question..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                />
              </div>
              <button
                onClick={() => removeQuestion(index)}
                className="p-1.5 text-slate-400 hover:text-danger-600 hover:bg-danger-50 rounded transition-colors mt-1"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="flex items-center gap-3 pl-6">
              <select
                value={q.responseType}
                onChange={(e) => updateQuestion(index, { responseType: e.target.value as QCResponseType })}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20"
              >
                <option value="pass_fail">Pass/Fail</option>
                <option value="numeric">Numeric Measurement</option>
                <option value="free_text">Free Text</option>
              </select>

              {q.responseType === 'numeric' && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={q.numericMinValue ?? ''}
                    onChange={(e) => updateQuestion(index, { numericMinValue: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="Min"
                    className="w-20 px-2 py-1 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                  />
                  <span className="text-slate-400">-</span>
                  <input
                    type="number"
                    value={q.numericMaxValue ?? ''}
                    onChange={(e) => updateQuestion(index, { numericMaxValue: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="Max"
                    className="w-20 px-2 py-1 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                  />
                  <input
                    type="number"
                    value={q.numericTolerance ?? ''}
                    onChange={(e) => updateQuestion(index, { numericTolerance: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="±Tolerance"
                    className="w-24 px-2 py-1 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                  />
                </div>
              )}

              <label className="flex items-center gap-1.5 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={q.isRequired}
                  onChange={(e) => updateQuestion(index, { isRequired: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-navy-600 focus:ring-navy-500"
                />
                <span>Required</span>
              </label>
            </div>
          </div>
        ))}

        {questions.length === 0 && (
          <p className="text-sm text-slate-400 italic py-4 text-center">No QC questions defined</p>
        )}
      </div>
    </div>
  );
}

// Panel E: Fault Categories
interface FaultsPanelProps {
  categories: Array<{
    faultName: string;
    severity: FaultSeverity;
    requiresPhoto: boolean;
  }>;
  onCategoriesChange: (categories: FaultsPanelProps['categories']) => void;
}

function FaultsPanel({ categories, onCategoriesChange }: FaultsPanelProps) {
  const addCategory = () => {
    onCategoriesChange([...categories, { faultName: '', severity: 'minor', requiresPhoto: false }]);
  };

  const updateCategory = (index: number, updates: Partial<FaultsPanelProps['categories'][0]>) => {
    const newCategories = [...categories];
    newCategories[index] = { ...newCategories[index], ...updates };
    onCategoriesChange(newCategories);
  };

  const removeCategory = (index: number) => {
    onCategoriesChange(categories.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Define fault reasons for this stage</p>
        <button
          onClick={addCategory}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-navy-700 hover:bg-navy-100 rounded transition-colors"
        >
          <Plus size={14} />
          <span>Add Fault</span>
        </button>
      </div>

      <div className="space-y-2">
        {categories.map((cat, index) => (
          <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg group">
            <GripVertical size={16} className="text-slate-400 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
            <input
              type="text"
              value={cat.faultName}
              onChange={(e) => updateCategory(index, { faultName: e.target.value })}
              placeholder="e.g., Cap Feed Jam"
              className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20"
            />
            <select
              value={cat.severity}
              onChange={(e) => updateCategory(index, { severity: e.target.value as FaultSeverity })}
              className={`px-3 py-2 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-navy-500/20 ${
                cat.severity === 'critical'
                  ? 'bg-danger-50 border-danger-200 text-danger-700'
                  : 'bg-warning-50 border-warning-200 text-warning-700'
              }`}
            >
              <option value="minor">Minor</option>
              <option value="critical">Critical</option>
            </select>
            <button
              onClick={() => updateCategory(index, { requiresPhoto: !cat.requiresPhoto })}
              className={`p-2 rounded-lg transition-colors ${
                cat.requiresPhoto
                  ? 'bg-navy-100 text-navy-700'
                  : 'bg-slate-100 text-slate-400 hover:text-slate-600'
              }`}
              title={cat.requiresPhoto ? 'Photo required' : 'Photo optional'}
            >
              <Camera size={18} />
            </button>
            <button
              onClick={() => removeCategory(index)}
              className="p-2 text-slate-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        {categories.length === 0 && (
          <p className="text-sm text-slate-400 italic py-4 text-center">No fault categories defined</p>
        )}
      </div>
    </div>
  );
}

interface BlueprintBuilderProps {
  isOpen: boolean;
  editingId: string | null;
  onClose: () => void;
  onSave: (data: BlueprintFormData) => void;
  saving?: boolean;
}

export function BlueprintBuilder({ isOpen, editingId, onClose, onSave, saving = false }: BlueprintBuilderProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<BlueprintCategory>('preparation');
  const [stationTag, setStationTag] = useState('');
  const [duration, setDuration] = useState(30);

  // Feature toggles
  const [guidelinesEnabled, setGuidelinesEnabled] = useState(false);
  const [checklistEnabled, setChecklistEnabled] = useState(false);
  const [quantityLoggingEnabled, setQuantityLoggingEnabled] = useState(false);
  const [qcFormEnabled, setQcFormEnabled] = useState(false);
  const [faultCategoriesEnabled, setFaultCategoriesEnabled] = useState(false);

  // Feature configs
  const [guidelinesContent, setGuidelinesContent] = useState('');
  const [checklistValidationTiming, setChecklistValidationTiming] = useState<ChecklistValidationTiming>('before_start');
  const [checklistItems, setChecklistItems] = useState<Array<{ itemText: string; isRequired: boolean }>>([]);
  const [quantityMetrics, setQuantityMetrics] = useState<QuantityMetricRow[]>([
    { id: Date.now(), label: '', unit: 'kg' },
  ]);
  const [qcQuestions, setQcQuestions] = useState<QCFormPanelProps['questions']>([]);
  const [faultCategories, setFaultCategories] = useState<FaultsPanelProps['categories']>([]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setCategory('preparation');
    setStationTag('');
    setDuration(30);
    setGuidelinesEnabled(false);
    setChecklistEnabled(false);
    setQuantityLoggingEnabled(false);
    setQcFormEnabled(false);
    setFaultCategoriesEnabled(false);
    setGuidelinesContent('');
    setChecklistValidationTiming('before_start');
    setChecklistItems([]);
    setQuantityMetrics([{ id: Date.now(), label: '', unit: 'kg' }]);
    setQcQuestions([]);
    setFaultCategories([]);
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter a blueprint name');
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim(),
      category,
      stationTag: stationTag.trim(),
      estimatedDurationMinutes: duration,
      guidelinesEnabled,
      checklistEnabled,
      quantityLoggingEnabled,
      qcFormEnabled,
      faultCategoriesEnabled,
      guidelinesContent: guidelinesContent.trim(),
      checklistValidationTiming,
      checklistItems,
      quantityMetrics: quantityMetrics.map(m => ({
        metricName: m.label,
        unitLabel: m.unit,
        minValue: null,
        maxValue: null,
        inputFrequency: 'per_batch' as QuantityInputFrequency,
      })),
      qcQuestions,
      faultCategories,
    });

    resetForm();
    onClose();
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-navy-900/50 backdrop-blur-sm"
        onClick={handleCancel}
      />

      {/* Drawer */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {editingId ? 'Edit Blueprint' : 'Create Blueprint'}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">Configure stage template settings</p>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-6">
          {/* Basic Info Section */}
          <div className="card p-4 space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Info size={16} className="text-navy-500" />
              Basic Information
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Process Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Mixing Tank Sterilization"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this process stage..."
                  className="w-full h-20 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as BlueprintCategory)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500"
                  >
                    <option value="preparation">Preparation</option>
                    <option value="processing">Processing</option>
                    <option value="packaging">Packaging</option>
                    <option value="quality_control">Quality Control</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    <MapPin size={14} className="inline mr-1" />
                    Station Tag
                  </label>
                  <input
                    type="text"
                    value={stationTag}
                    onChange={(e) => setStationTag(e.target.value)}
                    placeholder="e.g., Station A"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    <Clock size={14} className="inline mr-1" />
                    Duration (min)
                  </label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                    min={0}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Feature Panels */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">Feature Configuration</h3>
            <p className="text-sm text-slate-500">Toggle features to enable and configure additional process controls</p>

            <TogglePanel
              id="guidelines"
              title="Guidelines"
              description="Operator instructions and reference materials"
              icon={<FileText size={18} />}
              enabled={guidelinesEnabled}
              onToggle={setGuidelinesEnabled}
            >
              <GuidelinesPanel content={guidelinesContent} onChange={setGuidelinesContent} />
            </TogglePanel>

            <TogglePanel
              id="checklist"
              title="Operator Checklist"
              description="Pre-task verification items"
              icon={<CheckSquare size={18} />}
              enabled={checklistEnabled}
              onToggle={setChecklistEnabled}
            >
              <ChecklistPanel
                validationTiming={checklistValidationTiming}
                items={checklistItems}
                onTimingChange={setChecklistValidationTiming}
                onItemsChange={setChecklistItems}
              />
            </TogglePanel>

            <TogglePanel
              id="quantity"
              title="Quantity Logging"
              description="Track material quantities and flow"
              icon={<BarChart3 size={18} />}
              enabled={quantityLoggingEnabled}
              onToggle={setQuantityLoggingEnabled}
            >
              <QuantityPanel metrics={quantityMetrics} onMetricsChange={setQuantityMetrics} />
            </TogglePanel>

            <TogglePanel
              id="qc"
              title="Quality Control Form"
              description="Inspection checkpoints and measurements"
              icon={<ClipboardCheck size={18} />}
              enabled={qcFormEnabled}
              onToggle={setQcFormEnabled}
            >
              <QCFormPanel questions={qcQuestions} onQuestionsChange={setQcQuestions} />
            </TogglePanel>

            <TogglePanel
              id="faults"
              title="Fault Categories"
              description="Predefined fault reporting options"
              icon={<AlertTriangle size={18} />}
              enabled={faultCategoriesEnabled}
              onToggle={setFaultCategoriesEnabled}
            >
              <FaultsPanel categories={faultCategories} onCategoriesChange={setFaultCategories} />
            </TogglePanel>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 bg-slate-50/80 backdrop-blur-sm shadow-[0_-4px_6px_-1px_rgb(0_0_0_/_0.1)]">
          <button
            onClick={handleCancel}
            className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-navy-900 hover:bg-navy-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all"
          >
            <Save size={16} className={saving ? 'animate-pulse' : ''} />
            <span>{saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Blueprint'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
