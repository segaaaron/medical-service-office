const prisma = require('../services/prisma.service');
const { deleteUploadedFile } = require('../middlewares/upload.middleware');

async function getAboutUs(req, res, next) {
  try {
    const aboutUs = await prisma.aboutUs.findFirst();
    if (!aboutUs) return res.status(404).json({ error: 'About us content not found' });
    return res.json(aboutUs);
  } catch (err) {
    next(err);
  }
}

async function upsertAboutUs(req, res, next) {
  try {
    const data = { ...req.body };

    if (req.imageUrl) {
      const existing = await prisma.aboutUs.findFirst();
      if (existing?.imageUrl && existing.imageUrl !== req.imageUrl) {
        deleteUploadedFile(existing.imageUrl);
      }
      data.imageUrl = req.imageUrl;
    }

    const existing = await prisma.aboutUs.findFirst();

    let aboutUs;
    if (existing) {
      aboutUs = await prisma.aboutUs.update({ where: { id: existing.id }, data });
    } else {
      aboutUs = await prisma.aboutUs.create({ data });
    }

    return res.json(aboutUs);
  } catch (err) {
    next(err);
  }
}

module.exports = { getAboutUs, upsertAboutUs };
