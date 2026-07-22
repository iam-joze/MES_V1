const prisma = require('../prismaClient');
const { emitToManager, emitToExecutives } = require('../socket');

async function getJobManagerId(jobId) {
  const job = await prisma.job.findUnique({ where: { id: jobId }, select: { line: { select: { managerId: true } } } });
  return job?.line?.managerId ?? null;
}

function shapeStageForList(stage) {
  return {
    id: stage.id,
    jobId: stage.job.jobId,
    jobDbId: stage.job.id,
    jobName: stage.job.name,
    jobStatus: stage.job.status,
    productName: stage.job.productName,
    stageName: stage.stageName,
    stationTag: stage.stationTag,
    estimatedDurationMinutes: stage.estimatedDurationMinutes,
    status: stage.status,
    scheduledStartAt: stage.scheduledStartAt,
  };
}

async function getAssignments(req, res) {
  try {
    const stages = await prisma.jobStage.findMany({
      where: {
        operatorId: req.user.id,
        status: { in: ['AVAILABLE', 'RUNNING', 'PAUSED'] },
      },
      include: { job: { select: { id: true, jobId: true, name: true, status: true, productName: true } } },
      orderBy: { scheduledStartAt: 'asc' },
    });

    const resolvedFaults = await prisma.faultLog.findMany({
      where: { operatorId: req.user.id, resolvedAt: { not: null }, resolutionNotes: { not: null } },
      include: { job: { select: { jobId: true, name: true } }, stage: { select: { stageName: true } } },
      orderBy: { resolvedAt: 'desc' },
      take: 10,
    });
    const resolverIds = [...new Set(resolvedFaults.map((f) => f.resolvedBy).filter(Boolean))];
    const resolvers = resolverIds.length
      ? await prisma.user.findMany({ where: { id: { in: resolverIds } }, select: { id: true, name: true } })
      : [];
    const resolverNameById = Object.fromEntries(resolvers.map((r) => [r.id, r.name]));

    const feedback = resolvedFaults.map((f) => ({
      id: f.id,
      faultTitle: f.title,
      jobId: f.job?.jobId ?? null,
      jobName: f.job?.name ?? null,
      stageName: f.stage?.stageName ?? null,
      resolvedByName: f.resolvedBy ? resolverNameById[f.resolvedBy] ?? 'Manager' : 'Manager',
      resolutionNotes: f.resolutionNotes,
      resolvedAt: f.resolvedAt,
    }));

    return res.status(200).json({ stages: stages.map(shapeStageForList), feedback });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load assignments', error: error.message });
  }
}

async function getStageDetail(req, res) {
  try {
    const stage = await prisma.jobStage.findFirst({
      where: { id: req.params.id, operatorId: req.user.id },
      include: {
        job: { select: { id: true, jobId: true, name: true, status: true, productName: true } },
        blueprint: {
          include: {
            checklistItems: { orderBy: { sortOrder: 'asc' } },
            quantities: { orderBy: { sortOrder: 'asc' } },
            qcQuestions: { orderBy: { sortOrder: 'asc' } },
            faultCategories: { orderBy: { sortOrder: 'asc' } },
          },
        },
        sessions: { where: { endedAt: null }, orderBy: { startedAt: 'desc' }, take: 1 },
        qcResponses: true,
      },
    });

    if (!stage) return res.status(404).json({ message: 'Stage not found' });

    const bp = stage.blueprint;
    return res.status(200).json({
      id: stage.id,
      jobId: stage.job.jobId,
      jobDbId: stage.job.id,
      jobName: stage.job.name,
      jobStatus: stage.job.status,
      productName: stage.job.productName,
      stageName: stage.stageName,
      instruction: stage.instruction,
      stationTag: stage.stationTag,
      status: stage.status,
      requiresQc: stage.requiresQc,
      scheduledStartAt: stage.scheduledStartAt,
      actualStartedAt: stage.actualStartedAt,
      openSessionStartedAt: stage.sessions[0]?.startedAt ?? null,
      guidelinesEnabled: bp?.guidelinesEnabled ?? false,
      guidelinesContent: bp?.guidelinesContent ?? null,
      checklistEnabled: bp?.checklistEnabled ?? false,
      checklistValidationTiming: bp?.checklistValidationTiming ?? null,
      checklistItems: bp?.checklistItems ?? [],
      quantityLoggingEnabled: bp?.quantityLoggingEnabled ?? false,
      quantityMetrics: bp?.quantities ?? [],
      qcFormEnabled: bp?.qcFormEnabled ?? false,
      qcQuestions: bp?.qcQuestions ?? [],
      qcResponses: stage.qcResponses,
      faultCategoriesEnabled: bp?.faultCategoriesEnabled ?? false,
      faultCategories: bp?.faultCategories ?? [],
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load stage', error: error.message });
  }
}

async function ensureOwnedStage(stageId, operatorId) {
  return prisma.jobStage.findFirst({ where: { id: stageId, operatorId } });
}

async function startStage(req, res) {
  try {
    const stage = await ensureOwnedStage(req.params.id, req.user.id);
    if (!stage) return res.status(404).json({ message: 'Stage not found' });
    if (!['AVAILABLE', 'PAUSED'].includes(stage.status)) {
      return res.status(409).json({ message: `Cannot start a stage in status ${stage.status}` });
    }

    const now = new Date();
    await prisma.$transaction(async (tx) => {
      await tx.jobStage.update({
        where: { id: stage.id },
        data: { status: 'RUNNING', actualStartedAt: stage.actualStartedAt || now },
      });
      await tx.processSession.create({
        data: { stageId: stage.id, operatorId: req.user.id, startedAt: now },
      });
      await tx.job.updateMany({
        where: { id: stage.jobId, startedAt: null },
        data: { startedAt: now },
      });
    });

    const managerId = await getJobManagerId(stage.jobId);
    emitToManager(managerId, 'stage:updated', { stageId: stage.id, jobId: stage.jobId, status: 'RUNNING' });

    return res.status(200).json({ status: 'RUNNING' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to start stage', error: error.message });
  }
}

async function pauseStage(req, res) {
  const { reason } = req.body;
  if (!reason) return res.status(400).json({ message: 'reason is required' });

  try {
    const stage = await ensureOwnedStage(req.params.id, req.user.id);
    if (!stage) return res.status(404).json({ message: 'Stage not found' });
    if (stage.status !== 'RUNNING') {
      return res.status(409).json({ message: 'Stage is not running' });
    }

    const now = new Date();
    await prisma.$transaction(async (tx) => {
      await tx.jobStage.update({ where: { id: stage.id }, data: { status: 'PAUSED' } });
      await tx.processSession.updateMany({
        where: { stageId: stage.id, endedAt: null },
        data: { endedAt: now },
      });
      await tx.jobDowntimeLog.create({
        data: { jobId: stage.jobId, stageId: stage.id, reason, startedAt: now },
      });
    });

    const managerId = await getJobManagerId(stage.jobId);
    emitToManager(managerId, 'stage:updated', { stageId: stage.id, jobId: stage.jobId, status: 'PAUSED', reason });

    return res.status(200).json({ status: 'PAUSED' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to pause stage', error: error.message });
  }
}

async function resumeStage(req, res) {
  try {
    const stage = await ensureOwnedStage(req.params.id, req.user.id);
    if (!stage) return res.status(404).json({ message: 'Stage not found' });

    const job = await prisma.job.findUnique({ where: { id: stage.jobId }, select: { status: true } });
    if (job?.status === 'PAUSED') {
      return res.status(403).json({
        message: 'This process was paused by a manager (Emergency Stop). Resuming requires manager authorization.',
      });
    }
    if (stage.status !== 'PAUSED') {
      return res.status(409).json({ message: 'Stage is not paused' });
    }

    const now = new Date();
    await prisma.$transaction(async (tx) => {
      await tx.jobStage.update({ where: { id: stage.id }, data: { status: 'RUNNING' } });
      await tx.processSession.create({
        data: { stageId: stage.id, operatorId: req.user.id, startedAt: now },
      });
      const openDowntime = await tx.jobDowntimeLog.findFirst({
        where: { stageId: stage.id, endedAt: null },
        orderBy: { startedAt: 'desc' },
      });
      if (openDowntime) {
        await tx.jobDowntimeLog.update({ where: { id: openDowntime.id }, data: { endedAt: now } });
      }
    });

    const managerId = await getJobManagerId(stage.jobId);
    emitToManager(managerId, 'stage:updated', { stageId: stage.id, jobId: stage.jobId, status: 'RUNNING' });

    return res.status(200).json({ status: 'RUNNING' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to resume stage', error: error.message });
  }
}

async function completeStage(req, res) {
  try {
    const stage = await ensureOwnedStage(req.params.id, req.user.id);
    if (!stage) return res.status(404).json({ message: 'Stage not found' });
    if (!['RUNNING', 'PAUSED'].includes(stage.status)) {
      return res.status(409).json({ message: `Cannot complete a stage in status ${stage.status}` });
    }

    const now = new Date();
    let jobCompleted = false;
    await prisma.$transaction(async (tx) => {
      await tx.jobStage.update({
        where: { id: stage.id },
        data: { status: 'COMPLETED', actualEndedAt: now },
      });
      await tx.processSession.updateMany({
        where: { stageId: stage.id, endedAt: null },
        data: { endedAt: now },
      });
      const openDowntime = await tx.jobDowntimeLog.findFirst({ where: { stageId: stage.id, endedAt: null } });
      if (openDowntime) {
        await tx.jobDowntimeLog.update({ where: { id: openDowntime.id }, data: { endedAt: now } });
      }

      const remaining = await tx.jobStage.count({
        where: { jobId: stage.jobId, status: { not: 'COMPLETED' }, id: { not: stage.id } },
      });
      if (remaining === 0) {
        await tx.job.update({ where: { id: stage.jobId }, data: { status: 'COMPLETED', completedAt: now } });
        jobCompleted = true;
      }
    });

    const managerId = await getJobManagerId(stage.jobId);
    emitToManager(managerId, 'stage:updated', { stageId: stage.id, jobId: stage.jobId, status: 'COMPLETED', jobCompleted });

    return res.status(200).json({ status: 'COMPLETED', jobCompleted });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to complete stage', error: error.message });
  }
}

async function getQuantityLogs(req, res) {
  try {
    const stage = await ensureOwnedStage(req.params.id, req.user.id);
    if (!stage) return res.status(404).json({ message: 'Stage not found' });

    const sessions = await prisma.processSession.findMany({
      where: { stageId: stage.id },
      include: { batches: { orderBy: { batchNumber: 'asc' } } },
      orderBy: { startedAt: 'asc' },
    });
    const batches = sessions.flatMap((s) => s.batches);
    return res.status(200).json({ batches });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load quantity logs', error: error.message });
  }
}

async function logQuantity(req, res) {
  const { entries, notes } = req.body;
  if (!Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ message: 'entries must be a non-empty array' });
  }

  try {
    const stage = await ensureOwnedStage(req.params.id, req.user.id);
    if (!stage) return res.status(404).json({ message: 'Stage not found' });

    let session = await prisma.processSession.findFirst({
      where: { stageId: stage.id, endedAt: null },
      orderBy: { startedAt: 'desc' },
    });
    if (!session) {
      session = await prisma.processSession.create({
        data: { stageId: stage.id, operatorId: req.user.id },
      });
    }

    const lastBatch = await prisma.batchEntry.findFirst({
      where: { sessionId: session.id },
      orderBy: { batchNumber: 'desc' },
    });
    const nextBatchNumber = (lastBatch?.batchNumber ?? 0) + 1;

    const quantityData = {};
    entries.forEach((e) => {
      quantityData[e.metricName] = e.value;
    });

    const batch = await prisma.batchEntry.create({
      data: {
        sessionId: session.id,
        batchNumber: nextBatchNumber,
        quantityData,
        notes: notes || null,
      },
    });

    const managerId = await getJobManagerId(stage.jobId);
    emitToManager(managerId, 'batch:logged', { stageId: stage.id, jobId: stage.jobId, batchNumber: nextBatchNumber, quantityData });

    return res.status(201).json(batch);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to log quantity', error: error.message });
  }
}

async function submitQc(req, res) {
  const { responses } = req.body;
  if (!Array.isArray(responses) || responses.length === 0) {
    return res.status(400).json({ message: 'responses must be a non-empty array' });
  }

  try {
    const stage = await ensureOwnedStage(req.params.id, req.user.id);
    if (!stage) return res.status(404).json({ message: 'Stage not found' });

    const results = await prisma.$transaction(
      responses.map((r) =>
        prisma.qcResponse.upsert({
          where: { stageId_questionId: { stageId: stage.id, questionId: r.questionId } },
          update: { responseText: r.responseText ?? null, passed: r.passed ?? null },
          create: {
            stageId: stage.id,
            questionId: r.questionId,
            responseText: r.responseText ?? null,
            passed: r.passed ?? null,
          },
        })
      )
    );

    return res.status(200).json({ responses: results });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to submit QC responses', error: error.message });
  }
}

async function reportFault(req, res) {
  const { faultName, severity, notes } = req.body;
  if (!faultName || !severity) {
    return res.status(400).json({ message: 'faultName and severity are required' });
  }
  if (!['CRITICAL', 'MINOR'].includes(severity)) {
    return res.status(400).json({ message: 'severity must be CRITICAL or MINOR' });
  }

  try {
    const stage = await ensureOwnedStage(req.params.id, req.user.id);
    if (!stage) return res.status(404).json({ message: 'Stage not found' });

    const fault = await prisma.faultLog.create({
      data: {
        jobId: stage.jobId,
        stageId: stage.id,
        operatorId: req.user.id,
        title: faultName,
        category: faultName,
        description: notes || null,
        severity,
      },
    });

    const managerId = await getJobManagerId(stage.jobId);
    const payload = { faultId: fault.id, stageId: stage.id, jobId: stage.jobId, title: faultName, severity };
    emitToManager(managerId, 'fault:reported', payload);
    if (severity === 'CRITICAL') emitToExecutives('fault:reported', payload);

    return res.status(201).json(fault);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to report fault', error: error.message });
  }
}

module.exports = {
  getAssignments,
  getStageDetail,
  startStage,
  pauseStage,
  resumeStage,
  completeStage,
  getQuantityLogs,
  logQuantity,
  submitQc,
  reportFault,
};
