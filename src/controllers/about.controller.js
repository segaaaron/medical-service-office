const prisma = require('../services/prisma.service');
const { deleteUploadedFile } = require('../middlewares/upload.middleware');

async function getAboutUs(req, res, next) {
  try {
    const aboutUs = await prisma.aboutUs.findUnique({ where: { singleton: true } });
    if (!aboutUs) return res.status(404).json({ error: 'Contenido "Acerca de" no encontrado' });
    return res.json(aboutUs);
  } catch (err) {
    next(err);
  }
}

async function upsertAboutUs(req, res, next) {
  const data = { ...req.body };

  try {
    if (req.imageUrl) {
      const existing = await prisma.aboutUs.findUnique({ where: { singleton: true } });
      if (existing?.imageUrl && existing.imageUrl !== req.imageUrl) {
        deleteUploadedFile(existing.imageUrl);
      }
      data.imageUrl = req.imageUrl;
    } else if (data.imageUrl === null) {
      const existing = await prisma.aboutUs.findUnique({ where: { singleton: true } });
      if (existing?.imageUrl) deleteUploadedFile(existing.imageUrl);
    }

    const aboutUs = await prisma.aboutUs.upsert({
      where: { singleton: true },
      update: data,
      create: data,
    });
    return res.json(aboutUs);
  } catch (err) {
    next(err);
  }
}

module.exports = { getAboutUs, upsertAboutUs };
