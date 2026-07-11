import { useState, useEffect } from 'react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Plus, Play, Save, Loader2 } from 'lucide-react';
import { api } from '../../../shared/lib/api';
import { StageCard } from '../components/Stagecard';
import type { StageDraft } from '../components/Stagecard';

interface Blueprint {
  id: string;
  name: string;
  category: string;
  stationTag: string | null;
  estimatedDurationMinutes: number;
  isArchived: boolean;
}

interface ProductionLine {
  id: string;
  name: string;
  targetProduct: string | null;
  targetQuantity: number | null;
  unit: string | null;
  targetDate: string | null;
}

interface Operator {
  id: string;
  name: string;
}

export default function JobBuilder() {
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [lines, setLines] = useState<ProductionLine[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);

  const [lineId, setLineId] = useState('');
  const [jobName, setJobName] = useState('');
  const [productName, setProductName] = useState('');
  const [targetQuantity, setTargetQuantity] = useState(0);
  const [unit, setUnit] = useState('Units');
  const [scheduledStartAt, setScheduledStartAt] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [stages, setStages] = useState<StageDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    api.get('/blueprints').then((res) => setBlueprints((res.data.blueprints ?? []).filter((b: Blueprint) => !b.isArchived)));
    api.get('/manager/lines').then((res) => setLines(res.data.lines ?? []));
    api.get('/manager/operators').then((res) => setOperators(res.data ?? []));
  }, []);

  const grouped = blueprints.reduce<Record<string, Blueprint[]>>((acc, bp) => {
    (acc[bp.category] ||= []).push(bp);
    return acc;
  }, {});

  const handleLineSelect = (id: string) => {
    setLineId(id);
    const line = lines.find((l) => l.id === id);
    if (line) {
      setProductName(line.targetProduct || '');
      setTargetQuantity(line.targetQuantity || 0);
      setUnit(line.unit || 'Units');
    }
  };

  const handleAddStage = (bp: Blueprint) => {
    setStages((prev) => [
      ...prev,
      {
        tempId: crypto.randomUUID(),
        blueprintId: bp.id,
        stageName: bp.name,
        estimatedDurationMinutes: bp.estimatedDurationMinutes,
        stationTag: bp.stationTag,
        operatorId: null,
      },
    ]);
  };

  const handleRemoveStage = (tempId: string) =>
    setStages((prev) => prev.filter((s) => s.tempId !== tempId));

  const handleAssignOperator = (tempId: string, operatorId: string) =>
    setStages((prev) => prev.map((s) => (s.tempId === tempId ? { ...s, operatorId } : s)));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setStages((prev) => {
      const oldIndex = prev.findIndex((s) => s.tempId === active.id);
      const newIndex = prev.findIndex((s) => s.tempId === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleSubmit = async (status: 'DRAFT' | 'ACTIVE') => {
    setError(null);
    if (stages.length === 0) {
      setError('Add at least one process stage.');
      return;
    }
    if (status === 'ACTIVE' && stages.some((s) => !s.operatorId)) {
      setError('Every stage needs an assigned operator before activation.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/manager/jobs', {
        name: jobName || 'Untitled Job',
        productName,
        targetQuantity,
        unit,
        lineId: lineId || null,
        scheduledStartAt: new Date(scheduledStartAt).toISOString(),
        status,
        stages: stages.map((s) => ({
          blueprintId: s.blueprintId,
          stageName: s.stageName,
          estimatedDurationMinutes: s.estimatedDurationMinutes,
          stationTag: s.stationTag,
          operatorId: s.operatorId,
        })),
      });
      setSuccess(`Job "${res.data.jobId}" ${status === 'ACTIVE' ? 'activated' : 'saved as draft'}.`);
      setStages([]);
      setJobName('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save job.');
    } finally {
      setSubmitting(false);
    }
  };

  const invalidStage = (s: StageDraft) => !!error && !s.operatorId;

  return (
    <div className="h-full flex flex-col bg-slate-100">
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Top config bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Production Line</label>
          <select
            value={lineId}
            onChange={(e) => handleLineSelect(e.target.value)}
            className="w-48 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
          >
            <option value="">Select line...</option>
            {lines.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Job Title</label>
          <input
            value={jobName}
            onChange={(e) => setJobName(e.target.value)}
            placeholder="e.g. Morning Mango Batch Run"
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Target Output</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={targetQuantity}
              onChange={(e) => setTargetQuantity(parseInt(e.target.value) || 0)}
              className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
            />
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Scheduled Start</label>
          <input
            type="datetime-local"
            value={scheduledStartAt}
            onChange={(e) => setScheduledStartAt(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
          />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Blueprint palette */}
        <div className="w-64 bg-white border-r border-slate-200 overflow-y-auto p-3 space-y-4">
          {Object.entries(grouped).map(([category, bps]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2 px-1">{category}</h3>
              <div className="space-y-2">
                {bps.map((bp) => (
                  <div
                    key={bp.id}
                    onClick={() => handleAddStage(bp)}
                    className="p-3 bg-white rounded-lg border-2 border-slate-200 cursor-pointer hover:shadow-md flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{bp.name}</p>
                      <p className="text-xs text-slate-500">{bp.estimatedDurationMinutes} min</p>
                    </div>
                    <Plus size={14} className="text-navy-600" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Canvas */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-auto p-6">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={stages.map((s) => s.tempId)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-4 max-w-md">
                  {stages.map((stage, idx) => (
                    <StageCard
                      key={stage.tempId}
                      stage={stage}
                      index={idx}
                      operators={operators}
                      onAssignOperator={handleAssignOperator}
                      onRemove={handleRemoveStage}
                      invalid={invalidStage(stage)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            {stages.length === 0 && (
              <p className="text-sm text-slate-500">Click templates on the left to build the pipeline.</p>
            )}
          </div>

          <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 flex justify-end gap-3">
            <button
              onClick={() => handleSubmit('DRAFT')}
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg"
            >
              <Save size={16} /> Save Draft
            </button>
            <button
              onClick={() => handleSubmit('ACTIVE')}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-navy-900 hover:bg-navy-800 text-white font-medium rounded-lg"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              Activate Production Run
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}