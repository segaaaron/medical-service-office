const prisma = require('../services/prisma.service');
const { toSlug } = require('../utils/slug');

async function listTreatments(req, res, next) {
  try {
    const { category, active } = req.query;
    // Default to active treatments only; pass active=false to see inactive
    const where = { active: active !== undefined ? active === 'true' : true };
    if (category) where.category = category;

    const treatments = await prisma.treatment.findMany({
      where,
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
    const { name, description, longDescription, price, category, imageUrl, active } = req.body;
    if (!name || price === undefined || !category) {
      return res.status(400).json({ error: 'name, price, and category are required' });
    }

    const slug = toSlug(name);

    const treatment = await prisma.treatment.create({
      data: {
        name,
        slug,
        description,
        longDescription,
        price: parseFloat(price),
        category,
        imageUrl,
        active: active ?? true,
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
    const { name, description, longDescription, price, category, imageUrl, active } = req.body;
    const data = {};
    if (name !== undefined) { data.name = name; data.slug = toSlug(name); }
    if (description !== undefined) data.description = description;
    if (longDescription !== undefined) data.longDescription = longDescription;
    if (price !== undefined) data.price = parseFloat(price);
    if (category !== undefined) data.category = category;
    if (imageUrl !== undefined) data.imageUrl = imageUrl;
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
    await prisma.treatment.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Treatment not found' });
    next(err);
  }
}

module.exports = { listTreatments, getTreatment, createTreatment, updateTreatment, deleteTreatment };
