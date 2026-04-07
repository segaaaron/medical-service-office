/**
 * migrate-image-urls.js
 *
 * Normaliza los campos de imagen en Treatment y SiteContent:
 * convierte URLs completas (http://host/uploads/file.webp)
 * a paths relativos (/uploads/file.webp).
 *
 * Uso: node scripts/migrate-image-urls.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function toRelativePath(imageUrl) {
  if (!imageUrl) return imageUrl;
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    try {
      return new URL(imageUrl).pathname;
    } catch {
      return imageUrl;
    }
  }
  return imageUrl;
}

async function migrateTreatments() {
  const records = await prisma.treatment.findMany({
    where: { imageUrl: { startsWith: 'http' } },
    select: { id: true, imageUrl: true },
  });

  console.log(`Treatments con URL completa encontrados: ${records.length}`);

  for (const record of records) {
    const relativePath = toRelativePath(record.imageUrl);
    await prisma.treatment.update({
      where: { id: record.id },
      data: { imageUrl: relativePath },
    });
    console.log(`  [treatment] ${record.id}: ${record.imageUrl} → ${relativePath}`);
  }
}

async function migrateSiteContent() {
  const records = await prisma.siteContent.findMany();

  let count = 0;
  for (const record of records) {
    const value = record.value;
    if (!value || typeof value !== 'object') continue;

    const doctorImage = value.doctorImage;
    if (!doctorImage || !(doctorImage.startsWith('http://') || doctorImage.startsWith('https://'))) continue;

    const relativePath = toRelativePath(doctorImage);
    await prisma.siteContent.update({
      where: { key: record.key },
      data: { value: { ...value, doctorImage: relativePath } },
    });
    console.log(`  [site-content] ${record.key}: ${doctorImage} → ${relativePath}`);
    count++;
  }

  console.log(`SiteContent con URL completa encontrados: ${count}`);
}

async function main() {
  try {
    console.log('Iniciando migración de image URLs...\n');
    await migrateTreatments();
    await migrateSiteContent();
    console.log('\nMigración completada.');
  } catch (err) {
    console.error('Error durante la migración:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
