require('../src/config/env');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // ── SiteContent placeholder (only on first run) ───────────────────────────
  const existing = await prisma.siteContent.findUnique({ where: { key: 'main' } });
  if (!existing) {
    await prisma.siteContent.create({ data: { key: 'main', value: {} } });
    console.log('SiteContent "main" created (empty — configure via dashboard)');
  }

  // ── PromoBanner placeholder (only on first run) ───────────────────────────
  const existingBanner = await prisma.promoBanner.findFirst();
  if (!existingBanner) {
    await prisma.promoBanner.create({ data: { active: false } });
    console.log('PromoBanner created (inactive — configure via dashboard)');
  }
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
