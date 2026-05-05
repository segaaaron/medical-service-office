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
  try {
    const data = { ...req.body };

    const existing = await prisma.aboutUs.findFirst();

    if (req.imageUrl) {
      if (existing?.imageUrl && existing.imageUrl !== req.imageUrl) {
        deleteUploadedFile(existing.imageUrl);
      }
      data.imageUrl = req.imageUrl;
    }

    let aboutUs;
    if (existing) {
      aboutUs = await prisma.aboutUs.update({ where: { id: existing.id }, data });
      return res.json(aboutUs);
    } else {
      aboutUs = await prisma.aboutUs.create({ data });
      return res.status(201).json(aboutUs);
    }
  } catch (err) {
    next(err);
  }
}

module.exports = { getAboutUs, upsertAboutUs };
