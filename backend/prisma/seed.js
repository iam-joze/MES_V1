const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function upsertUser({ name, identifier, password, role, phone }) {
  const credentialHash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { identifier },
    update: { name, credentialHash, role, phone, isActive: true },
    create: { name, identifier, credentialHash, role, phone, isActive: true },
  });
}

async function upsertLine({ lineCode, name, description, targetProduct, targetQuantity, unit, isActive, managerId }) {
  return prisma.productionLine.upsert({
    where: { lineCode },
    update: { name, description, targetProduct, targetQuantity, unit, isActive, managerId },
    create: { lineCode, name, description, targetProduct, targetQuantity, unit, isActive, managerId },
  });
}

async function upsertJob({ jobId, name, productName, targetQuantity, unit, status, lineId, createdById }) {
  return prisma.job.upsert({
    where: { jobId },
    update: { name, productName, targetQuantity, unit, status, lineId, createdById },
    create: { jobId, name, productName, targetQuantity, unit, status, lineId, createdById },
  });
}

async function main() {
  // ── EXECUTIVE ────────────────────────────────────────────────
  const executive = await upsertUser({
    name: 'Executive Director',
    identifier: 'exec@dojohubug.com',
    password: 'exec2024',
    role: 'EXECUTIVE',
  });

  // ── ERP SYSTEM (service account — authenticates like any other API client) ──
  await upsertUser({
    name: 'ERP Integration',
    identifier: 'erp-integration@dojohubug.com',
    password: 'erp-service-2024',
    role: 'ERP',
  });

  // ── MANAGERS (identifier = corporate email, shared demo password) ──
  const managerA = await upsertUser({
    name: 'Muto John',
    identifier: 'muto12@gmail.com',
    phone: '+256700111001',
    password: 'manager2024',
    role: 'MANAGER',
  });
  const managerB = await upsertUser({
    name: 'Babirye Janet',
    identifier: 'janet.babirye@dojohubug.com',
    phone: '+256700111002',
    password: 'manager2024',
    role: 'MANAGER',
  });
  const managerC = await upsertUser({
    name: 'Job Wasswa',
    identifier: 'jobwasswa24@gmail.com',
    phone: '+256700111003',
    password: 'manager2024',
    role: 'MANAGER',
  });

  // ── OPERATORS (identifier = phone, 4-digit PIN as credential) ──
  const operators = await Promise.all([
    upsertUser({ name: 'Jim Kim', identifier: '+256700333222', password: '2323', role: 'OPERATOR' }),
    upsertUser({ name: 'Auma Lydia', identifier: '+256700456789', password: '4567', role: 'OPERATOR' }),
    upsertUser({ name: 'Jack Mark', identifier: '+256700444555', password: '1111', role: 'OPERATOR' }),
    upsertUser({ name: 'Nankinga Sarah', identifier: '+256704567890', password: '2222', role: 'OPERATOR' }),
    upsertUser({ name: 'Okello David', identifier: '+256703456789', password: '3333', role: 'OPERATOR' }),
    upsertUser({ name: 'Nakato Grace', identifier: '+256702345678', password: '4444', role: 'OPERATOR' }),
    upsertUser({ name: 'Pim Kim', identifier: '+256700333444', password: '5555', role: 'OPERATOR' }),
  ]);

  // ── PRODUCTION LINES (5 total, 4 active, all assigned) ──
  const lineA = await upsertLine({
    lineCode: 'LINE-A',
    name: 'Line A — Tropical Pulping & Extraction',
    description: 'Primary washing, sorting, and extraction line processing fresh seasonal mangoes and pineapples.',
    targetProduct: 'Mango & Pineapple Concentrate',
    targetQuantity: 5000,
    unit: 'kg',
    isActive: true,
    managerId: managerA.id,
  });
  const lineB = await upsertLine({
    lineCode: 'LINE-B',
    name: 'Line B — Juice Blending & Pasteurization',
    description: 'Secondary blending and thermal treatment of extracted fruit pulps for shelf-stable juice products.',
    targetProduct: 'Premium Fruit Juice Blend',
    targetQuantity: 3000,
    unit: 'L',
    isActive: true,
    managerId: managerB.id,
  });
  await upsertLine({
    lineCode: 'LINE-C',
    name: 'Line C — Automated Bottling',
    description: 'High-speed bottle filling and capping station with inline cap torque verification.',
    targetProduct: 'Bottled Fruit Beverage',
    targetQuantity: 10000,
    unit: 'Units',
    isActive: true,
    managerId: managerB.id,
  });
  await upsertLine({
    lineCode: 'LINE-D',
    name: 'Line D — Quality Control',
    description: 'Dedicated QC checkpoint for organoleptic testing, viscosity, and microbiological sampling.',
    targetProduct: 'QC Samples',
    targetQuantity: 500,
    unit: 'Units',
    isActive: false,
    managerId: managerC.id,
  });
  await upsertLine({
    lineCode: 'LINE-E',
    name: 'Line E — Packaging & Labeling',
    description: 'End-of-line carton packing, shrink-wrapping, and date-coded labeling.',
    targetProduct: 'Packaged Goods',
    targetQuantity: 2000,
    unit: 'Units',
    isActive: true,
    managerId: managerC.id,
  });

  // ── JOBS (feeds the Monthly Volume Target % calculation) ──
  const job501 = await upsertJob({
    jobId: 'JOB-501',
    name: 'Mango Juice Run — Batch 07',
    productName: 'Premium Mango Juice 500ml',
    targetQuantity: 2000,
    unit: 'Bottles',
    status: 'ACTIVE',
    lineId: lineA.id,
    createdById: managerA.id,
  });
  await upsertJob({
    jobId: 'JOB-502',
    name: 'Passion Fruit Juice Run — Batch 03',
    productName: 'Passion Fruit Juice 330ml',
    targetQuantity: 1500,
    unit: 'Bottles',
    status: 'COMPLETED',
    lineId: lineB.id,
    createdById: managerB.id,
  });
  await upsertJob({
    jobId: 'JOB-503',
    name: 'Mango Nectar Run — Batch 04',
    productName: 'Mango Nectar 500ml',
    targetQuantity: 6000,
    unit: 'Bottles',
    status: 'COMPLETED',
    lineId: lineA.id,
    createdById: managerA.id,
  });

  // ── CRITICAL FAULT (drives the Executive Overview's Critical Alerts card) ──
  const existingFault = await prisma.faultLog.findFirst({
    where: { title: 'Machine Jam - Line 1 Pasteurized Tank' },
  });
  if (!existingFault) {
    await prisma.faultLog.create({
      data: {
        jobId: job501.id,
        operatorId: operators[0].id,
        title: 'Machine Jam - Line 1 Pasteurized Tank',
        description: 'Line 1 - Pasteurization Tank A',
        severity: 'CRITICAL',
        category: 'machine_jam',
      },
    });
  }

  console.log('Seed complete.');
  console.log('  Executive login:', executive.identifier, '/ exec2024');
  console.log('  Manager login (any manager email) / manager2024');
  console.log('  Operator login: +256700333222 / 2323 (Jim Kim)');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
