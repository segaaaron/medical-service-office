const prisma = require('../services/prisma.service');

async function getHome(req, res, next) {
  try {
    const home = await prisma.home.findUnique({ where: { singleton: true } });
    if (!home) return res.status(404).json({ error: 'Contenido del inicio no encontrado' });
    return res.json(home);
  } catch (err) {
    next(err);
  }
}

async function upsertHome(req, res, next) {
  try {
    const home = await prisma.home.upsert({
      where: { singleton: true },
      update: req.body,
      create: req.body,
    });
    return res.json(home);
  } catch (err) {
    next(err);
  }
}

module.exports = { getHome, upsertHome };
