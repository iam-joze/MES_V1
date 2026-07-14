const prisma = require('../prismaClient');

async function getOverview(req, res) {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [activeLineCount, activeManagerCount, unassignedLines, criticalFaults, monthlyJobs] =
      await Promise.all([
        prisma.productionLine.count({ where: { isActive: true } }),
        prisma.user.count({ where: { role: 'MANAGER', isActive: true } }),
        prisma.productionLine.findMany({
          where: { managerId: null },
          select: { id: true, lineCode: true, name: true, targetProduct: true },
          orderBy: { lineCode: 'asc' },
        }),
        prisma.faultLog.findMany({
          where: { severity: 'CRITICAL', resolvedAt: null },
          orderBy: { loggedAt: 'desc' },
          take: 5,
          include: { job: { include: { line: true } } },
        }),
        prisma.job.findMany({
          where: { createdAt: { gte: monthStart, lt: monthEnd } },
          select: { targetQuantity: true, status: true },
        }),
      ]);

    const totalTarget = monthlyJobs.reduce((sum, job) => sum + job.targetQuantity, 0);
    const completedTarget = monthlyJobs
      .filter((job) => job.status === 'COMPLETED')
      .reduce((sum, job) => sum + job.targetQuantity, 0);
    const monthlyVolumeTargetPct = totalTarget > 0 ? Math.round((completedTarget / totalTarget) * 100) : 0;

    return res.status(200).json({
      activeLineCount,
      activeManagerCount,
      monthlyVolumeTargetPct,
      unassignedLines,
      criticalAlerts: criticalFaults.map((fault) => ({
        id: fault.id,
        title: fault.title,
        line: fault.description || fault.job?.line?.name || fault.job?.name || 'Unknown',
        loggedAt: fault.loggedAt,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load executive overview', error: error.message });
  }
}

async function getJobs(req, res) {
  try {
    const jobs = await prisma.job.findMany({
      include: {
        line: {
          select: {
            id: true,
            lineCode: true,
            name: true,
            manager: { select: { id: true, name: true } },
          },
        },
        stages: {
          orderBy: { stageOrder: 'asc' },
          include: { operator: { select: { name: true } } },
        },
        faults: { where: { resolvedAt: null }, select: { id: true, severity: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const shaped = jobs.map((job) => ({
      id: job.id,
      jobId: job.jobId,
      name: job.name,
      productName: job.productName,
      targetQuantity: job.targetQuantity,
      unit: job.unit,
      status: job.status,
      scheduledStartAt: job.scheduledStartAt,
      scheduledEndAt: job.scheduledEndAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      createdAt: job.createdAt,
      line: job.line
        ? {
            id: job.line.id,
            lineCode: job.line.lineCode,
            name: job.line.name,
            managerName: job.line.manager?.name ?? null,
          }
        : null,
      stages: job.stages.map((s) => ({
        id: s.id,
        stageOrder: s.stageOrder,
        stageName: s.stageName,
        status: s.status,
        stationTag: s.stationTag,
        estimatedDurationMinutes: s.estimatedDurationMinutes,
        operatorName: s.operator?.name ?? null,
      })),
      openFaultCount: job.faults.length,
      criticalFaultCount: job.faults.filter((f) => f.severity === 'CRITICAL').length,
    }));

    return res.status(200).json({ jobs: shaped });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load jobs', error: error.message });
  }
}

async function getAnalytics(req, res) {
  try {
    const now = new Date();
    const defaultStart = new Date(now);
    defaultStart.setDate(defaultStart.getDate() - 30);

    const startDate = req.query.startDate ? new Date(req.query.startDate) : defaultStart;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : now;
    const endDateInclusive = new Date(endDate);
    endDateInclusive.setHours(23, 59, 59, 999);
    const dateRange = { gte: startDate, lte: endDateInclusive };

    const [jobs, faults, downtimeLogs, scrapLogs, stagesForActivity] = await Promise.all([
      prisma.job.findMany({
        where: { createdAt: dateRange },
        include: {
          line: { select: { name: true, lineCode: true } },
          stages: {
            orderBy: { stageOrder: 'asc' },
            include: { operator: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.faultLog.findMany({
        where: { loggedAt: dateRange },
        include: {
          job: { select: { jobId: true, name: true, line: { select: { name: true } } } },
          operator: { select: { id: true, name: true } },
        },
        orderBy: { loggedAt: 'desc' },
      }),
      prisma.jobDowntimeLog.findMany({
        where: { startedAt: dateRange },
        include: { job: { select: { jobId: true, name: true, line: { select: { name: true } } } } },
        orderBy: { startedAt: 'desc' },
      }),
      prisma.scrapLog.findMany({
        where: { loggedAt: dateRange },
        include: {
          job: { select: { jobId: true, name: true, productName: true, line: { select: { name: true } } } },
          stage: { select: { stageName: true } },
        },
        orderBy: { loggedAt: 'desc' },
      }),
      prisma.jobStage.findMany({
        where: { job: { createdAt: dateRange }, operatorId: { not: null } },
        select: {
          status: true,
          estimatedDurationMinutes: true,
          actualStartedAt: true,
          actualEndedAt: true,
          operator: { select: { id: true, name: true } },
        },
      }),
    ]);

    const jobHistory = jobs.map((job) => ({
      id: job.id,
      jobId: job.jobId,
      name: job.name,
      productName: job.productName,
      lineName: job.line?.name ?? 'Unassigned',
      targetQuantity: job.targetQuantity,
      actualProducedQty: job.actualProducedQty,
      unit: job.unit,
      status: job.status,
      scheduledStartAt: job.scheduledStartAt,
      completedAt: job.completedAt,
      stages: job.stages.map((s) => {
        const actualDurationMinutes =
          s.actualStartedAt && s.actualEndedAt
            ? Math.round((new Date(s.actualEndedAt).getTime() - new Date(s.actualStartedAt).getTime()) / 60000)
            : null;
        return {
          id: s.id,
          stageOrder: s.stageOrder,
          stageName: s.stageName,
          status: s.status,
          estimatedDurationMinutes: s.estimatedDurationMinutes,
          actualDurationMinutes,
          operatorName: s.operator?.name ?? null,
        };
      }),
    }));

    const faultRecords = faults.map((f) => ({
      id: f.id,
      title: f.title,
      severity: f.severity,
      category: f.category,
      loggedAt: f.loggedAt,
      resolvedAt: f.resolvedAt,
      jobId: f.job?.jobId ?? null,
      jobName: f.job?.name ?? null,
      lineName: f.job?.line?.name ?? null,
      operatorName: f.operator?.name ?? null,
    }));

    const downtimeRecords = downtimeLogs.map((d) => ({
      id: d.id,
      reason: d.reason,
      startedAt: d.startedAt,
      endedAt: d.endedAt,
      durationMinutes: d.endedAt
        ? Math.round((new Date(d.endedAt).getTime() - new Date(d.startedAt).getTime()) / 60000)
        : null,
      jobId: d.job?.jobId ?? null,
      jobName: d.job?.name ?? null,
      lineName: d.job?.line?.name ?? null,
    }));

    const scrapRecords = scrapLogs.map((s) => ({
      id: s.id,
      quantity: s.quantity,
      unit: s.unit,
      wasteType: s.wasteType,
      notes: s.notes,
      loggedAt: s.loggedAt,
      jobId: s.job?.jobId ?? null,
      jobName: s.job?.name ?? null,
      productName: s.job?.productName ?? null,
      lineName: s.job?.line?.name ?? null,
      processName: s.stage?.stageName ?? null,
    }));

    // Operator activity is intentionally descriptive only — no scores, ranks,
    // or leaderboards, matching the SRS's explicit prohibition on evaluative
    // fields for this view.
    const byOperator = {};
    stagesForActivity.forEach((s) => {
      if (!s.operator) return;
      const key = s.operator.id;
      if (!byOperator[key]) {
        byOperator[key] = {
          operatorName: s.operator.name,
          tasksAssigned: 0,
          tasksCompleted: 0,
          totalActualMinutes: 0,
          completedWithDuration: 0,
        };
      }
      byOperator[key].tasksAssigned += 1;
      if (s.status === 'COMPLETED') byOperator[key].tasksCompleted += 1;
      if (s.actualStartedAt && s.actualEndedAt) {
        byOperator[key].totalActualMinutes += Math.round(
          (new Date(s.actualEndedAt).getTime() - new Date(s.actualStartedAt).getTime()) / 60000
        );
        byOperator[key].completedWithDuration += 1;
      }
    });

    const faultsByOperatorId = {};
    faults.forEach((f) => {
      if (!f.operator) return;
      faultsByOperatorId[f.operator.id] = (faultsByOperatorId[f.operator.id] || 0) + 1;
    });

    const operatorActivity = Object.entries(byOperator).map(([operatorId, row]) => ({
      operatorName: row.operatorName,
      tasksAssigned: row.tasksAssigned,
      tasksCompleted: row.tasksCompleted,
      avgActualDurationMinutes:
        row.completedWithDuration > 0 ? Math.round(row.totalActualMinutes / row.completedWithDuration) : null,
      faultsLogged: faultsByOperatorId[operatorId] || 0,
    }));

    return res.status(200).json({
      range: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
      jobHistory,
      faultRecords,
      downtimeRecords,
      scrapRecords,
      operatorActivity,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load analytics', error: error.message });
  }
}

module.exports = {
  getOverview,
  getJobs,
  getAnalytics,
};
