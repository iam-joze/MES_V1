const bcrypt = require('bcryptjs');

const prisma = require('../prismaClient');

const DEFAULT_MANAGER_PASSWORD = 'manager2024';

async function listManagers(req, res) {
  try {
    const managers = await prisma.user.findMany({
      where: { role: 'MANAGER' },
      select: {
        id: true,
        name: true,
        identifier: true,
        phone: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json(managers);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load manager accounts', error: error.message });
  }
}

async function createManager(req, res) {
  try {
    const { fullName, email, phone, lineId } = req.body;

    if (!fullName || !email || !phone) {
      return res.status(400).json({ message: 'fullName, email, and phone are required' });
    }

    const existing = await prisma.user.findUnique({ where: { identifier: email.trim().toLowerCase() } });
    if (existing) {
      return res.status(409).json({ message: 'A user with this email already exists' });
    }

    const credentialHash = await bcrypt.hash(DEFAULT_MANAGER_PASSWORD, 10);

    const manager = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: fullName.trim(),
          identifier: email.trim().toLowerCase(),
          phone: phone.trim(),
          credentialHash,
          role: 'MANAGER',
          isActive: true,
        },
      });

      if (lineId) {
        await tx.productionLine.update({
          where: { id: lineId },
          data: { managerId: created.id },
        });
      }

      return created;
    });

    return res.status(201).json({
      id: manager.id,
      name: manager.name,
      identifier: manager.identifier,
      phone: manager.phone,
      isActive: manager.isActive,
      createdAt: manager.createdAt,
      lastLoginAt: manager.lastLoginAt,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create manager account', error: error.message });
  }
}

async function deactivateManager(req, res) {
  try {
    const manager = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: req.params.id },
        data: { isActive: false },
      });
      await tx.productionLine.updateMany({
        where: { managerId: req.params.id },
        data: { managerId: null },
      });
      return updated;
    });
    return res.status(200).json({ id: manager.id, isActive: manager.isActive });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Manager account not found' });
    }
    return res.status(500).json({ message: 'Failed to deactivate manager account', error: error.message });
  }
}

async function activateManager(req, res) {
  try {
    const manager = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: true },
    });
    return res.status(200).json({ id: manager.id, isActive: manager.isActive });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Manager account not found' });
    }
    return res.status(500).json({ message: 'Failed to activate manager account', error: error.message });
  }
}

async function removeManager(req, res) {
  try {
    const manager = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!manager || manager.role !== 'MANAGER') {
      return res.status(404).json({ message: 'Manager account not found' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.productionLine.updateMany({
        where: { managerId: req.params.id },
        data: { managerId: null },
      });
      await tx.user.delete({ where: { id: req.params.id } });
    });

    return res.status(200).json({ id: req.params.id, deleted: true });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to remove manager account', error: error.message });
  }
}

module.exports = {
  listManagers,
  createManager,
  deactivateManager,
  activateManager,
  removeManager,
};
