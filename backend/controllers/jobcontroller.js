const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function generateJobDisplayId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `JOB-${timestamp}-${random}`;
}

async function createJob(req, res) {
  const {
    name,
    productName,
    targetQuantity,
    unit,
    notes,
    targetDate,
    lineId,
    scheduledStartAt,
    status, // 'DRAFT' | 'ACTIVE'
    stages, // [{ blueprintId, stageName, estimatedDurationMinutes, stationTag, operatorId }]
  } = req.body;

  if (!name || !Array.isArray(stages) || stages.length === 0) {
    return res.status(400).json({ message: 'Job name and at least one stage are required' });
  }
  if (status === 'ACTIVE' && stages.some((s) => !s.operatorId)) {
    return res.status(400).json({ message: 'Every stage must have an assigned operator before activation' });
  }

  const jobStatus = status === 'ACTIVE' ? 'ACTIVE' : 'DRAFT';
  const stageStatus = jobStatus === 'ACTIVE' ? 'AVAILABLE' : 'PENDING';

  const startTime = scheduledStartAt ? new Date(scheduledStartAt) : new Date();
  let cumulativeMinutes = 0;
  const stageRows = stages.map((s, idx) => {
    const durationMin = s.estimatedDurationMinutes || 0;
    const stageStart = new Date(startTime.getTime() + cumulativeMinutes * 60000);
    const stageEnd = new Date(stageStart.getTime() + durationMin * 60000);
    cumulativeMinutes += durationMin;
    return {
      blueprintId: s.blueprintId || null,
      stageOrder: idx,
      stageName: s.stageName,
      estimatedDurationMinutes: durationMin,
      stationTag: s.stationTag || null,
      operatorId: s.operatorId || null,
      status: stageStatus,
      scheduledStartAt: stageStart,
      scheduledEndAt: stageEnd,
    };
  });
  const scheduledEndAt = new Date(startTime.getTime() + cumulativeMinutes * 60000);

  let attempts = 0;
  while (attempts < 5) {
    attempts++;
    try {
      const job = await prisma.job.create({
        data: {
          jobId: generateJobDisplayId(),
          name,
          productName: productName || null,
          targetQuantity: targetQuantity || 0,
          unit: unit || 'Units',
          status: jobStatus,
          notes: notes || null,
          targetDate: targetDate ? new Date(targetDate) : null,
          lineId: lineId || null,
          scheduledStartAt: startTime,
          scheduledEndAt,
          startedAt: jobStatus === 'ACTIVE' ? new Date() : null,
          createdById: req.user.id, // ⚠️ confirm this matches the field your authenticateToken sets
          stages: { create: stageRows },
        },
        include: { stages: true },
      });
      return res.status(201).json(job);
    } catch (err) {
      if (err.code === 'P2002' && attempts < 5) continue; // jobId collision — regenerate and retry
      console.error(err);
      return res.status(500).json({ message: 'Failed to create job' });
    }
  }
}

module.exports = { createJob };