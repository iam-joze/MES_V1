import { useState } from 'react';
import {
  X,
  AlertTriangle,
  AlertCircle,
  Clock,
  User,
  Wrench,
  Camera,
  FileText,
  PauseCircle,
  Octagon,
  CheckCircle2,
} from 'lucide-react';
import type { Alert } from '../types';

type ResolutionChoice = 'dismiss_log' | 'pause_process' | 'emergency_stop';

interface FaultResolutionModalProps {
  alert: Alert | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (resolution: {
    alertId: string;
    choice: ResolutionChoice;
    notes: string;
  }) => void;
}

export function FaultResolutionModal({
  alert,
  isOpen,
  onClose,
  onSubmit,
}: FaultResolutionModalProps) {
  const [resolutionChoice, setResolutionChoice] = useState<ResolutionChoice | null>(null);
  const [notes, setNotes] = useState('');

  if (!isOpen || !alert) return null;

  const handleSubmit = () => {
    if (!resolutionChoice) {
      window.alert('Please select a resolution action.');
      return;
    }

    onSubmit({
      alertId: alert.id,
      choice: resolutionChoice,
      notes: notes.trim(),
    });

    setResolutionChoice(null);
    setNotes('');
    onClose();
  };

  const isCritical = alert.severity === 'critical';
  const mockOperatorName = 'Wasswa Job'; // In real app, this would come from alert data
  const hasPhoto = alert.type === 'fault' && Math.random() > 0.5; // Mock photo presence

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-navy-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-card shadow-card-elevated overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className={`px-6 py-4 border-b ${isCritical ? 'bg-danger-50 border-danger-200' : 'bg-warning-50 border-warning-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isCritical ? (
                <AlertCircle size={24} className="text-danger-600" />
              ) : (
                <AlertTriangle size={24} className="text-warning-600" />
              )}
              <div>
                <h2 className="font-bold text-slate-900">Fault Resolution</h2>
                <span className={`status-badge mt-1 ${
                  isCritical ? 'status-badge-danger' : 'status-badge-warning'
                }`}>
                  {alert.severity?.toUpperCase()}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Fault Context */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-slate-900">{alert.title}</h3>
            <p className="text-sm text-slate-600">{alert.description}</p>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-slate-500">
                <Wrench size={14} />
                <span>{alert.line || 'Production Line 1'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <User size={14} />
                <span>Flagged by: {mockOperatorName}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 col-span-2">
                <Clock size={14} />
                <span>{new Date(alert.timestamp).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Photo Attachment Placeholder */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Camera size={14} className="inline mr-1" />
              Photo Attachment
            </label>
            {hasPhoto ? (
              <div className="aspect-video bg-slate-200 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300">
                <div className="text-center text-slate-500">
                  <Camera size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Photo captured at fault time</p>
                  <p className="text-xs text-slate-400 mt-1">IMG_{Date.now()}.jpg</p>
                </div>
              </div>
            ) : (
              <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-slate-400">
                  <Camera size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No photo captured</p>
                </div>
              </div>
            )}
          </div>

          {/* Resolution Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Resolution Action <span className="text-danger-500">*</span>
            </label>
            <div className="space-y-2">
              {/* Option 1: Dismiss & Log */}
              <label className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                resolutionChoice === 'dismiss_log'
                  ? 'border-navy-500 bg-navy-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}>
                <input
                  type="radio"
                  name="resolution"
                  checked={resolutionChoice === 'dismiss_log'}
                  onChange={() => setResolutionChoice('dismiss_log')}
                  className="mt-0.5 w-4 h-4 text-navy-600 border-slate-300 focus:ring-navy-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-slate-500" />
                    <span className="font-medium text-slate-900">Dismiss & Log Alert</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Record the alert in the fault log without interrupting production.</p>
                </div>
              </label>

              {/* Option 2: Pause Process Step */}
              <label className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                resolutionChoice === 'pause_process'
                  ? 'border-warning-500 bg-warning-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}>
                <input
                  type="radio"
                  name="resolution"
                  checked={resolutionChoice === 'pause_process'}
                  onChange={() => setResolutionChoice('pause_process')}
                  className="mt-0.5 w-4 h-4 text-warning-600 border-slate-300 focus:ring-warning-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <PauseCircle size={16} className="text-warning-600" />
                    <span className="font-medium text-slate-900">Pause Affected Process Step</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Temporarily halt the specific stage while investigation continues.</p>
                </div>
              </label>

              {/* Option 3: Emergency Stop */}
              <label className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                resolutionChoice === 'emergency_stop'
                  ? 'border-danger-500 bg-danger-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}>
                <input
                  type="radio"
                  name="resolution"
                  checked={resolutionChoice === 'emergency_stop'}
                  onChange={() => setResolutionChoice('emergency_stop')}
                  className="mt-0.5 w-4 h-4 text-danger-600 border-slate-300 focus:ring-danger-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Octagon size={16} className="text-danger-600" />
                    <span className="font-medium text-danger-700">Trigger Global Emergency Stop</span>
                  </div>
                  <p className="text-xs text-danger-600 mt-1">Halt all production lines immediately. Supervisors will be notified.</p>
                </div>
              </label>
            </div>
          </div>

          {/* Action Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Action Taken Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Document the resolution and any follow-up actions taken..."
              className="w-full h-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!resolutionChoice}
            className={`flex items-center justify-center gap-2 flex-1 px-4 py-2.5 font-medium rounded-lg transition-colors ${
              resolutionChoice === 'emergency_stop'
                ? 'bg-danger-600 hover:bg-danger-700 text-white'
                : 'bg-navy-900 hover:bg-navy-800 text-white disabled:opacity-50'
            }`}
          >
            <CheckCircle2 size={16} />
            <span>Submit Resolution</span>
          </button>
        </div>
      </div>
    </div>
  );
}
