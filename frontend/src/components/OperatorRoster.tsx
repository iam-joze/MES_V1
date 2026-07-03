import { useState } from 'react';
import {
  Users,
  User,
  X,
  ArrowRight,
  Circle,
  Coffee,
  CheckCircle2,
} from 'lucide-react';
import type { Operator } from '../types';

interface OperatorCardProps {
  operator: Operator;
  onReassign: (id: string) => void;
}

function OperatorCard({ operator, onReassign }: OperatorCardProps) {
  const statusConfig = {
    active: { dot: 'bg-success-500', label: 'Active', icon: <CheckCircle2 size={12} className="text-success-500" /> },
    'on-break': { dot: 'bg-warning-500', label: 'On Break', icon: <Coffee size={12} className="text-warning-500" /> },
    offline: { dot: 'bg-slate-400', label: 'Offline', icon: <Circle size={12} className="text-slate-400" /> },
  };

  const status = statusConfig[operator.status];

  return (
    <div className="card card-hover p-3 flex items-center gap-3">
      {/* Avatar */}
      <div className="relative">
        <div className="w-10 h-10 bg-gradient-to-br from-navy-500 to-navy-700 rounded-full flex items-center justify-center">
          {operator.avatar ? (
            <img src={operator.avatar} alt={operator.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            <User size={18} className="text-white" />
          )}
        </div>
        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${status.dot}`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-slate-900 truncate">{operator.name}</p>
          <span className="flex items-center gap-1 text-xs text-slate-500">
            {status.icon}
            <span>{status.label}</span>
          </span>
        </div>
        <p className="text-xs text-slate-500 truncate mt-0.5">{operator.activeAssignment}</p>
      </div>

      {/* Skills */}
      <div className="hidden sm:flex flex-wrap gap-1 max-w-[140px] justify-end">
        {operator.skills.slice(0, 2).map(skill => (
          <span key={skill} className="px-2 py-0.5 bg-navy-100 text-navy-700 text-[10px] font-medium rounded-full truncate">
            {skill}
          </span>
        ))}
        {operator.skills.length > 2 && (
          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-full">
            +{operator.skills.length - 2}
          </span>
        )}
      </div>

      {/* Reassign Button */}
      <button
        onClick={() => onReassign(operator.id)}
        className="flex-shrink-0 p-1.5 text-slate-400 hover:text-navy-600 hover:bg-navy-50 rounded-lg transition-colors"
        title="Reassign operator"
      >
        <ArrowRight size={16} />
      </button>
    </div>
  );
}

interface ReassignModalProps {
  operator: Operator | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (operatorId: string, newAssignment: string) => void;
}

function ReassignModal({ operator, isOpen, onClose, onConfirm }: ReassignModalProps) {
  const [selectedAssignment, setSelectedAssignment] = useState('');

  const assignmentOptions = [
    'Bottle Filler Line 1',
    'Bottle Filler Line 2',
    'Pasteurization Unit A',
    'Pasteurization Unit B',
    'Mixing Station',
    'Capping Machine',
    'Labeling Station',
    'Quality Control',
  ];

  if (!isOpen || !operator) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-card shadow-card-elevated w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Reassign Operator</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Current Assignment */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-navy-500 to-navy-700 rounded-full flex items-center justify-center">
              <User size={18} className="text-white" />
            </div>
            <div>
              <p className="font-medium text-slate-900">{operator.name}</p>
              <p className="text-xs text-slate-500">Currently: {operator.activeAssignment}</p>
            </div>
          </div>
        </div>

        {/* Assignment Selection */}
        <div className="p-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">New Assignment</label>
          <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
            {assignmentOptions.map(option => (
              <button
                key={option}
                onClick={() => setSelectedAssignment(option)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedAssignment === option
                    ? 'bg-navy-100 text-navy-900 border-2 border-navy-300'
                    : 'bg-slate-50 text-slate-700 border-2 border-transparent hover:bg-slate-100'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 p-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm(operator.id, selectedAssignment);
              onClose();
            }}
            disabled={!selectedAssignment}
            className="flex-1 px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm Reassignment
          </button>
        </div>
      </div>
    </div>
  );
}

interface OperatorRosterProps {
  operators: Operator[];
  onReassignOperator: (id: string, assignment: string) => void;
}

export function OperatorRoster({ operators, onReassignOperator }: OperatorRosterProps) {
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleReassignRequest = (operatorId: string) => {
    const operator = operators.find(o => o.id === operatorId);
    if (operator) {
      setSelectedOperator(operator);
      setIsModalOpen(true);
    }
  };

  const handleReassignConfirm = (operatorId: string, newAssignment: string) => {
    onReassignOperator(operatorId, newAssignment);
    setSelectedOperator(null);
  };

  const activeCount = operators.filter(o => o.status === 'active').length;
  const onBreakCount = operators.filter(o => o.status === 'on-break').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-navy-500" />
            <h3 className="font-semibold text-slate-900">Operator Roster</h3>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-success-600">
              <span className="w-2 h-2 rounded-full bg-success-500"></span>
              {activeCount} Active
            </span>
            <span className="flex items-center gap-1 text-warning-600">
              <span className="w-2 h-2 rounded-full bg-warning-500"></span>
              {onBreakCount} Break
            </span>
          </div>
        </div>
      </div>

      {/* Operator List */}
      <div className="space-y-2">
        {operators.map(operator => (
          <OperatorCard
            key={operator.id}
            operator={operator}
            onReassign={handleReassignRequest}
          />
        ))}
      </div>

      {/* Reassign Modal */}
      <ReassignModal
        operator={selectedOperator}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedOperator(null);
        }}
        onConfirm={handleReassignConfirm}
      />
    </div>
  );
}
