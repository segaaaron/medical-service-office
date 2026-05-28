const prisma = require('../services/prisma.service');
const { deleteUploadedFile } = require('../middlewares/upload.middleware');
const { parsePagination } = require('../utils/pagination');

const DEFAULT_KEY = 'main';

async function getSiteContent(req, res, next) {
  try {
    const { key } = req.params;
    const record = await prisma.siteContent.findUnique({
      where: { key: key || DEFAULT_KEY },
    });

    if (!record) {
      return res.status(404).json({ error: 'Contenido no encontrado' });
    }

    return res.json(record);
  } catch (err) {
    next(err);
  }
}

async function listSiteContent(req, res, next) {
  try {
    const { page, limit, skip } = parsePagination(req.query);

    const [records, total] = await Promise.all([
      prisma.siteContent.findMany({ orderBy: { updatedAt: 'desc' }, skip, take: limit }),
      prisma.siteContent.count(),
    ]);

    return res.json({ data: records, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

async function upsertSiteContent(req, res, next) {
  try {
    const { key } = req.body;
    let value = req.body.value;

    // Si se subió una imagen, borrar la anterior y guardar la nueva URL en doctorImage
    if (req.imageUrl && value && typeof value === 'object') {
      const existing = await prisma.siteContent.findUnique({ where: { key } });
      const oldImage = existing?.value?.doctorImage;
      if (oldImage && oldImage !== req.imageUrl) {
        deleteUploadedFile(oldImage);
      }
      value = { ...value, doctorImage: req.imageUrl };
    }

    const record = await prisma.siteContent.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    return res.json(record);
  } catch (err) {
    next(err);
  }
}

async function deleteSiteContent(req, res, next) {
  try {
    const { key } = req.params;
    const record = await prisma.siteContent.findUnique({ where: { key } });
    if (!record) return res.status(404).json({ error: 'Contenido no encontrado' });
    if (record.value?.doctorImage) deleteUploadedFile(record.value.doctorImage);
    await prisma.siteContent.delete({ where: { key } });
    return res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Contenido no encontrado' });
    next(err);
  }
}

async function uploadImage(req, res) {
  if (!req.imageUrl) {
    return res.status(400).json({ error: 'No se proporcionó ningún archivo de imagen' });
  }
  return res.json({ imageUrl: req.imageUrl });
}

module.exports = { getSiteContent, listSiteContent, upsertSiteContent, deleteSiteContent, uploadImage };
