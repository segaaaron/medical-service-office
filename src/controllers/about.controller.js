const prisma = require('../services/prisma.service');
const { deleteUploadedFile } = require('../middlewares/upload.middleware');

async function getAboutUs(req, res, next) {
  try {
    const aboutUs = await prisma.aboutUs.findFirst();
    if (!aboutUs) return res.status(404).json({ error: 'Contenido "Acerca de" no encontrado' });
    return res.json(aboutUs);
  } catch (err) {
    next(err);
  }
}

async function upsertAboutUs(req, res, next) {
  const data = { ...req.body };

  try {
    const existing = await prisma.aboutUs.findFirst();

    if (req.imageUrl) {
      if (existing?.imageUrl && existing.imageUrl !== req.imageUrl) {
        deleteUploadedFile(existing.imageUrl);
      }
      data.imageUrl = req.imageUrl;
    }

    if (existing) {
      const aboutUs = await prisma.aboutUs.update({ where: { id: existing.id }, data });
      return res.json(aboutUs);
    }
    const aboutUs = await prisma.aboutUs.create({ data });
    return res.status(201).json(aboutUs);
  } catch (err) {
    if (err.code === 'P2002') {
      try {
        const existing = await prisma.aboutUs.findFirst();
        if (existing) {
          const aboutUs = await prisma.aboutUs.update({ where: { id: existing.id }, data });
          return res.json(aboutUs);
        }
      } catch (retryErr) { return next(retryErr); }
    }
    next(err);
  }
}

module.exports = { getAboutUs, upsertAboutUs };
