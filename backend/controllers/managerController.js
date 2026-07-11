const prisma = require('../prismaClient');

async function getLines(req, res) {
  try {
    const lines = await prisma.productionLine.findMany({
      where: { managerId: req.user.id },
      orderBy: { lineCode: 'asc' },
    });

    return res.status(200).json({ lines });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load assigned lines', error: error.message });
  }
}

async function getMetrics(req, res) {
  try {
    const [assignedLineCount, activeJobCount, unresolvedFaultCount] = await Promise.all([
      prisma.productionLine.count({
        where: { managerId: req.user.id },
      }),
      prisma.job.count({
        where: {
          status: 'ACTIVE',
          line: { managerId: req.user.id },
        },
      }),
      prisma.faultLog.count({
        where: {
          resolvedAt: null,
          job: { line: { managerId: req.user.id } },
        },
      }),
    ]);

    return res.status(200).json({ assignedLineCount, activeJobCount, unresolvedFaultCount });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load manager metrics', error: error.message });
  }
}

async function getActiveJobs(req, res) {
  try {
    const jobs = await prisma.job.findMany({
      where: {
        status: 'ACTIVE',
        line: { managerId: req.user.id },
      },
      include: {
        stages: {
          orderBy: { stageOrder: 'asc' },
          include: { operator: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const shaped = jobs.map((job) => ({
      id: job.id,
      jobId: job.jobId,
      name: job.name,
      productName: job.productName,
      stages: job.stages.map((stage) => ({
        id: stage.id,
        stageOrder: stage.stageOrder,
        stageName: stage.stageName,
        status: stage.status,
        stationTag: stage.stationTag,
        estimatedDurationMinutes: stage.estimatedDurationMinutes,
        operatorName: stage.operator?.name ?? null,
      })),
    }));

    return res.status(200).json({ jobs: shaped });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load active jobs', error: error.message });
  }
}

async function getAlerts(req, res) {
  try {
    const faults = await prisma.faultLog.findMany({
      where: {
        resolvedAt: null,
        job: { line: { managerId: req.user.id } },
      },
      include: {
        job: { select: { jobId: true, name: true } },
        operator: { select: { name: true } },
      },
      orderBy: { loggedAt: 'desc' },
    });

    const shaped = faults.map((fault) => ({
      id: fault.id,
      title: fault.title,
      description: fault.description,
      severity: fault.severity,
      jobId: fault.job.jobId,
      jobName: fault.job.name,
      operatorName: fault.operator?.name ?? null,
      loggedAt: fault.loggedAt,
    }));

    return res.status(200).json({ alerts: shaped });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load alerts', error: error.message });
  }
}

async function resolveFault(req, res) {
  try {
    const fault = await prisma.faultLog.findUnique({
      where: { id: req.params.id },
      include: { job: { include: { line: true } } },
    });

    if (!fault || fault.job.line?.managerId !== req.user.id) {
      return res.status(404).json({ message: 'Fault not found' });
    }

    const resolved = await prisma.faultLog.update({
      where: { id: req.params.id },
      data: {
        resolvedAt: new Date(),
        resolvedBy: req.user.name,
        resolutionNotes: req.body.resolutionNotes || null,
      },
    });

    return res.status(200).json({ id: resolved.id, resolvedAt: resolved.resolvedAt });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to resolve fault', error: error.message });
  }
}

async function getOperators(req, res) {
  try {
    const operators = await prisma.user.findMany({
      where: { role: 'OPERATOR', isActive: true },
      select: { id: true, name: true, identifier: true, phone: true },
      orderBy: { name: 'asc' },
    });
    res.json(operators);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch operators' });
  }
}

module.exports = {
  getLines,
  getMetrics,
  getActiveJobs,
  getAlerts,
  resolveFault,
  getOperators,
};