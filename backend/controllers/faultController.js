const prisma = require('../prismaClient');

const LINE_SCOPE = (managerId) => ({
  job: { line: { managerId } },
});

async function getAll(req, res) {
  try {
    const faults = await prisma.faultLog.findMany({
      where: LINE_SCOPE(req.user.id),
      include: {
        job: {
          select: {
            id: true,
            jobId: true,
            name: true,
            line: { select: { id: true, lineCode: true, name: true } },
          },
        },
        operator: { select: { id: true, name: true } },
        stage: { select: { id: true, stageName: true } },
      },
      orderBy: { loggedAt: 'desc' },
    });

    return res.status(200).json({ faults });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load fault records', error: error.message });
  }
}

async function resolve(req, res) {
  const { id } = req.params;
  const { resolutionNotes } = req.body;

  try {
    // Confirm this fault actually belongs to one of this manager's lines
    // before letting them resolve it — otherwise any manager could resolve
    // any fault in the system just by guessing an id.
    const existing = await prisma.faultLog.findFirst({
      where: { id, ...LINE_SCOPE(req.user.id) },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Fault record not found' });
    }

    const fault = await prisma.faultLog.update({
      where: { id },
      data: {
        resolvedAt: new Date(),
        resolvedBy: req.user.id,
        resolutionNotes: resolutionNotes || null,
      },
    });

    return res.status(200).json({ fault });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to resolve fault', error: error.message });
  }
}

module.exports = { getAll, resolve };