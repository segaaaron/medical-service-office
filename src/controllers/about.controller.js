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
  const galleryProvided = Array.isArray(data.gallery);

  try {
    // Una sola lectura del registro previo: la usan tanto la imagen principal
    // como la galería para borrar los archivos que dejan de referenciarse.
    const needsExisting = req.imageUrl || data.imageUrl === null || galleryProvided;
    const existing = needsExisting
      ? await prisma.aboutUs.findUnique({ where: { singleton: true } })
      : null;

    if (req.imageUrl) {
      if (existing?.imageUrl && existing.imageUrl !== req.imageUrl) {
        deleteUploadedFile(existing.imageUrl);
      }
      data.imageUrl = req.imageUrl;
    } else if (data.imageUrl === null && existing?.imageUrl) {
      deleteUploadedFile(existing.imageUrl);
    }

    // Galería: borra los archivos previos que ya no están en la nueva lista.
    if (galleryProvided && Array.isArray(existing?.gallery)) {
      const next = new Set(data.gallery);
      for (const url of existing.gallery) {
        if (!next.has(url)) deleteUploadedFile(url);
      }
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
