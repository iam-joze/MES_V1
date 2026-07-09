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

module.exports = {
  getOverview,
};
