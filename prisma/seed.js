require('../src/config/env');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || 'dramedranoyasmin@gmail.com';
  const name = process.env.SEED_ADMIN_NAME || 'draMedrano';
  const plainPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@2026';

  const password = await bcrypt.hash(plainPassword, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { password, name },
    create: {
      email,
      name,
      password,
    },
  });

  console.log(`Admin user upserted: ${user.email} (id: ${user.id})`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
