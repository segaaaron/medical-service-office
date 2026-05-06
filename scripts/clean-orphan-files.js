/**
 * clean-orphan-files.js
 *
 * Elimina archivos de /uploads que ya no están referenciados
 * en ningún registro de la base de datos.
 *
 * Uso:
 *   node scripts/clean-orphan-files.js          → dry-run (solo muestra)
 *   node scripts/clean-orphan-files.js --delete  → borra los archivos
 */

const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();
const UPLOAD_DIR = path.join(__dirname, '../uploads');
const DRY_RUN = !process.argv.includes('--delete');

function extractFilename(imageUrl) {
  if (!imageUrl) return null;
  try {
    // Soporta path relativo (/uploads/file.webp) y URL completa
    const pathname = imageUrl.startsWith('http')
      ? new URL(imageUrl).pathname
      : imageUrl;
    if (!pathname.startsWith('/uploads/')) return null;
    return path.basename(pathname);
  } catch {
    return null;
  }
}

async function getReferencedFilenames() {
  const referenced = new Set();

  // Blog
  const posts = await prisma.blogPost.findMany({ select: { imageUrl: true } });
  for (const p of posts) {
    const f = extractFilename(p.imageUrl);
    if (f) referenced.add(f);
  }

  // Treatments
  const treatments = await prisma.treatment.findMany({ select: { imageUrl: true } });
  for (const t of treatments) {
    const f = extractFilename(t.imageUrl);
    if (f) referenced.add(f);
  }

  // SiteContent
  const contents = await prisma.siteContent.findMany();
  for (const c of contents) {
    const doctorImage = c.value?.doctorImage;
    const f = extractFilename(doctorImage);
    if (f) referenced.add(f);
  }

  // PromoBanner
  const banners = await prisma.promoBanner.findMany({ select: { imageUrl: true } });
  for (const b of banners) {
    const f = extractFilename(b.imageUrl);
    if (f) referenced.add(f);
  }

  // AboutUs
  const abouts = await prisma.aboutUs.findMany({ select: { imageUrl: true } });
  for (const a of abouts) {
    const f = extractFilename(a.imageUrl);
    if (f) referenced.add(f);
  }

  return referenced;
}

async function main() {
  if (DRY_RUN) {
    console.log('Modo DRY-RUN — no se borrará nada. Usa --delete para borrar.\n');
  }

  const referenced = await getReferencedFilenames();
  console.log(`Archivos referenciados en BD: ${referenced.size}`);

  const files = fs.readdirSync(UPLOAD_DIR);
  console.log(`Archivos en /uploads: ${files.length}\n`);

  const orphans = files.filter(f => !referenced.has(f));
  console.log(`Archivos huérfanos encontrados: ${orphans.length}`);

  if (orphans.length === 0) {
    console.log('No hay archivos huérfanos.');
    return;
  }

  for (const file of orphans) {
    const filePath = path.join(UPLOAD_DIR, file);
    if (DRY_RUN) {
      console.log(`  [dry-run] borraría: ${file}`);
    } else {
      fs.unlinkSync(filePath);
      console.log(`  [borrado] ${file}`);
    }
  }

  if (!DRY_RUN) {
    console.log(`\n${orphans.length} archivo(s) eliminado(s).`);
  }
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
