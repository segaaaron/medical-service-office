const prisma = require('../services/prisma.service');
const { toSlug } = require('../utils/slug');
const { deleteUploadedFile } = require('../middlewares/upload.middleware');

async function listTreatments(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [treatments, total] = await Promise.all([
      prisma.treatment.findMany({
        where: { active: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.treatment.count({ where: { active: true } }),
    ]);

    return res.json({ data: treatments, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

async function getTreatment(req, res, next) {
  try {
    const treatment = await prisma.treatment.findUnique({
      where: { id: req.params.id },
    });
    if (!treatment) return res.status(404).json({ error: 'Tratamiento no encontrado' });
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
      return res.status(409).json({ error: 'Ya existe un tratamiento con ese nombre' });
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
    if (!current) return res.status(404).json({ error: 'Tratamiento no encontrado' });

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
    if (err.code === 'P2025') return res.status(404).json({ error: 'Tratamiento no encontrado' });
    if (err.code === 'P2002') return res.status(409).json({ error: 'Ya existe un tratamiento con ese nombre' });
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
    if (err.code === 'P2025') return res.status(404).json({ error: 'Tratamiento no encontrado' });
    next(err);
  }
}

module.exports = { listTreatments, getTreatment, createTreatment, updateTreatment, deleteTreatment };
