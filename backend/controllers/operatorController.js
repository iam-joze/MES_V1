const bcrypt = require('bcryptjs');
const prisma = require('../prismaClient');

async function getAll(req, res) {
  try {
    const operators = await prisma.user.findMany({
      where: { role: 'OPERATOR' },
      select: {
        id: true,
        name: true,
        identifier: true,
        phone: true,
        skills: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });

    return res.status(200).json({ operators });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load operators', error: error.message });
  }
}

async function create(req, res) {
  const { name, phone, pin, skills } = req.body;

  try {
    const credentialHash = await bcrypt.hash(pin, 10);

    const operator = await prisma.user.create({
      data: {
        name,
        identifier: phone,
        phone,
        credentialHash,
        role: 'OPERATOR',
        skills: skills || [],
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        identifier: true,
        phone: true,
        skills: true,
        isActive: true,
        createdAt: true,
      },
    });

    return res.status(201).json({ operator });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'A user with this phone number already exists' });
    }
    return res.status(500).json({ message: 'Failed to register operator', error: error.message });
  }
}

async function setActiveStatus(req, res) {
  const { id } = req.params;
  const { isActive } = req.body;

  try {
    const operator = await prisma.user.update({
      where: { id },
      data: { isActive: !!isActive },
      select: { id: true, name: true, isActive: true },
    });

    return res.status(200).json({ operator });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update operator status', error: error.message });
  }
}

async function update(req, res) {
  const { id } = req.params;
  const { skills, name } = req.body;

  try {
    const data = {};
    if (skills !== undefined) data.skills = Array.isArray(skills) ? skills : [];
    if (name !== undefined && name.trim()) data.name = name.trim();

    const operator = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, identifier: true, phone: true, skills: true, isActive: true, lastLoginAt: true, createdAt: true },
    });

    return res.status(200).json({ operator });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Operator not found' });
    }
    return res.status(500).json({ message: 'Failed to update operator', error: error.message });
  }
}

function generatePin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

async function resetPin(req, res) {
  const { id } = req.params;

  try {
    const pin = generatePin();
    const credentialHash = await bcrypt.hash(pin, 10);

    const operator = await prisma.user.update({
      where: { id },
      data: { credentialHash },
      select: { id: true, name: true },
    });

    return res.status(200).json({ id: operator.id, name: operator.name, pin });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Operator not found' });
    }
    return res.status(500).json({ message: 'Failed to reset PIN', error: error.message });
  }
}

async function remove(req, res) {
  const { id } = req.params;

  try {
    const operator = await prisma.user.findUnique({ where: { id } });
    if (!operator || operator.role !== 'OPERATOR') {
      return res.status(404).json({ message: 'Operator not found' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.jobStage.updateMany({ where: { operatorId: id }, data: { operatorId: null } });
      await tx.processSession.updateMany({ where: { operatorId: id }, data: { operatorId: null } });
      await tx.faultLog.updateMany({ where: { operatorId: id }, data: { operatorId: null } });
      await tx.user.delete({ where: { id } });
    });

    return res.status(200).json({ id, deleted: true });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to remove operator', error: error.message });
  }
}

module.exports = { getAll, create, setActiveStatus, update, remove, resetPin };