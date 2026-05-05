const prisma = require('../services/prisma.service');

async function getHome(req, res, next) {
  try {
    const home = await prisma.home.findFirst();
    if (!home) return res.status(404).json({ error: 'Home content not found' });
    return res.json(home);
  } catch (err) {
    next(err);
  }
}

async function upsertHome(req, res, next) {
  try {
    const data = { ...req.body };

    const existing = await prisma.home.findFirst();

    let home;
    if (existing) {
      home = await prisma.home.update({ where: { id: existing.id }, data });
      return res.json(home);
    } else {
      home = await prisma.home.create({ data });
      return res.status(201).json(home);
    }
  } catch (err) {
    next(err);
  }
}

module.exports = { getHome, upsertHome };
