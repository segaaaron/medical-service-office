const prisma = require('../services/prisma.service');

async function getFooter(req, res, next) {
  try {
    const footer = await prisma.footer.findUnique({ where: { singleton: true } });
    if (!footer) return res.status(404).json({ error: 'Contenido del footer no encontrado' });
    return res.json(footer);
  } catch (err) {
    next(err);
  }
}

async function upsertFooter(req, res, next) {
  try {
    const footer = await prisma.footer.upsert({
      where: { singleton: true },
      update: req.body,
      create: req.body,
    });
    return res.json(footer);
  } catch (err) {
    next(err);
  }
}

module.exports = { getFooter, upsertFooter };
