const prisma = require('../prismaClient');

function generateJobDisplayId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `JOB-${timestamp}-${random}`;
}

async function receiveWorkOrder(req, res) {
  const {
    work_order_id: workOrderId,
    batch_number: batchNumber,
    product,
    target_quantity: targetQuantity,
    unit,
    production_line: productionLine,
    scheduled_date: scheduledDate,
    due_date: dueDate,
    material_requirements: materialRequirements,
    work_instructions: workInstructions,
  } = req.body;

  if (!workOrderId || !batchNumber || !product || !targetQuantity || !unit) {
    return res.status(400).json({
      message: 'work_order_id, batch_number, product, target_quantity, and unit are required',
    });
  }
  if (!Array.isArray(workInstructions) || workInstructions.length === 0) {
    return res.status(400).json({ message: 'work_instructions must be a non-empty array' });
  }

  try {
    const existing = await prisma.job.findUnique({ where: { externalWorkOrderId: workOrderId } });
    if (existing) {
      return res.status(409).json({ message: 'A job for this work_order_id already exists', jobId: existing.jobId });
    }

    let line = null;
    if (productionLine) {
      line = await prisma.productionLine.findFirst({
        where: {
          OR: [
            { name: { equals: productionLine, mode: 'insensitive' } },
            { lineCode: { equals: productionLine, mode: 'insensitive' } },
          ],
        },
      });
    }

    const stageRows = [...workInstructions]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((step) => ({
        stageOrder: step.order ?? 0,
        stageName: step.station || `Step ${step.order}`,
        stationTag: step.station || null,
        instruction: step.instruction || null,
        requiresQc: !!step.requires_qc,
        estimatedDurationMinutes: step.expected_duration_min || 0,
        status: 'PENDING',
      }));

    const materialRows = Array.isArray(materialRequirements)
      ? materialRequirements.map((m, i) => ({
          name: m.name,
          qtyPerUnit: Number(m.qty_per_unit) || 0,
          unit: m.unit,
          totalRequired: Number(m.total_required) || 0,
          wastagePct: m.wastage_pct != null ? Number(m.wastage_pct) : null,
          sortOrder: i,
        }))
      : [];

    let attempts = 0;
    let job;
    while (attempts < 5) {
      attempts++;
      try {
        job = await prisma.job.create({
          data: {
            jobId: generateJobDisplayId(),
            name: `${product} — ${batchNumber}`,
            productName: product,
            targetQuantity: Number(targetQuantity),
            unit,
            status: 'DRAFT',
            source: 'ERP',
            externalWorkOrderId: workOrderId,
            batchNumber,
            targetDate: dueDate ? new Date(dueDate) : null,
            scheduledStartAt: scheduledDate ? new Date(scheduledDate) : null,
            lineId: line?.id || null,
            createdById: line?.managerId || null,
            stages: { create: stageRows },
            materialRequirements: { create: materialRows },
          },
          include: { stages: true, materialRequirements: true },
        });
        break;
      } catch (err) {
        if (err.code === 'P2002' && attempts < 5) continue;
        throw err;
      }
    }

    return res.status(201).json({
      message: 'Work order received',
      jobId: job.jobId,
      id: job.id,
      status: job.status,
      lineMatched: !!line,
      lineName: line?.name || null,
      stageCount: job.stages.length,
      materialCount: job.materialRequirements.length,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to receive work order', error: error.message });
  }
}

async function exportProductionData(req, res) {
  const { id } = req.params;

  try {
    const job = await prisma.job.findFirst({
      where: { OR: [{ id }, { externalWorkOrderId: id }] },
      include: {
        materialRequirements: true,
        downtimeLogs: true,
        scrapLogs: true,
        stages: {
          include: {
            faults: true,
            qcResponses: { include: { question: true } },
          },
        },
      },
    });

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    if (job.status !== 'COMPLETED') {
      return res.status(409).json({ message: `Job is not yet complete (current status: ${job.status})` });
    }

    // Real scrap total — ScrapLog rows are logged by managers per job/stage.
    const actualScrap = job.scrapLogs.reduce((sum, s) => sum + s.quantity, 0);

    // Real QC results — every question an operator answered, across every
    // stage of the job, joined back to its blueprint question text.
    const qcResults = job.stages.flatMap((stage) =>
      stage.qcResponses.map((r) => {
        let passFail = null;
        if (r.passed !== null && r.passed !== undefined) {
          passFail = r.passed ? 'pass' : 'fail';
        } else if (
          r.question.responseType === 'numeric' &&
          r.question.numericMinValue != null &&
          r.question.numericMaxValue != null &&
          r.responseText
        ) {
          const value = Number(r.responseText);
          passFail = value >= r.question.numericMinValue && value <= r.question.numericMaxValue ? 'pass' : 'fail';
        }
        return {
          step: r.question.questionText,
          'pass/fail': passFail,
          notes: r.responseText ?? null,
        };
      })
    );

    return res.status(200).json({
      work_order_id: job.externalWorkOrderId,
      job_id: job.jobId,
      batch_number: job.batchNumber,
      // No process anywhere sets a final "units produced" figure for a job —
      // operators log quantities against blueprint-defined metrics (their
      // names vary per blueprint, e.g. "Units Filled" vs "Juice/Pulp Output")
      // and nothing in the schema flags which one represents finished
      // output. Reporting 0 here rather than guessing at a metric name.
      actual_produced: job.actualProducedQty ?? 0,
      actual_scrap: actualScrap,
      // qty_used and lot_number still can't be populated for real: there's
      // no link from a JobMaterialRequirement row to the quantity metric(s)
      // an operator actually logs, and Lot/Batch Traceability (raw-material
      // lot capture) hasn't been built. name/unit are the real planned
      // requirement; the rest is honestly null rather than estimated.
      materials_consumed: job.materialRequirements.map((m) => ({
        name: m.name,
        qty_used: null,
        unit: m.unit,
        lot_number: null,
      })),
      downtime_log: job.downtimeLogs.map((d) => ({
        start: d.startedAt,
        end: d.endedAt,
        reason: d.reason,
      })),
      qc_results: qcResults,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to export production data', error: error.message });
  }
}

module.exports = { receiveWorkOrder, exportProductionData };
