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
    const [activeJobCount, unresolvedFaultCount] = await Promise.all([
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

    return res.status(200).json({ activeJobCount, unresolvedFaultCount });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load manager metrics', error: error.message });
  }
}

module.exports = {
  getLines,
  getMetrics,
};