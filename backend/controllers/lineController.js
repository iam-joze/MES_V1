const prisma = require('../prismaClient');

async function listLines(req, res) {
  try {
    const lines = await prisma.productionLine.findMany({
      include: {
        manager: {
          select: { id: true, name: true, identifier: true },
        },
      },
      orderBy: { lineCode: 'asc' },
    });
    return res.status(200).json(lines);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load production lines', error: error.message });
  }
}

async function createLine(req, res) {
  try {
    const { lineCode, name, description, targetProduct, targetQuantity, unit } = req.body;

    if (!lineCode || !name) {
      return res.status(400).json({ message: 'lineCode and name are required' });
    }

    const line = await prisma.productionLine.create({
      data: {
        lineCode: lineCode.trim(),
        name: name.trim(),
        description: description?.trim() || null,
        targetProduct: targetProduct?.trim() || null,
        targetQuantity: targetQuantity ? Number(targetQuantity) : null,
        unit: unit || null,
        isActive: true,
      },
    });

    return res.status(201).json(line);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'A production line with this code already exists' });
    }
    return res.status(500).json({ message: 'Failed to create production line', error: error.message });
  }
}

async function assignManager(req, res) {
  try {
    const { managerId } = req.body;

    if (managerId) {
      const manager = await prisma.user.findUnique({ where: { id: managerId } });
      if (!manager || manager.role !== 'MANAGER' || !manager.isActive) {
        return res.status(400).json({ message: 'managerId must reference an active manager account' });
      }
    }

    const line = await prisma.productionLine.update({
      where: { id: req.params.id },
      data: { managerId: managerId || null },
      include: { manager: { select: { id: true, name: true, identifier: true } } },
    });

    return res.status(200).json(line);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to assign manager', error: error.message });
  }
}

module.exports = {
  listLines,
  createLine,
  assignManager,
};
