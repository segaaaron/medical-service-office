const prisma = require('../services/prisma.service');

const DEFAULT_KEY = 'main';

async function getSiteContent(req, res, next) {
  try {
    const { key } = req.params;
    const record = await prisma.siteContent.findUnique({
      where: { key: key || DEFAULT_KEY },
    });

    if (!record) {
      return res.status(404).json({ error: 'Content not found' });
    }

    return res.json(record);
  } catch (err) {
    next(err);
  }
}

async function listSiteContent(req, res, next) {
  try {
    const records = await prisma.siteContent.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    return res.json(records);
  } catch (err) {
    next(err);
  }
}

async function upsertSiteContent(req, res, next) {
  try {
    const { key, value } = req.body;

    const record = await prisma.siteContent.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    return res.json(record);
  } catch (err) {
    next(err);
  }
}

async function deleteSiteContent(req, res, next) {
  try {
    const { key } = req.params;
    await prisma.siteContent.delete({ where: { key } });
    return res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Content not found' });
    next(err);
  }
}

async function uploadImage(req, res) {
  return res.json({ imageUrl: req.imageUrl });
}

module.exports = { getSiteContent, listSiteContent, upsertSiteContent, deleteSiteContent, uploadImage };
