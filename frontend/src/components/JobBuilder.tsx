import { useState, useCallback, useEffect } from 'react';
import {
  Hash,
  BoxSelect,
  Target,
  Calendar,
  ChevronDown,
  Plus,
  Play,
  AlertTriangle,
  User,
  GripVertical,
  X,
  Clock,
  CalendarClock,
  MapPin,
  ArrowRight,
  Settings2,
  Layers,
  Save,
  AlertCircle,
  Copy,
  Loader2,
  CheckCircle,
  Package,
} from 'lucide-react';
import type { Blueprint, JobProcessStage, WorkOrder, OperatorInfo, BlueprintCategory } from '../types';
import { mockBlueprints, mockBlueprintRuntime } from '../data/blueprintData';
import { mockWorkOrders } from '../data/jobBuilderData';
import { supabase } from '../lib/supabase';
import { activateJob as activateSharedJob, type SharedJob, type SharedJobStage } from '../lib/sharedState';

// Generate unique job ID
function generateJobId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `JOB-${timestamp}-${random}`;
}

function freshJobId(): string {
  // Always unique — uses crypto UUID as the entropy source
  const hex = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
  return `JOB-${hex}`;
}

// Blueprint template card for the left panel
interface BlueprintTemplateCardProps {
  blueprint: Blueprint;
  onAdd: () => void;
}

function BlueprintTemplateCard({ blueprint, onAdd }: BlueprintTemplateCardProps) {
  const categoryColors: Record<string, string> = {
    preparation: 'border-navy-300 bg-navy-50',
    processing: 'border-info-300 bg-info-50',
    packaging: 'border-warning-300 bg-warning-50',
    quality_control: 'border-success-300 bg-success-50',
  };

  return (
    <div
      className={`relative p-3 bg-white rounded-lg border-2 ${categoryColors[blueprint.category] || 'border-slate-200'} cursor-pointer hover:shadow-md transition-all group`}
      onClick={onAdd}
    >
      {/* Drag Handle */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200 group-hover:bg-navy-400 rounded-l-lg transition-colors flex items-center justify-center">
        <GripVertical size={14} className="text-slate-500 group-hover:text-white opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="flex items-start justify-between pl-1">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-slate-900 text-sm truncate">{blueprint.name}</h4>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            <Clock size={10} />
            <span>{blueprint.estimatedDurationMinutes} min</span>
            {blueprint.stationTag && (
              <>
                <MapPin size={10} />
                <span>{blueprint.stationTag}</span>
              </>
            )}
          </div>
        </div>
        <button className="p-1.5 bg-navy-900 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-navy-800">
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

// Process Instance Card in the canvas
interface ProcessInstanceCardProps {
  stage: JobProcessStage;
  allStages: JobProcessStage[];
  index: number;
  totalStages: number;
  operators: OperatorInfo[];
  onAssignOperator: (stageId: string, operatorId: string | undefined) => void;
  onRemove: (stageId: string) => void;
  validationError: boolean;
}

function ProcessInstanceCard({
  stage,
  allStages,
  index,
  totalStages,
  operators,
  onAssignOperator,
  onRemove,
  validationError,
}: ProcessInstanceCardProps) {
  const assignedOperator = operators.find(op => op.id === stage.assignedOperatorId);
  const hasSkillMismatch = assignedOperator &&
    stage.requiredSkills &&
    !stage.requiredSkills.some(skill => assignedOperator.skills.includes(skill));

  const availableOperators = operators.filter(op => op.status === 'active');

  return (
    <div
      className={`relative card p-4 transition-all duration-200 ${validationError ? 'ring-2 ring-danger-500 animate-pulse' : ''} ${hasSkillMismatch ? 'ring-2 ring-warning-400' : ''}`}
    >
      {/* Step Number Badge */}
      <div className="absolute -top-2 -left-2 w-7 h-7 bg-navy-900 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md">
        {index + 1}
      </div>

      {/* Remove Button */}
      <button
        onClick={() => onRemove(stage.id)}
        className="absolute -top-2 -right-2 w-6 h-6 bg-danger-500 text-white rounded-full flex items-center justify-center hover:bg-danger-600 transition-colors shadow-md"
      >
        <X size={12} />
      </button>

      {/* Content */}
      <div className="flex flex-col gap-3">
        {/* Stage Name + Schedule */}
        <div className="pt-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-slate-900">{stage.stageName}</h4>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-navy-100 text-navy-700 rounded">
              #{stage.stageOrder + 1}
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
          {/* Computed schedule (sequential, non-overlapping) */}
          {stage.estimatedDurationMinutes > 0 && (
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-400">
              <CalendarClock size={11} />
              <span>
                {(() => {
                  let offset = 0;
                  for (let i = 0; i < stage.stageOrder; i++) {
                    offset += allStages[i]?.estimatedDurationMinutes || 0;
                  }
                  const start = new Date(Date.now() + offset * 60_000);
                  const end = new Date(start.getTime() + stage.estimatedDurationMinutes * 60_000);
                  return `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                })()}
              </span>
            </div>
          )}
        </div>

        {/* Operator Assignment */}
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Assigned Operator
          </label>
          <div className="relative">
            <select
              value={stage.assignedOperatorId || ''}
              onChange={(e) => onAssignOperator(stage.id, e.target.value || undefined)}
              className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 ${
                validationError && !stage.assignedOperatorId ? 'border-danger-500' : 'border-slate-200'
              }`}
            >
              <option value="">Select operator...</option>
              {availableOperators.map(op => (
                <option key={op.id} value={op.id}>
                  {op.name}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Skill Mismatch Warning */}
          {hasSkillMismatch && (
            <div className="flex items-center gap-2 mt-2 text-xs text-warning-700 bg-warning-50 px-2 py-1.5 rounded-lg">
              <AlertTriangle size={12} />
              <span>Operator lacks required skills: {stage.requiredSkills?.join(', ')}</span>
            </div>
          )}

          {/* Assigned Operator Info */}
          {assignedOperator && (
            <div className="flex items-center gap-2 mt-2">
              <div className="w-6 h-6 bg-navy-600 rounded-full flex items-center justify-center">
                <User size={12} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-700 truncate">{assignedOperator.name}</p>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {assignedOperator.skills.slice(0, 3).map(skill => (
                    <span key={skill} className="px-1.5 py-0.5 bg-navy-100 text-navy-700 text-[10px] rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Connector Arrow */}
      {index < totalStages - 1 && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center">
          <ArrowRight size={20} className="text-navy-400" />
        </div>
      )}
    </div>
  );
}

// Validation Banner
interface ValidationBannerProps {
  show: boolean;
  message: string;
  onDismiss: () => void;
}

function ValidationBanner({ show, message, onDismiss }: ValidationBannerProps) {
  if (!show) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top duration-200">
      <div className="flex items-center gap-3 px-6 py-3 bg-danger-600 text-white rounded-lg shadow-lg">
        <AlertCircle size={20} />
        <span className="font-medium">{message}</span>
        <button
          onClick={onDismiss}
          className="ml-2 p-1 hover:bg-danger-700 rounded transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

export function JobBuilder({ managerId, managerName }: { managerId?: string; managerName?: string }) {
  const [jobId, setJobId] = useState(generateJobId());
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [targetQuantity, setTargetQuantity] = useState(0);
  const [unit, setUnit] = useState('Units');
  const [jobName, setJobName] = useState('');
  // Default scheduled start: next hour rounded
  const [scheduledStartTime, setScheduledStartTime] = useState(() => {
    const now = new Date();
    now.setHours(now.getHours() + 1, 0, 0, 0);
    return now.toISOString().slice(0, 16); // datetime-local format
  });
  const [stages, setStages] = useState<JobProcessStage[]>([]);
  const [showValidationError, setShowValidationError] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [operators, setOperators] = useState<OperatorInfo[]>([]);
  const [isActivating, setIsActivating] = useState(false);
  const [activationSuccess, setActivationSuccess] = useState<string | null>(null);

  // Load operators from Supabase so newly registered accounts appear
  useEffect(() => {
    supabase
      .from('operator_accounts')
      .select('id, name, phone, skills, status')
      .eq('status', 'active')
      .order('name', { ascending: true })
      .then(({ data }) => {
        if (data) {
          setOperators(data.map(r => ({
            id: r.id,
            name: r.name,
            phone: r.phone || '',
            skills: r.skills || [],
            status: 'active' as const,
          })));
        }
      });
  }, []);

  // Add a blueprint as a process stage
  const handleAddStage = useCallback((blueprint: Blueprint) => {
    const newStage: JobProcessStage = {
      id: `stage-${Date.now()}`,
      blueprintId: blueprint.id,
      stageOrder: stages.length,
      stageName: blueprint.name,
      estimatedDurationMinutes: blueprint.estimatedDurationMinutes,
      stationTag: blueprint.stationTag || undefined,
      status: 'pending',
      requiredSkills: getRequiredSkillsForBlueprint(blueprint),
    };
    setStages(prev => [...prev, newStage]);
  }, [stages.length]);

  // Get required skills based on blueprint category and enabled features
  function getRequiredSkillsForBlueprint(blueprint: Blueprint): string[] {
    const skills: string[] = [];
    if (blueprint.category === 'processing') {
      skills.push('Pasteurization', 'Blender Ops');
    }
    if (blueprint.category === 'quality_control') {
      skills.push('QC Certified');
    }
    if (blueprint.qcFormEnabled) {
      skills.push('QC Certified');
    }
    return skills.length > 0 ? skills : [blueprint.name.replace(/[& ]+/g, ' ')];
  }

  // Assign operator to stage
  const handleAssignOperator = useCallback((stageId: string, operatorId: string | undefined) => {
    const operator = operators.find(op => op.id === operatorId);
    setStages(prev =>
      prev.map(stage =>
        stage.id === stageId
          ? { ...stage, assignedOperatorId: operatorId, operatorName: operator?.name }
          : stage
      )
    );
  }, []);

  // Remove stage
  const handleRemoveStage = useCallback((stageId: string) => {
    setStages(prev => prev.filter(s => s.id !== stageId));
  }, []);

  // Handle work order selection
  const handleWorkOrderSelect = (woId: string) => {
    const wo = mockWorkOrders.find(w => w.id === woId);
    if (wo) {
      setSelectedWorkOrder(wo);
      setTargetQuantity(wo.targetQuantity);
      setUnit(wo.unit);
    } else {
      setSelectedWorkOrder(null);
      setTargetQuantity(0);
      setUnit('Units');
    }
  };

  // Validate and activate production run — persists to Supabase
  const handleActivateRun = async () => {
    const unstagedCards = stages.filter(s => !s.assignedOperatorId);

    if (stages.length === 0) {
      setValidationMessage('Activation Halted: Add at least one process stage to the pipeline.');
      setShowValidationError(true);
      return;
    }

    if (unstagedCards.length > 0) {
      setValidationMessage('Activation Halted: Every pipeline stage must have an assigned operator before going live.');
      setShowValidationError(true);
      return;
    }

    setIsActivating(true);
    setActivationSuccess(null);

    try {
      // 1. Look up the work order UUID from Supabase by work_order_number
      let workOrderId: string | null = null;
      if (selectedWorkOrder) {
        const { data: wo } = await supabase
          .from('work_orders')
          .select('id')
          .eq('work_order_number', selectedWorkOrder.workOrderNumber)
          .maybeSingle();
        workOrderId = wo?.id || null;
      }

      // 2. Generate a unique job_id for this specific activation attempt
      const activationJobId = freshJobId();

      // 3. Compute scheduled times from the manager-provided start time
      const jobStartTime = new Date(scheduledStartTime);
      const totalDurationMin = stages.reduce((sum, s) => sum + (s.estimatedDurationMinutes || 0), 0);
      const jobEndTime = new Date(jobStartTime.getTime() + totalDurationMin * 60_000);

      // Production job status: always 'active' when activated (scheduled time is for planning, not auto-activation)
      const initialStatus = 'active';

      // 4. Insert the production job
      const { data: jobRow, error: jobError } = await supabase
        .from('production_jobs')
        .insert({
          job_id: activationJobId,
          work_order_id: workOrderId,
          name: jobName || 'Untitled Job',
          product_name: selectedWorkOrder?.productName || null,
          target_quantity: targetQuantity || 0,
          unit: unit || 'Units',
          status: initialStatus,
          scheduled_start_at: jobStartTime.toISOString(),
          scheduled_end_at: jobEndTime.toISOString(),
          assigned_manager_id: managerId || null,
        })
        .select('id')
        .single();

      if (jobError) throw new Error(jobError.message);

      // 5. Compute scheduled start/end times so stages don't overlap
      //    Each stage starts when the previous one ends (sequential pipeline).
      let cumulativeMinutes = 0;

      // 4. Insert all process stages
      const stageRows = stages.map((s, idx) => {
        const op = operators.find(o => o.id === s.assignedOperatorId);
        const durationMin = s.estimatedDurationMinutes || 0;

        const scheduledStart = new Date(jobStartTime.getTime() + cumulativeMinutes * 60_000);
        const scheduledEnd = new Date(scheduledStart.getTime() + durationMin * 60_000);
        cumulativeMinutes += durationMin;

        // blueprint_id has an FK to blueprints(id) — mock IDs like 'bp-1'
        // would violate the constraint, so only pass it when it's a valid UUID.
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s.blueprintId || '');

        return {
          job_id: jobRow.id,
          blueprint_id: isUuid ? s.blueprintId : null,
          stage_order: idx,
          stage_name: s.stageName,
          estimated_duration_minutes: durationMin,
          station_tag: s.stationTag || null,
          assigned_operator_id: s.assignedOperatorId || null,
          operator_name: op?.name || null,
          status: 'available',
          scheduled_start_at: scheduledStart.toISOString(),
          scheduled_end_at: scheduledEnd.toISOString(),
        };
      });

      const { error: stagesError } = await supabase
        .from('job_process_stages')
        .insert(stageRows);

      if (stagesError) throw new Error(stagesError.message);

      // 5. Also push to shared-state bridge for real-time operator module sync
      let sharedCumulativeMin = 0;
      const sharedStages: SharedJobStage[] = stages.map((s, idx) => {
        const op = operators.find(o => o.id === s.assignedOperatorId);
        const durationMin = s.estimatedDurationMinutes || 30;
        const sStart = new Date(jobStartTime.getTime() + sharedCumulativeMin * 60_000);
        const sEnd = new Date(sStart.getTime() + durationMin * 60_000);
        sharedCumulativeMin += durationMin;

        // Look up the source blueprint to embed its full runtime config
        const sourceBp = mockBlueprints.find(bp => bp.id === s.blueprintId);
        const runtimeData = s.blueprintId ? mockBlueprintRuntime[s.blueprintId] : undefined;

        return {
          id: `stage-${Date.now()}-${idx}`,
          jobId: activationJobId,
          jobName: jobName || 'Untitled Job',
          productName: selectedWorkOrder?.productName || 'Unknown Product',
          stageName: s.stageName,
          stageOrder: idx,
          stationTag: s.stationTag || 'Main Line',
          estimatedDurationMinutes: durationMin,
          operatorName: op?.name || 'Unassigned',
          operatorPhone: op?.phone || '',
          status: 'available' as const,
          startedAt: null,
          blueprintId: s.blueprintId || '',
          blueprintName: s.stageName,
          scheduledStartAt: sStart.toISOString(),
          scheduledEndAt: sEnd.toISOString(),
          // Embed blueprint configuration so operators see the right sections
          checklistValidationTiming: sourceBp?.checklistValidationTiming ?? null,
          guidelinesEnabled: sourceBp?.guidelinesEnabled ?? false,
          guidelinesContent: sourceBp?.guidelinesContent ?? null,
          checklistEnabled: sourceBp?.checklistEnabled ?? false,
          checklistItems: runtimeData?.checklistItems ?? [],
          quantityLoggingEnabled: sourceBp?.quantityLoggingEnabled ?? false,
          quantityMetrics: runtimeData?.quantityMetrics ?? [],
          qcFormEnabled: sourceBp?.qcFormEnabled ?? false,
          qcQuestions: runtimeData?.qcQuestions ?? [],
          faultCategoriesEnabled: sourceBp?.faultCategoriesEnabled ?? false,
          faultCategories: runtimeData?.faultCategories ?? [],
        };
      });

      const sharedJob: SharedJob = {
        id: `job-${Date.now()}`,
        jobId: activationJobId,
        jobName: jobName || 'Untitled Job',
        productName: selectedWorkOrder?.productName || 'Unknown Product',
        targetQuantity: targetQuantity || 0,
        unit: unit || 'units',
        timeline: `${jobStartTime.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} – ${jobEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        scheduledStartAt: jobStartTime.toISOString(),
        scheduledEndAt: jobEndTime.toISOString(),
        activatedAt: new Date().toISOString(),
        managerId: managerId || null,
        managerName: managerName || null,
        stages: sharedStages,
      };

      activateSharedJob(sharedJob);

      // Reset the builder for a new job after successful activation
      setJobId(generateJobId());

      setShowValidationError(false);
      const timeRange = `${jobStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${jobEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      setActivationSuccess(`Production Job "${activationJobId}" created. ${stages.length} stage${stages.length > 1 ? 's' : ''}, ${stages.length} operator${stages.length > 1 ? 's' : ''} assigned. Scheduled: ${timeRange}. Status: ${initialStatus.toUpperCase()}. The job will appear in the Operator module when its scheduled time arrives.`);
    } catch (err: any) {
      setValidationMessage(`Activation Failed: ${err.message || 'Could not save job to database.'}`);
      setShowValidationError(true);
    } finally {
      setIsActivating(false);
    }
  };

  // operators state is populated from Supabase via useEffect above

  const groupedBlueprints: Record<BlueprintCategory, Blueprint[]> = {
    preparation: mockBlueprints.filter((b: Blueprint) => b.category === 'preparation' && !b.isArchived),
    processing: mockBlueprints.filter((b: Blueprint) => b.category === 'processing' && !b.isArchived),
    packaging: mockBlueprints.filter((b: Blueprint) => b.category === 'packaging' && !b.isArchived),
    quality_control: mockBlueprints.filter((b: Blueprint) => b.category === 'quality_control' && !b.isArchived),
  };

  const hasValidationError = showValidationError && (stages.length === 0 || stages.some(s => !s.assignedOperatorId));

  return (
    <div className="h-full flex flex-col bg-slate-100">
      <ValidationBanner
        show={showValidationError}
        message={validationMessage}
        onDismiss={() => setShowValidationError(false)}
      />

      {/* Success banner */}
      {activationSuccess && (
        <div className="mx-6 mt-4 flex items-start gap-3 p-4 bg-success-50 border border-success-200 rounded-lg">
          <CheckCircle size={20} className="text-success-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-success-800">{activationSuccess}</p>
          </div>
          <button
            onClick={() => setActivationSuccess(null)}
            className="text-success-400 hover:text-success-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Top Configuration Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 size={20} className="text-navy-600" />
            <h1 className="text-xl font-bold text-slate-900">Job Builder</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Job ID */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Job ID</label>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg">
                <Hash size={14} className="text-slate-400" />
                <span className="text-sm font-mono text-slate-700">{jobId}</span>
                <button
                  onClick={() => setJobId(generateJobId())}
                  className="p-1 text-slate-400 hover:text-navy-600 hover:bg-slate-200 rounded transition-colors"
                  title="Generate new ID"
                >
                  <Copy size={12} />
                </button>
              </div>
            </div>

            {/* Work Order Reference */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                <BoxSelect size={12} className="inline mr-1" />
                Work Order
              </label>
              <select
                value={selectedWorkOrder?.id || ''}
                onChange={(e) => handleWorkOrderSelect(e.target.value)}
                className="w-48 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500"
              >
                <option value="">Select work order...</option>
                {mockWorkOrders.map(wo => (
                  <option key={wo.id} value={wo.id}>
                    {wo.workOrderNumber}
                  </option>
                ))}
              </select>
            </div>

            {/* Job Title */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                <Package size={12} className="inline mr-1" />
                Job Title
              </label>
              <input
                type="text"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                placeholder="e.g. Morning Mango Batch Run"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500"
              />
            </div>

            {/* Target Quantity */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                <Target size={12} className="inline mr-1" />
                Target Output
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={targetQuantity}
                  onChange={(e) => setTargetQuantity(parseInt(e.target.value) || 0)}
                  className="w-28 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500"
                />
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500"
                />
              </div>
            </div>

            {/* Scheduled Start Time */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                <Calendar size={12} className="inline mr-1" />
                Scheduled Start
              </label>
              <input
                type="datetime-local"
                value={scheduledStartTime}
                onChange={(e) => setScheduledStartTime(e.target.value)}
                className="w-48 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500"
              />
            </div>
          </div>
        </div>

        {selectedWorkOrder && (
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg inline-flex">
            <Layers size={14} className="text-navy-500" />
            <span>Linked to: <strong>{selectedWorkOrder.productName}</strong></span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Blueprints */}
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Layers size={16} className="text-navy-500" />
              Process Templates
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Click to add to pipeline</p>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-4">
            {/* Preparation */}
            {groupedBlueprints.preparation.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">Preparation</h3>
                <div className="space-y-2">
                  {groupedBlueprints.preparation.map(bp => (
                    <BlueprintTemplateCard
                      key={bp.id}
                      blueprint={bp}
                      onAdd={() => handleAddStage(bp)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Processing */}
            {groupedBlueprints.processing.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">Processing</h3>
                <div className="space-y-2">
                  {groupedBlueprints.processing.map(bp => (
                    <BlueprintTemplateCard
                      key={bp.id}
                      blueprint={bp}
                      onAdd={() => handleAddStage(bp)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Packaging */}
            {groupedBlueprints.packaging.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">Packaging</h3>
                <div className="space-y-2">
                  {groupedBlueprints.packaging.map(bp => (
                    <BlueprintTemplateCard
                      key={bp.id}
                      blueprint={bp}
                      onAdd={() => handleAddStage(bp)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Quality Control */}
            {groupedBlueprints.quality_control.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">Quality Control</h3>
                <div className="space-y-2">
                  {groupedBlueprints.quality_control.map(bp => (
                    <BlueprintTemplateCard
                      key={bp.id}
                      blueprint={bp}
                      onAdd={() => handleAddStage(bp)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center Canvas: DAG Workspace */}
        <div className="flex-1 flex flex-col">
          {/* Canvas */}
          <div className="flex-1 overflow-auto p-6">
            {stages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                  <Plus size={32} className="text-slate-400" />
                </div>
                <h3 className="font-semibold text-slate-700 mb-2">Build Your Production Pipeline</h3>
                <p className="text-sm text-slate-500 max-w-md">
                  Click on process templates from the left panel to add stages to your manufacturing run. Each stage will be assigned an operator before activation.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-start gap-8 pb-8 pl-8">
                {stages.map((stage, index) => (
                  <div key={stage.id} className="min-w-[320px]">
                    <ProcessInstanceCard
                      stage={stage}
                      allStages={stages}
                      index={index}
                      totalStages={stages.length}
                      operators={operators}
                      onAssignOperator={handleAssignOperator}
                      onRemove={handleRemoveStage}
                      validationError={hasValidationError && !stage.assignedOperatorId}
                    />
                  </div>
                ))}

                {/* Add More Indicator */}
                <div className="flex items-center gap-2 text-slate-400 pl-[148px]">
                  <div className="w-8 h-8 border-2 border-dashed border-slate-300 rounded-full flex items-center justify-center">
                    <Plus size={16} />
                  </div>
                  <span className="text-xs">Add more stages from templates</span>
                </div>
              </div>
            )}
          </div>

          {/* Floating Action Bar */}
          <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_6px_-1px_rgb(0_0_0_/_0.1)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm text-slate-500">
                  <span className="font-medium text-slate-700">{stages.length}</span> stage{stages.length !== 1 ? 's' : ''} configured
                </div>
                {stages.length > 0 && (
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span>
                      <span className="font-medium text-success-600">{stages.filter(s => s.assignedOperatorId).length}</span> operators assigned
                    </span>
                    <span className="text-slate-300">|</span>
                    <span>Total duration: <span className="font-medium text-slate-700">{stages.reduce((acc, s) => acc + s.estimatedDurationMinutes, 0)}</span> min</span>
                    <span className="text-slate-300">|</span>
                    <span className="flex items-center gap-1">
                      <CalendarClock size={14} className="text-navy-500" />
                      <span>Window: <span className="font-medium text-slate-700">
                        {(() => {
                          const total = stages.reduce((acc, s) => acc + s.estimatedDurationMinutes, 0);
                          const start = new Date();
                          const end = new Date(start.getTime() + total * 60_000);
                          return `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                        })()}
                      </span></span>
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors">
                  <Save size={16} />
                  <span>Save Draft</span>
                </button>
                <button
                  onClick={handleActivateRun}
                  disabled={isActivating}
                  className={`flex items-center gap-2 px-6 py-2.5 font-medium rounded-lg shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                    hasValidationError
                      ? 'bg-danger-600 hover:bg-danger-700 text-white'
                      : 'bg-navy-900 hover:bg-navy-800 text-white hover:shadow-md'
                  }`}
                >
                  {isActivating ? (
                    <><Loader2 size={16} className="animate-spin" /><span>Activating...</span></>
                  ) : (
                    <><Play size={16} /><span>Activate Production Run</span></>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
