const prisma = require('../prismaClient');

const ACTIVE_STAGE_STATUSES = ['PENDING', 'AVAILABLE', 'RUNNING'];

async function pauseJobWithFault(tx, job, reason, notes, managerId) {
  await tx.job.update({
    where: { id: job.id },
    data: { status: 'PAUSED' },
  });

  await tx.jobStage.updateMany({
    where: { jobId: job.id, status: { in: ACTIVE_STAGE_STATUSES } },
    data: { status: 'PAUSED' },
  });

  await tx.faultLog.create({
    data: {
      jobId: job.id,
      operatorId: managerId,
      title: reason,
      description: notes || null,
      severity: 'CRITICAL',
      category: 'emergency_stop',
    },
  });
}

async function getActiveJobs(req, res) {
  try {
    const jobs = await prisma.job.findMany({
      where: {
        status: 'ACTIVE',
        line: { managerId: req.user.id },
      },
      select: {
        id: true,
        jobId: true,
        name: true,
        line: { select: { lineCode: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });

    return res.status(200).json({ jobs });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load active jobs', error: error.message });
  }
}

async function triggerStop(req, res) {
  const { scope, jobId, reason, notes } = req.body;

  if (!reason) {
    return res.status(400).json({ message: 'A reason is required' });
  }

  try {
    if (scope === 'specific_job') {
      const job = await prisma.job.findFirst({
        where: { id: jobId, status: 'ACTIVE', line: { managerId: req.user.id } },
      });

      if (!job) {
        return res.status(404).json({ message: 'Active job not found on your lines' });
      }

      await prisma.$transaction((tx) => pauseJobWithFault(tx, job, reason, notes, req.user.id));

      return res.status(200).json({ message: 'Job stopped', stoppedCount: 1 });
    }

    if (scope === 'facility_wide') {
      const jobs = await prisma.job.findMany({
        where: { status: 'ACTIVE', line: { managerId: req.user.id } },
      });

      if (jobs.length === 0) {
        return res.status(200).json({ message: 'No active jobs to stop', stoppedCount: 0 });
      }

      await prisma.$transaction(async (tx) => {
        for (const job of jobs) {
          await pauseJobWithFault(tx, job, reason, notes, req.user.id);
        }
      });

      return res.status(200).json({ message: 'All active jobs stopped', stoppedCount: jobs.length });
    }

    return res.status(400).json({ message: 'Invalid scope' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to trigger emergency stop', error: error.message });
  }
}

module.exports = { getActiveJobs, triggerStop };