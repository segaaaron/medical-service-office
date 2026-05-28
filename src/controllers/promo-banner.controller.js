const prisma = require('../services/prisma.service');
const { deleteUploadedFile } = require('../middlewares/upload.middleware');

async function getPromoBanner(req, res, next) {
  try {
    const banner = await prisma.promoBanner.findUnique({ where: { singleton: true } });
    if (!banner) return res.status(404).json({ error: 'Banner promocional no encontrado' });
    return res.json(banner);
  } catch (err) {
    next(err);
  }
}

async function upsertPromoBanner(req, res, next) {
  const data = { ...req.body };

  try {
    if (req.imageUrl) {
      const existing = await prisma.promoBanner.findUnique({ where: { singleton: true } });
      if (existing?.imageUrl && existing.imageUrl !== req.imageUrl) {
        deleteUploadedFile(existing.imageUrl);
      }
      data.imageUrl = req.imageUrl;
    } else if (data.imageUrl === null) {
      const existing = await prisma.promoBanner.findUnique({ where: { singleton: true } });
      if (existing?.imageUrl) deleteUploadedFile(existing.imageUrl);
    }

    const banner = await prisma.promoBanner.upsert({
      where: { singleton: true },
      update: data,
      create: { active: false, ...data },
    });
    return res.json(banner);
  } catch (err) {
    next(err);
  }
}

module.exports = { getPromoBanner, upsertPromoBanner };
