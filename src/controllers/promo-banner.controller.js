const prisma = require('../services/prisma.service');
const { deleteUploadedFile } = require('../middlewares/upload.middleware');

async function getPromoBanner(req, res, next) {
  try {
    const banner = await prisma.promoBanner.findFirst();
    if (!banner) return res.status(404).json({ error: 'Banner promocional no encontrado' });
    return res.json(banner);
  } catch (err) {
    next(err);
  }
}

async function upsertPromoBanner(req, res, next) {
  const data = { ...req.body };

  try {
    const existing = await prisma.promoBanner.findFirst();

    if (req.imageUrl) {
      if (existing?.imageUrl && existing.imageUrl !== req.imageUrl) {
        deleteUploadedFile(existing.imageUrl);
      }
      data.imageUrl = req.imageUrl;
    }

    if (existing) {
      const banner = await prisma.promoBanner.update({ where: { id: existing.id }, data });
      return res.json(banner);
    }
    const banner = await prisma.promoBanner.create({ data: { ...data, active: data.active ?? false } });
    return res.status(201).json(banner);
  } catch (err) {
    if (err.code === 'P2002') {
      try {
        const existing = await prisma.promoBanner.findFirst();
        if (existing) {
          const banner = await prisma.promoBanner.update({ where: { id: existing.id }, data });
          return res.json(banner);
        }
      } catch (retryErr) { return next(retryErr); }
    }
    next(err);
  }
}

module.exports = { getPromoBanner, upsertPromoBanner };
