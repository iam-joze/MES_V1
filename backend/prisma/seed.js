const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const credentialHash = await bcrypt.hash('AdminPass123!', 10);

  await prisma.user.upsert({
    where: { identifier: 'executive@dojohub.com' },
    update: {
      name: 'Executive Director',
      credentialHash,
      role: 'EXECUTIVE',
      isActive: true,
    },
    create: {
      name: 'Executive Director',
      identifier: 'executive@dojohub.com',
      credentialHash,
      role: 'EXECUTIVE',
      isActive: true,
    },
  });

  console.log('Base Executive seeded successfully');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });