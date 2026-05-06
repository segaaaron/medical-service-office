const prisma = require('../services/prisma.service');

async function getHome(req, res, next) {
  try {
    const home = await prisma.home.findFirst();
    if (!home) return res.status(404).json({ error: 'Contenido del inicio no encontrado' });
    return res.json(home);
  } catch (err) {
    next(err);
  }
}

async function upsertHome(req, res, next) {
  const data = { ...req.body };

  try {
    const existing = await prisma.home.findFirst();
    if (existing) {
      const home = await prisma.home.update({ where: { id: existing.id }, data });
      return res.json(home);
    }
    const home = await prisma.home.create({ data });
    return res.status(201).json(home);
  } catch (err) {
    if (err.code === 'P2002') {
      try {
        const existing = await prisma.home.findFirst();
        if (existing) {
          const home = await prisma.home.update({ where: { id: existing.id }, data });
          return res.json(home);
        }
      } catch (retryErr) { return next(retryErr); }
    }
    next(err);
  }
}

module.exports = { getHome, upsertHome };
