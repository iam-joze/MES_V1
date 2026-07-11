import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, Clock, MapPin } from 'lucide-react';

interface Operator {
  id: string;
  name: string;
}

export interface StageDraft {
  tempId: string;
  blueprintId: string | null;
  stageName: string;
  estimatedDurationMinutes: number;
  stationTag: string | null;
  operatorId: string | null;
}

interface StageCardProps {
  stage: StageDraft;
  index: number;
  operators: Operator[];
  onAssignOperator: (tempId: string, operatorId: string) => void;
  onRemove: (tempId: string) => void;
  invalid: boolean;
}

export function StageCard({ stage, index, operators, onAssignOperator, onRemove, invalid }: StageCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stage.tempId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative bg-white rounded-lg border p-4 shadow-sm ${invalid ? 'ring-2 ring-red-500' : 'border-slate-200'}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab text-slate-400 hover:text-slate-600"
      >
        <GripVertical size={16} />
      </div>

      <button
        onClick={() => onRemove(stage.tempId)}
        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
      >
        <X size={12} />
      </button>

      <div className="pl-6">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-slate-900">{stage.stageName}</h4>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-navy-100 text-navy-700 rounded">
            #{index + 1}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
          <Clock size={12} />
          <span>{stage.estimatedDurationMinutes} min</span>
          {stage.stationTag && (
            <>
              <MapPin size={12} />
              <span>{stage.stationTag}</span>
            </>
          )}
        </div>

        <label className="block text-xs font-medium text-slate-600 mt-3 mb-1">Assigned Operator</label>
        <select
          value={stage.operatorId || ''}
          onChange={(e) => onAssignOperator(stage.tempId, e.target.value)}
          className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm ${
            invalid ? 'border-red-500' : 'border-slate-200'
          }`}
        >
          <option value="">Select operator...</option>
          {operators.map((op) => (
            <option key={op.id} value={op.id}>
              {op.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}