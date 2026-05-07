const prisma = require('../services/prisma.service');
const { toSlug } = require('../utils/slug');
const { deleteUploadedFile } = require('../middlewares/upload.middleware');
const { parsePagination } = require('../utils/pagination');

async function listTreatments(req, res, next) {
  try {
    const { page, limit, skip } = parsePagination(req.query);

    const where = {};

    const [treatments, total] = await Promise.all([
      prisma.treatment.findMany({
        where,
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.treatment.count({ where }),
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
    const { name, description, price, tag, active } = req.body;
    const imageUrl = req.imageUrl ?? req.body.imageUrl ?? null;

    const slug = toSlug(name);
    if (!slug) return res.status(400).json({ error: 'El nombre debe contener al menos un carácter alfanumérico' });

    const treatment = await prisma.treatment.create({
      data: {
        name,
        slug,
        description: description ?? null,
        price: price ?? null,
        tag: tag ?? null,
        imageUrl: imageUrl || null,
        active: active ?? false,
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
    if (err.code === 'P2003') return res.status(409).json({ error: 'No se puede eliminar el tratamiento porque está siendo referenciado por otros registros.' });
    next(err);
  }
}

async function reorderTreatments(req, res, next) {
  try {
    const items = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'El body debe ser un array no vacío' });
    }

    for (const item of items) {
      if (typeof item.id !== 'string' || item.id.trim().length === 0) {
        return res.status(400).json({ error: 'Cada item debe tener un id de tipo string no vacío' });
      }
      if (!Number.isInteger(item.order) || item.order < 0 || item.order > 2_147_483_647) {
        return res.status(400).json({ error: 'El campo order debe ser un entero entre 0 y 2147483647' });
      }
    }

    const ids = items.map(i => i.id);
    if (new Set(ids).size !== ids.length) {
      return res.status(400).json({ error: 'El body contiene IDs duplicados' });
    }

    await prisma.$transaction(
      items.map(({ id, order }) =>
        prisma.treatment.update({ where: { id }, data: { order } })
      )
    );

    return res.json({ ok: true });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Uno o más tratamientos no fueron encontrados' });
    next(err);
  }
}

module.exports = { listTreatments, getTreatment, createTreatment, updateTreatment, deleteTreatment, reorderTreatments };
