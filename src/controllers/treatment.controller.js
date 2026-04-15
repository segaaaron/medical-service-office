const prisma = require('../services/prisma.service');
const { toSlug } = require('../utils/slug');
const { deleteUploadedFile } = require('../middlewares/upload.middleware');

async function listTreatments(req, res, next) {
  try {
    const treatments = await prisma.treatment.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return res.json(treatments);
  } catch (err) {
    next(err);
  }
}

async function getTreatment(req, res, next) {
  try {
    const treatment = await prisma.treatment.findUnique({
      where: { id: req.params.id },
    });
    if (!treatment) return res.status(404).json({ error: 'Treatment not found' });
    return res.json(treatment);
  } catch (err) {
    next(err);
  }
}

async function createTreatment(req, res, next) {
  try {
    const { name, description, price, tag } = req.body;
    const imageUrl = req.imageUrl ?? req.body.imageUrl ?? null;

    const slug = toSlug(name);

    const treatment = await prisma.treatment.create({
      data: {
        name,
        slug,
        description: description ?? null,
        price: price ?? null,
        tag: tag ?? null,
        imageUrl: imageUrl || null,
        active: true,
      },
    });
    return res.status(201).json(treatment);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'A treatment with this name already exists' });
    }
    next(err);
  }
}

async function updateTreatment(req, res, next) {
  try {
    const { name, description, price, tag, active } = req.body;
    const imageUrl = req.imageUrl ?? req.body.imageUrl ?? undefined;
    const data = {};

    const current = await prisma.treatment.findUnique({ where: { id: req.params.id } });
    if (!current) return res.status(404).json({ error: 'Treatment not found' });

    if (name !== undefined) {
      data.name = name;
      if (name !== current.name) data.slug = toSlug(name);
    }
    if (description !== undefined) data.description = description === '' ? null : description;
    if (price !== undefined) data.price = price === '' ? null : price;
    if (tag !== undefined) data.tag = (tag === '' || tag == null) ? null : tag;
    if (imageUrl !== undefined) {
      if (imageUrl && current.imageUrl && imageUrl !== current.imageUrl) {
        deleteUploadedFile(current.imageUrl);
      }
      data.imageUrl = imageUrl || null;
    }
    if (active !== undefined) data.active = active;

    const treatment = await prisma.treatment.update({
      where: { id: req.params.id },
      data,
    });
    return res.json(treatment);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Treatment not found' });
    if (err.code === 'P2002') return res.status(409).json({ error: 'A treatment with this name already exists' });
    next(err);
  }
}

async function deleteTreatment(req, res, next) {
  try {
    const treatment = await prisma.treatment.findUnique({ where: { id: req.params.id } });
    if (treatment) deleteUploadedFile(treatment.imageUrl);
    await prisma.treatment.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Treatment not found' });
    next(err);
  }
}

module.exports = { listTreatments, getTreatment, createTreatment, updateTreatment, deleteTreatment };
