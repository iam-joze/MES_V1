import { useState, useEffect, useRef } from 'react';
import {
  AlertOctagon,
  X,
  Factory,
  Target,
  ChevronDown,
  Unlock,
  HandMetal,
} from 'lucide-react';

type StopScope = 'facility_wide' | 'specific_job';

interface EmergencyStopOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (scope: StopScope, reason: string, notes: string) => void;
}

export function EmergencyStopOverlay({
  isOpen,
  onClose,
  onConfirm,
}: EmergencyStopOverlayProps) {
  const [scope, setScope] = useState<StopScope>('facility_wide');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef<number | null>(null);
  const progressRef = useRef<number | null>(null);

  const reasons = [
    'Equipment Malfunction',
    'Safety Hazard Detected',
    'Quality Control Failure',
    'Material Contamination',
    'Fire/Smoke Detected',
    'Personnel Injury',
    'Environmental Spill',
    'Utility Failure',
    'Other - Specify in Notes',
  ];

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, []);

  const startHold = () => {
    setIsHolding(true);
    setHoldProgress(0);

    progressRef.current = window.setInterval(() => {
      setHoldProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressRef.current!);
          return 100;
        }
        return prev + 2;
      });
    }, 30);
  };

  const endHold = () => {
    setIsHolding(false);
    if (progressRef.current) clearInterval(progressRef.current);
    if (holdProgress >= 100) {
      executeEmergencyStop();
    } else {
      setHoldProgress(0);
    }
  };

  const executeEmergencyStop = () => {
    if (!reason) {
      alert('Please select a reason for the emergency stop.');
      return;
    }
    onConfirm(scope, reason, notes);
    setScope('facility_wide');
    setReason('');
    setNotes('');
    setHoldProgress(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Red pulsing backdrop */}
      <div className="absolute inset-0 bg-danger-900/80 backdrop-blur-sm animate-pulse" />

      {/* Glowing red border container */}
      <div className="absolute inset-4 border-4 border-danger-500 rounded-xl shadow-[0_0_60px_rgba(239,68,68,0.5)] pointer-events-none" />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-danger-950 rounded-card shadow-2xl overflow-hidden border-2 border-danger-600">
        {/* Header */}
        <div className="px-6 py-5 bg-danger-900 border-b border-danger-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <AlertOctagon size={32} className="text-danger-400 animate-pulse" />
              <div>
                <h2 className="text-xl font-bold text-white uppercase tracking-wide">
                  Emergency Stop Activation
                </h2>
                <p className="text-danger-300 text-sm mt-0.5">
                  Confirm production halt parameters
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-danger-400 hover:text-white hover:bg-danger-800 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Scope Selection */}
          <div>
            <label className="block text-sm font-semibold text-danger-200 uppercase tracking-wide mb-3">
              Stop Scope <span className="text-danger-400">*</span>
            </label>
            <div className="space-y-2">
              <label className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                scope === 'facility_wide'
                  ? 'border-danger-500 bg-danger-900/50'
                  : 'border-danger-800/50 hover:border-danger-700'
              }`}>
                <input
                  type="radio"
                  name="scope"
                  checked={scope === 'facility_wide'}
                  onChange={() => setScope('facility_wide')}
                  className="w-4 h-4 text-danger-600 border-danger-400 focus:ring-danger-500 bg-danger-900"
                />
                <Factory size={20} className="text-danger-400" />
                <div className="flex-1">
                  <span className="font-semibold text-white">Halt Facility-Wide Production</span>
                  <p className="text-xs text-danger-400 mt-0.5">All lines, all active jobs, immediate shutdown</p>
                </div>
              </label>

              <label className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                scope === 'specific_job'
                  ? 'border-warning-500 bg-warning-900/30'
                  : 'border-danger-800/50 hover:border-warning-700'
              }`}>
                <input
                  type="radio"
                  name="scope"
                  checked={scope === 'specific_job'}
                  onChange={() => setScope('specific_job')}
                  className="w-4 h-4 text-warning-600 border-warning-400 focus:ring-warning-500 bg-warning-900"
                />
                <Target size={20} className="text-warning-400" />
                <div className="flex-1">
                  <span className="font-semibold text-white">Halt Specific Active Job Run Only</span>
                  <p className="text-xs text-warning-400 mt-0.5">Stop designated production job, others continue</p>
                </div>
              </label>
            </div>
          </div>

          {/* Reason Dropdown */}
          <div>
            <label className="block text-sm font-semibold text-danger-200 uppercase tracking-wide mb-2">
              Reason for Stop <span className="text-danger-400">*</span>
            </label>
            <div className="relative">
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-3 bg-danger-900 border-2 border-danger-700 rounded-lg text-white appearance-none cursor-pointer focus:outline-none focus:border-danger-500 focus:ring-2 focus:ring-danger-500/30"
              >
                <option value="" className="bg-danger-900">Select reason...</option>
                {reasons.map(r => (
                  <option key={r} value={r} className="bg-danger-900">{r}</option>
                ))}
              </select>
              <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-danger-400 pointer-events-none" />
            </div>
          </div>

          {/* Confirmation Notes */}
          <div>
            <label className="block text-sm font-semibold text-danger-200 uppercase tracking-wide mb-2">
              Additional Details
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe the situation and any immediate actions taken..."
              className="w-full h-20 px-4 py-3 bg-danger-900 border-2 border-danger-700 rounded-lg text-white placeholder-danger-500 focus:outline-none focus:border-danger-500 focus:ring-2 focus:ring-danger-500/30 resize-none"
            />
          </div>

          {/* Hold-to-Confirm Button */}
          <div className="pt-2">
            <button
              onMouseDown={startHold}
              onMouseUp={endHold}
              onMouseLeave={endHold}
              onTouchStart={startHold}
              onTouchEnd={endHold}
              disabled={!reason}
              className={`w-full relative overflow-hidden py-4 rounded-lg font-bold text-lg uppercase tracking-wider transition-all ${
                !reason
                  ? 'bg-danger-800/50 text-danger-500 cursor-not-allowed'
                  : isHolding
                    ? 'bg-danger-600 text-white'
                    : 'bg-danger-700 hover:bg-danger-600 text-white'
              }`}
            >
              {/* Progress fill */}
              <div
                className="absolute inset-0 bg-danger-500 transition-all duration-75"
                style={{ width: `${holdProgress}%` }}
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              {/* Content */}
              <div className="relative flex items-center justify-center gap-3">
                <HandMetal size={24} className={isHolding ? 'animate-pulse' : ''} />
                <span>
                  {holdProgress >= 100 ? 'Confirmed - Executing...' :
                    isHolding ? 'Continue Holding...' :
                    'Hold to Confirm Emergency Stop'}
                </span>
              </div>
            </button>
            <p className="text-center text-danger-400 text-xs mt-2">
              Hold button for 1.5 seconds to confirm activation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Global Emergency Status Banner (shown after halt is activated)
interface EmergencyStatusBannerProps {
  scope: StopScope;
  reason: string;
  onAuthorizeResumption: () => void;
}

export function EmergencyStatusBanner({
  scope,
  reason,
  onAuthorizeResumption,
}: EmergencyStatusBannerProps) {
  const [flash, setFlash] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFlash(prev => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`fixed top-16 left-0 right-0 z-[90] transition-colors duration-500 ${
      flash ? 'bg-danger-700' : 'bg-danger-900'
    } shadow-lg`}>
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertOctagon size={24} className={`animate-pulse ${flash ? 'text-danger-200' : 'text-white'}`} />
          <div>
            <p className={`font-bold uppercase tracking-wide ${flash ? 'text-danger-100' : 'text-white'}`}>
              {scope === 'facility_wide' ? 'GLOBAL' : 'PARTIAL'} EMERGENCY HALT ACTIVE
            </p>
            <p className={`text-sm ${flash ? 'text-danger-200' : 'text-danger-300'}`}>
              All process lines paused by Manager • Reason: {reason}
            </p>
          </div>
        </div>
        <button
          onClick={onAuthorizeResumption}
          className="flex items-center gap-2 px-5 py-2.5 bg-white text-danger-700 font-semibold rounded-lg hover:bg-danger-50 transition-colors shadow-md"
        >
          <Unlock size={18} />
          <span>Authorize Workflow Resumption</span>
        </button>
      </div>
    </div>
  );
}

export function EmergencyStopFlow({
  isOpen,
  onClose,
  onActivate,
}: {
  isOpen: boolean;
  onClose: () => void;
  onActivate: (scope: StopScope, reason: string, notes: string, isActive: boolean) => void;
}) {
  const [isActive, setIsActive] = useState(false);
  const [activeScope, setActiveScope] = useState<StopScope>('facility_wide');
  const [activeReason, setActiveReason] = useState('');

  const handleConfirm = (scope: StopScope, reason: string, notes: string) => {
    setActiveScope(scope);
    setActiveReason(reason);
    setIsActive(true);
    onActivate(scope, reason, notes, true);
    onClose();
  };

  const handleResume = () => {
    const confirmed = window.confirm(
      'AUTHORIZE WORKFLOW RESUMPTION\n\nThis will lift the emergency halt and allow production to continue.\n\nEnsure all safety issues have been resolved before proceeding.\n\nConfirm resumption?'
    );
    if (confirmed) {
      setIsActive(false);
      onActivate(activeScope, activeReason, '', false);
    }
  };

  return (
    <>
      <EmergencyStopOverlay
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={handleConfirm}
      />

      {isActive && (
        <EmergencyStatusBanner
          scope={activeScope}
          reason={activeReason}
          onAuthorizeResumption={handleResume}
        />
      )}
    </>
  );
}
