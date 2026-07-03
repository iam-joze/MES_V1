import { useState, useRef } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  AlertTriangle,
  Camera,
  Check,
  X,
  Loader2,
  Package,
  Clock,
  Boxes,
  Sparkles,
  Users,
  Wrench,
} from 'lucide-react';
import type { FaultCategory } from '../types/operatorModule';
import { reportFault, getSharedState } from '../lib/sharedState';

// ============================================================
// O3: Mobile Report Issue Form
// ============================================================
interface IssueLoggerProps {
  faultCategories: FaultCategory[];
  stageName: string;
  stageId: string;
  jobId: string;
  jobName: string;
  productName: string;
  operatorName: string;
  onSubmit: () => void;
  onBack: () => void;
}

export function IssueLogger({
  faultCategories,
  stageName,
  stageId,
  jobId,
  jobName,
  productName,
  operatorName,
  onSubmit,
  onBack,
}: IssueLoggerProps) {
  const [selectedFaultId, setSelectedFaultId] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [photoAttached, setPhotoAttached] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedFault = faultCategories.find((f) => f.id === selectedFaultId) || null;
  const isCritical = selectedFault?.severity === 'critical';

  const handlePhotoAttach = () => {
    setPhotoAttached(true);
  };

  const handleSubmit = () => {
    if (!selectedFaultId || !selectedFault) return;
    setIsSubmitting(true);

    // Get operator phone from shared state
    const state = getSharedState();
    const operatorPhone = state.activeOperatorPhone || '';

    // Push fault to shared state so Manager's dashboard picks it up in real time
    // The fault is automatically routed to the manager who created this job
    reportFault({
      stageId,
      jobId,
      jobName,
      managerId: null,
      managerName: null,
      stageName,
      operatorName,
      operatorPhone,
      faultCategory: selectedFault.faultName,
      severity: selectedFault.severity,
      notes: notes.trim() || '(No additional notes)',
    });

    setTimeout(() => {
      setIsSubmitting(false);
      setNotes('');
      setSelectedFaultId('');
      setPhotoAttached(false);
      onSubmit();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto">
      {/* Back navigation */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-base font-semibold text-navy-700 active:opacity-70 transition-opacity"
        >
          <ArrowLeft size={22} strokeWidth={2.5} />
          Return to Active Process
        </button>
      </header>

      {/* Process context strip */}
      <div className="px-4 py-3 bg-navy-50 border-b border-navy-100">
        <div className="flex items-center gap-2 text-sm text-navy-700">
          <Package size={16} strokeWidth={2.5} />
          <span className="font-semibold">{jobId}</span>
          <span className="text-navy-400">·</span>
          <span>{stageName}</span>
          <span className="text-navy-400">·</span>
          <span className="truncate">{productName}</span>
        </div>
      </div>

      {/* Body */}
      <main className="flex-1 px-4 py-5 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Report Issue</h1>
          <p className="text-base text-slate-500">
            Log a production problem. The process keeps running while you report.
          </p>
        </div>

        {/* Fault Category Dropdown */}
        <div>
          <label className="block text-base font-bold text-slate-800 mb-2">
            Fault Category
          </label>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl border-2 text-left transition-all ${
                isDropdownOpen
                  ? 'border-navy-500 ring-4 ring-navy-500/10'
                  : 'border-slate-200'
              } bg-white`}
            >
              <span
                className={`text-base ${selectedFault ? 'font-semibold text-slate-900' : 'text-slate-400'}`}
              >
                {selectedFault ? selectedFault.faultName : 'Select a fault category...'}
              </span>
              <ChevronDown
                size={24}
                className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                strokeWidth={2.5}
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border-2 border-slate-200 shadow-card-elevated z-20 max-h-64 overflow-y-auto">
                {faultCategories.length === 0 && (
                  <div className="p-4 text-center text-base text-slate-500">
                    No fault categories configured.
                  </div>
                )}
                {faultCategories.map((fault) => (
                  <button
                    key={fault.id}
                    onClick={() => {
                      setSelectedFaultId(fault.id);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 active:bg-slate-100 transition-colors border-b border-slate-100 last:border-0"
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                        fault.severity === 'critical' ? 'bg-danger-100' : 'bg-warning-100'
                      }`}
                    >
                      <AlertTriangle
                        size={18}
                        className={fault.severity === 'critical' ? 'text-danger-600' : 'text-warning-600'}
                        strokeWidth={2.5}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-semibold text-slate-900">{fault.faultName}</p>
                      <p className="text-sm text-slate-500">
                        {fault.severity === 'critical' ? 'Critical severity' : 'Minor severity'}
                        {fault.requiresPhoto && ' · Photo required'}
                      </p>
                    </div>
                    {selectedFaultId === fault.id && (
                      <Check size={20} className="text-navy-600" strokeWidth={2.5} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Severity Banner - revealed upon category selection */}
        {selectedFault && (
          <div
            className={`rounded-2xl p-5 border-2 ${
              isCritical
                ? 'bg-danger-50 border-danger-300'
                : 'bg-warning-50 border-warning-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isCritical ? 'bg-danger-500' : 'bg-warning-500'
                }`}
              >
                <AlertTriangle size={26} className="text-white" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Severity Tier</p>
                <p
                  className={`text-xl font-bold tracking-wide ${
                    isCritical ? 'text-danger-700' : 'text-warning-700'
                  }`}
                >
                  {isCritical ? 'CRITICAL' : 'MINOR'}
                </p>
              </div>
            </div>
            <p className={`text-sm mt-3 ${isCritical ? 'text-danger-600' : 'text-warning-600'}`}>
              {isCritical
                ? 'This issue requires immediate manager attention. Production may need to halt.'
                : 'This issue should be logged and monitored. Production can continue normally.'}
            </p>
          </div>
        )}

        {/* Image Upload Component */}
        <div>
          <label className="block text-base font-bold text-slate-800 mb-2">
            Photo Evidence
            {selectedFault?.requiresPhoto && (
              <span className="text-sm font-semibold text-danger-600 ml-2">Required</span>
            )}
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoAttach}
          />
          <button
            onClick={handlePhotoAttach}
            className={`w-full rounded-2xl border-2 border-dashed transition-all active:scale-[0.99] ${
              photoAttached
                ? 'border-success-300 bg-success-50'
                : 'border-slate-300 bg-slate-50'
            }`}
          >
            {photoAttached ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-16 h-16 rounded-full bg-success-500 flex items-center justify-center mb-3">
                  <Check size={32} className="text-white" strokeWidth={3} />
                </div>
                <p className="text-base font-bold text-success-700">Photo Attached</p>
                <p className="text-sm text-success-600 mt-0.5">Tap to retake</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-navy-100 flex items-center justify-center mb-3">
                  <Camera size={32} className="text-navy-600" strokeWidth={2.5} />
                </div>
                <p className="text-base font-bold text-slate-800">Tap to Attach Photo of Issue</p>
                <p className="text-sm text-slate-500 mt-0.5">Camera roll will open</p>
              </div>
            )}
          </button>
        </div>

        {/* Notes Input */}
        <div>
          <label className="block text-base font-bold text-slate-800 mb-2">
            Additional Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Describe what happened, where it occurred, and any immediate actions taken..."
            className="w-full p-4 rounded-2xl border-2 border-slate-200 text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:border-navy-500 focus:ring-4 focus:ring-navy-500/10 resize-none transition-all"
          />
        </div>
      </main>

      {/* Pinned submit button */}
      <div className="sticky bottom-0 bg-slate-50 px-4 py-4 border-t border-slate-200">
        {isSubmitting ? (
          <div className="w-full py-5 rounded-2xl bg-navy-50 border-2 border-navy-200 flex items-center justify-center gap-3">
            <Loader2 size={26} className="text-navy-600 animate-spin" strokeWidth={2.5} />
            <span className="text-base font-bold text-navy-700">Submitting to Control Dashboard...</span>
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!selectedFaultId}
            className={`w-full py-5 rounded-2xl text-lg font-bold tracking-wide transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
              selectedFaultId
                ? 'bg-navy-900 text-white shadow-lg active:bg-navy-800'
                : 'bg-slate-200 text-slate-400'
            }`}
          >
            Submit Issue to Control Dashboard
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// O4: Interruption Intercept Prompt
// ============================================================
interface InterruptionReason {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const interruptionReasons: InterruptionReason[] = [
  {
    id: 'raw_material_delay',
    label: 'Raw Material Delay',
    icon: <Boxes size={32} strokeWidth={2.5} />,
  },
  {
    id: 'equipment_cleaning',
    label: 'Equipment Cleaning',
    icon: <Sparkles size={32} strokeWidth={2.5} />,
  },
  {
    id: 'shift_handoff_break',
    label: 'Shift Handoff / Break',
    icon: <Users size={32} strokeWidth={2.5} />,
  },
  {
    id: 'minor_machine_clearing',
    label: 'Minor Machine Clearing',
    icon: <Wrench size={32} strokeWidth={2.5} />,
  },
];

interface InterruptionInterceptProps {
  isOpen: boolean;
  onSelectReason: (reasonId: string) => void;
  onCancel: () => void;
}

export function InterruptionIntercept({
  isOpen,
  onSelectReason,
  onCancel,
}: InterruptionInterceptProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [isLogging, setIsLogging] = useState(false);

  if (!isOpen) return null;

  const handleSelect = (reasonId: string) => {
    setSelectedReason(reasonId);
    setIsLogging(true);
    setTimeout(() => {
      onSelectReason(reasonId);
      setSelectedReason(null);
      setIsLogging(false);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center max-w-md mx-auto">
      {/* Backdrop - blocks all interaction */}
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" />

      {/* Intercept card */}
      <div className="relative w-full m-4 bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="w-16 h-16 rounded-full bg-warning-100 flex items-center justify-center mx-auto mb-4">
            <Clock size={32} className="text-warning-600" strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Specify Interruption Reason</h2>
          <p className="text-base text-slate-500 mt-1.5">
            Select the reason for pausing this process. This will be logged to the control dashboard.
          </p>
        </div>

        {/* Reason grid */}
        <div className="px-6 pb-4">
          {isLogging ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 size={36} className="text-warning-500 animate-spin mb-4" strokeWidth={2.5} />
              <p className="text-base font-bold text-slate-700">Logging pause reason...</p>
              <p className="text-sm text-slate-500 mt-1">
                {interruptionReasons.find((r) => r.id === selectedReason)?.label}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {interruptionReasons.map((reason) => (
                <button
                  key={reason.id}
                  onClick={() => handleSelect(reason.id)}
                  className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 border-slate-200 bg-slate-50 active:scale-[0.97] active:bg-navy-50 active:border-navy-300 transition-all"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-navy-600 shadow-sm">
                    {reason.icon}
                  </div>
                  <span className="text-base font-bold text-slate-800 text-center leading-tight">
                    {reason.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cancel */}
        {!isLogging && (
          <div className="px-6 pb-6 pt-2">
            <button
              onClick={onCancel}
              className="w-full py-3.5 rounded-xl bg-slate-100 active:bg-slate-200 text-slate-700 text-base font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <X size={20} strokeWidth={2.5} />
              Cancel — Resume Process
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
