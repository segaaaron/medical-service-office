const prisma = require('../services/prisma.service');
const { deleteUploadedFile } = require('../middlewares/upload.middleware');

async function getPromoBanner(req, res, next) {
  try {
    const banner = await prisma.promoBanner.findFirst();
    if (!banner) return res.status(404).json({ error: 'Promo banner not found' });
    return res.json(banner);
  } catch (err) {
    next(err);
  }
}

async function upsertPromoBanner(req, res, next) {
  try {
    const data = { ...req.body };

    if (req.imageUrl) {
      const existing = await prisma.promoBanner.findFirst();
      if (existing?.imageUrl && existing.imageUrl !== req.imageUrl) {
        deleteUploadedFile(existing.imageUrl);
      }
      data.imageUrl = req.imageUrl;
    }

    const existing = await prisma.promoBanner.findFirst();

    let banner;
    if (existing) {
      banner = await prisma.promoBanner.update({ where: { id: existing.id }, data });
    } else {
      banner = await prisma.promoBanner.create({ data });
    }

    return res.json(banner);
  } catch (err) {
    next(err);
  }
}

module.exports = { getPromoBanner, upsertPromoBanner };
