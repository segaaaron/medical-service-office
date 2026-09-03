const prisma = require('../services/prisma.service');

async function getContact(req, res, next) {
  try {
    const contact = await prisma.contact.findUnique({ where: { singleton: true } });
    if (!contact) return res.status(404).json({ error: 'Información de contacto no encontrada' });
    return res.json(contact);
  } catch (err) {
    next(err);
  }
}

async function upsertContact(req, res, next) {
  const {
    whatsappNumber, whatsappUrl, phone,
    instagramUsername, instagramUrl,
    facebookName, facebookUrl,
    tiktokUsername, tiktokUrl,
    mondayFridayHours, saturdayHours, sundayStatus,
    locationDescription,
    latitude, longitude, mapsUrl,
  } = req.body;

  const data = {
    whatsappNumber, whatsappUrl, phone,
    instagramUsername, instagramUrl,
    facebookName, facebookUrl,
    tiktokUsername, tiktokUrl,
    mondayFridayHours, saturdayHours, sundayStatus,
    locationDescription,
    latitude, longitude, mapsUrl,
  };

  try {
    const contact = await prisma.contact.upsert({
      where: { singleton: true },
      update: data,
      create: data,
    });
    return res.json(contact);
  } catch (err) {
    next(err);
  }
}

module.exports = { getContact, upsertContact };
