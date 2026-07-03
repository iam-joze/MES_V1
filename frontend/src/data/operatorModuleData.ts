import { supabase } from '../lib/supabase';
import { getSharedState } from '../lib/sharedState';
import type {
  OperatorProcessStage,
  RuntimeStageDetail,
  ChecklistItem,
  QCQuestion,
  FaultCategory,
  QuantityMetric,
} from '../types/operatorModule';

// Fetch all process stages assigned to an operator (for O1 list view)
// Merges Supabase data with shared-state (localStorage) data so that
// dynamically created jobs from the Job Builder appear in real time.
export async function fetchOperatorAssignments(operatorName: string): Promise<OperatorProcessStage[]> {
  // 1. Fetch from Supabase (seeded/mock data)
  let supabaseStages: OperatorProcessStage[] = [];
  try {
    const { data, error } = await supabase
      .from('job_process_stages')
      .select(`
        id,
        stage_name,
        stage_order,
        station_tag,
        estimated_duration_minutes,
        operator_name,
        status,
        job_id,
        blueprint_id,
        scheduled_start_at,
        scheduled_end_at,
        production_jobs!inner (
          job_id,
          name,
          product_name
        ),
        blueprints (
          id,
          name,
          guidelines_enabled,
          guidelines_content,
          checklist_enabled,
          checklist_validation_timing,
          quantity_logging_enabled,
          quantity_unit_label,
          quantity_min_value,
          quantity_max_value,
          qc_form_enabled,
          fault_categories_enabled
        )
      `)
      .eq('operator_name', operatorName)
      .in('status', ['available', 'running', 'paused'])
      .order('stage_order', { ascending: true });

    if (!error && data) {
      supabaseStages = (data as any[]).map((row: any) => {
        const job = row.production_jobs;
        const bp = row.blueprints;
        return {
          id: row.id,
          stageName: row.stage_name,
          stageOrder: row.stage_order,
          stationTag: row.station_tag || '',
          estimatedDurationMinutes: row.estimated_duration_minutes || 0,
          operatorName: row.operator_name || '',
          status: row.status,
          jobId: job?.job_id || '',
          jobName: job?.name || '',
          productName: job?.product_name || '',
          blueprintId: bp?.id || null,
          blueprintName: bp?.name || null,
          guidelinesEnabled: bp?.guidelines_enabled || false,
          guidelinesContent: bp?.guidelines_content || null,
          checklistEnabled: bp?.checklist_enabled || false,
          checklistValidationTiming: bp?.checklist_validation_timing || null,
          quantityLoggingEnabled: bp?.quantity_logging_enabled || false,
          quantityUnitLabel: bp?.quantity_unit_label || null,
          quantityMinValue: bp?.quantity_min_value ?? null,
          quantityMaxValue: bp?.quantity_max_value ?? null,
          qcFormEnabled: bp?.qc_form_enabled || false,
          faultCategoriesEnabled: bp?.fault_categories_enabled || false,
          scheduledStartAt: row.scheduled_start_at || null,
          scheduledEndAt: row.scheduled_end_at || null,
        } as OperatorProcessStage;
      });
    }
  } catch {
    // Supabase may not be reachable — fall through to shared state
  }

  // 2. Fetch from shared state (localStorage bridge — dynamically created jobs)
  const sharedState = getSharedState();
  const sharedStages: OperatorProcessStage[] = [];
  const normalizedName = operatorName.toLowerCase();

  for (const job of sharedState.jobs) {
    for (const stage of job.stages) {
      const nameMatch = stage.operatorName.toLowerCase() === normalizedName;
      const phoneMatch =
        sharedState.activeOperatorPhone &&
        stage.operatorPhone.replace(/\s/g, '') ===
          sharedState.activeOperatorPhone.replace(/\s/g, '');
      if ((nameMatch || phoneMatch) && stage.status !== 'completed') {
        sharedStages.push({
          id: stage.id,
          stageName: stage.stageName,
          stageOrder: stage.stageOrder,
          stationTag: stage.stationTag,
          estimatedDurationMinutes: stage.estimatedDurationMinutes,
          operatorName: stage.operatorName,
          status: stage.status as any,
          jobId: stage.jobId,
          jobName: stage.jobName,
          productName: stage.productName,
          blueprintId: stage.blueprintId,
          blueprintName: stage.blueprintName,
          guidelinesEnabled: stage.guidelinesEnabled ?? false,
          guidelinesContent: stage.guidelinesContent ?? null,
          checklistEnabled: stage.checklistEnabled ?? false,
          checklistValidationTiming: stage.checklistValidationTiming ?? null,
          quantityLoggingEnabled: stage.quantityLoggingEnabled ?? false,
          quantityUnitLabel: stage.quantityUnitLabel ?? null,
          quantityMinValue: stage.quantityMinValue ?? null,
          quantityMaxValue: stage.quantityMaxValue ?? null,
          qcFormEnabled: stage.qcFormEnabled ?? false,
          faultCategoriesEnabled: stage.faultCategoriesEnabled ?? true,
          scheduledStartAt: stage.scheduledStartAt ?? null,
          scheduledEndAt: stage.scheduledEndAt ?? null,
        });
      }
    }
  }

  // 3. Merge: shared state stages take priority (they're the live data)
  const sharedIds = new Set(sharedStages.map(s => s.id));
  const filtered = supabaseStages.filter(s => !sharedIds.has(s.id));

  return [...sharedStages, ...filtered].sort((a, b) => a.stageOrder - b.stageOrder);
}

// Fetch full runtime detail for a single stage (O2 view)
export async function fetchRuntimeStageDetail(stageId: string): Promise<RuntimeStageDetail | null> {
  // First check shared state for dynamically created stages (from Job Builder)
  const sharedState = getSharedState();
  const sharedStg = sharedState.jobs.flatMap(j => j.stages).find(s => s.id === stageId);
  if (sharedStg) {
    // Default fault categories for stages that have faultCategoriesEnabled but no embedded list
    const defaultFaultCategories: FaultCategory[] = [
      { id: 'f1', faultName: 'Conveyor Belt Motor Jam', severity: 'critical', requiresPhoto: true, sortOrder: 1 },
      { id: 'f2', faultName: 'Raw Material Contamination', severity: 'critical', requiresPhoto: true, sortOrder: 2 },
      { id: 'f3', faultName: 'Equipment Overheating', severity: 'minor', requiresPhoto: false, sortOrder: 3 },
      { id: 'f4', faultName: 'Material Shortage / Low Stock', severity: 'minor', requiresPhoto: false, sortOrder: 4 },
      { id: 'f5', faultName: 'Quality Deviation Detected', severity: 'minor', requiresPhoto: true, sortOrder: 5 },
    ];

    const embeddedFaultCategories: FaultCategory[] = (sharedStg.faultCategories ?? []).map(f => ({
      id: f.id,
      faultName: f.faultName,
      severity: f.severity,
      requiresPhoto: f.requiresPhoto,
      sortOrder: f.sortOrder,
    }));

    const faultCategories = embeddedFaultCategories.length > 0
      ? embeddedFaultCategories
      : sharedStg.faultCategoriesEnabled !== false
        ? defaultFaultCategories
        : [];

    const checklistItems: ChecklistItem[] = (sharedStg.checklistItems ?? []).map(c => ({
      id: c.id,
      itemText: c.itemText,
      sortOrder: c.sortOrder,
      isRequired: c.isRequired,
    }));

    const qcQuestions: QCQuestion[] = (sharedStg.qcQuestions ?? []).map(q => ({
      id: q.id,
      questionText: q.questionText,
      responseType: q.responseType,
      numericMinValue: q.numericMinValue,
      numericMaxValue: q.numericMaxValue,
      numericTolerance: q.numericTolerance,
      sortOrder: q.sortOrder,
      isRequired: q.isRequired,
    }));

    const quantityMetrics: QuantityMetric[] = (sharedStg.quantityMetrics ?? []).map(m => ({
      id: m.id,
      metricName: m.metricName,
      unitLabel: m.unitLabel,
      minValue: m.minValue,
      maxValue: m.maxValue,
      inputFrequency: m.inputFrequency,
      sortOrder: m.sortOrder,
    }));

    const base: OperatorProcessStage = {
      id: sharedStg.id,
      stageName: sharedStg.stageName,
      stageOrder: sharedStg.stageOrder,
      stationTag: sharedStg.stationTag,
      estimatedDurationMinutes: sharedStg.estimatedDurationMinutes,
      operatorName: sharedStg.operatorName,
      status: sharedStg.status as any,
      jobId: sharedStg.jobId,
      jobName: sharedStg.jobName,
      productName: sharedStg.productName,
      blueprintId: sharedStg.blueprintId,
      blueprintName: sharedStg.blueprintName,
      guidelinesEnabled: sharedStg.guidelinesEnabled ?? false,
      guidelinesContent: sharedStg.guidelinesContent ?? null,
      checklistEnabled: (sharedStg.checklistEnabled ?? false) && checklistItems.length > 0,
      checklistValidationTiming: sharedStg.checklistValidationTiming ?? null,
      quantityLoggingEnabled: sharedStg.quantityLoggingEnabled ?? false,
      quantityUnitLabel: sharedStg.quantityUnitLabel ?? null,
      quantityMinValue: sharedStg.quantityMinValue ?? null,
      quantityMaxValue: sharedStg.quantityMaxValue ?? null,
      qcFormEnabled: (sharedStg.qcFormEnabled ?? false) && qcQuestions.length > 0,
      faultCategoriesEnabled: sharedStg.faultCategoriesEnabled ?? true,
      scheduledStartAt: sharedStg.scheduledStartAt ?? null,
      scheduledEndAt: sharedStg.scheduledEndAt ?? null,
    };

    return { ...base, checklistItems, qcQuestions, faultCategories, quantityMetrics };
  }

  // Fall back to Supabase for seeded stages
  const { data: stageData, error: stageError } = await supabase
    .from('job_process_stages')
    .select(`
      id,
      stage_name,
      stage_order,
      station_tag,
      estimated_duration_minutes,
      operator_name,
      status,
      job_id,
      blueprint_id,
      scheduled_start_at,
      scheduled_end_at,
      production_jobs!inner (
        job_id,
        name,
        product_name
      ),
      blueprints (
        id,
        name,
        guidelines_enabled,
        guidelines_content,
        checklist_enabled,
        checklist_validation_timing,
        quantity_logging_enabled,
        quantity_unit_label,
        quantity_min_value,
        quantity_max_value,
        qc_form_enabled,
        fault_categories_enabled
      )
    `)
    .eq('id', stageId)
    .single();

  if (stageError) throw stageError;
  if (!stageData) return null;

  const row: any = stageData;
  const job = row.production_jobs;
  const bp = row.blueprints;
  const blueprintId = bp?.id;

  const base: OperatorProcessStage = {
    id: row.id,
    stageName: row.stage_name,
    stageOrder: row.stage_order,
    stationTag: row.station_tag || '',
    estimatedDurationMinutes: row.estimated_duration_minutes || 0,
    operatorName: row.operator_name || '',
    status: row.status,
    jobId: job?.job_id || '',
    jobName: job?.name || '',
    productName: job?.product_name || '',
    blueprintId: blueprintId || null,
    blueprintName: bp?.name || null,
    guidelinesEnabled: bp?.guidelines_enabled || false,
    guidelinesContent: bp?.guidelines_content || null,
    checklistEnabled: bp?.checklist_enabled || false,
    checklistValidationTiming: bp?.checklist_validation_timing || null,
    quantityLoggingEnabled: bp?.quantity_logging_enabled || false,
    quantityUnitLabel: bp?.quantity_unit_label || null,
    quantityMinValue: bp?.quantity_min_value ?? null,
    quantityMaxValue: bp?.quantity_max_value ?? null,
    qcFormEnabled: bp?.qc_form_enabled || false,
    faultCategoriesEnabled: bp?.fault_categories_enabled || false,
    scheduledStartAt: row.scheduled_start_at || null,
    scheduledEndAt: row.scheduled_end_at || null,
  };

  let checklistItems: ChecklistItem[] = [];
  let qcQuestions: QCQuestion[] = [];
  let faultCategories: FaultCategory[] = [];
  let quantityMetrics: QuantityMetric[] = [];

  if (blueprintId) {
    const [checklistRes, qcRes, faultRes, metricsRes] = await Promise.all([
      supabase
        .from('blueprint_checklist_items')
        .select('id, item_text, sort_order, is_required')
        .eq('blueprint_id', blueprintId)
        .order('sort_order', { ascending: true }),
      supabase
        .from('blueprint_qc_questions')
        .select('id, question_text, response_type, numeric_min_value, numeric_max_value, numeric_tolerance, sort_order, is_required')
        .eq('blueprint_id', blueprintId)
        .order('sort_order', { ascending: true }),
      supabase
        .from('blueprint_fault_categories')
        .select('id, fault_name, severity, requires_photo, sort_order')
        .eq('blueprint_id', blueprintId)
        .order('sort_order', { ascending: true }),
      supabase
        .from('blueprint_quantity_metrics')
        .select('id, metric_name, unit_label, min_value, max_value, input_frequency, sort_order')
        .eq('blueprint_id', blueprintId)
        .order('sort_order', { ascending: true }),
    ]);

    if (checklistRes.data) {
      checklistItems = checklistRes.data.map((r: any) => ({
        id: r.id,
        itemText: r.item_text,
        sortOrder: r.sort_order,
        isRequired: r.is_required,
      }));
    }
    if (qcRes.data) {
      qcQuestions = qcRes.data.map((r: any) => ({
        id: r.id,
        questionText: r.question_text,
        responseType: r.response_type,
        numericMinValue: r.numeric_min_value ?? null,
        numericMaxValue: r.numeric_max_value ?? null,
        numericTolerance: r.numeric_tolerance ?? null,
        sortOrder: r.sort_order,
        isRequired: r.is_required,
      }));
    }
    if (faultRes.data) {
      faultCategories = faultRes.data.map((r: any) => ({
        id: r.id,
        faultName: r.fault_name,
        severity: r.severity,
        requiresPhoto: r.requires_photo,
        sortOrder: r.sort_order,
      }));
    }
    if (metricsRes.data) {
      quantityMetrics = metricsRes.data.map((r: any) => ({
        id: r.id,
        metricName: r.metric_name,
        unitLabel: r.unit_label,
        minValue: r.min_value ?? null,
        maxValue: r.max_value ?? null,
        inputFrequency: r.input_frequency,
        sortOrder: r.sort_order,
      }));
    }
  }

  return { ...base, checklistItems, qcQuestions, faultCategories, quantityMetrics };
}

// Update a stage's status (called by OperatorRuntime on start/pause/end)
export async function updateStageStatus(stageId: string, status: string): Promise<void> {
  // Always push to shared state bridge so Manager dashboard reflects change immediately
  const { updateStageStatus: updateSharedStage } = await import('../lib/sharedState');
  updateSharedStage(stageId, status as any);

  // Best-effort Supabase update (may fail for dynamic stages, that's fine)
  try {
    await supabase
      .from('job_process_stages')
      .update({ status })
      .eq('id', stageId);
  } catch {
    // Non-blocking — shared state is the source of truth for dynamic stages
  }
}
