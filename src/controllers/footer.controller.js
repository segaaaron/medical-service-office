const prisma = require('../services/prisma.service');

async function getFooter(req, res, next) {
  try {
    const footer = await prisma.footer.findFirst();
    if (!footer) return res.status(404).json({ error: 'Contenido del footer no encontrado' });
    return res.json(footer);
  } catch (err) {
    next(err);
  }
}

async function upsertFooter(req, res, next) {
  try {
    const data = { ...req.body };
    const existing = await prisma.footer.findFirst();

    let footer;
    if (existing) {
      footer = await prisma.footer.update({ where: { id: existing.id }, data });
      return res.json(footer);
    } else {
      footer = await prisma.footer.create({ data });
      return res.status(201).json(footer);
    }
  } catch (err) {
    next(err);
  }
}

module.exports = { getFooter, upsertFooter };
