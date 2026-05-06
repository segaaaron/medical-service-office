const prisma = require('../services/prisma.service');

async function getContact(req, res, next) {
  try {
    const contact = await prisma.contact.findFirst();
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
    mondayFridayHours, saturdayHours, sundayStatus,
    locationDescription,
  } = req.body;

  const data = {
    whatsappNumber, whatsappUrl, phone,
    instagramUsername, instagramUrl,
    facebookName, facebookUrl,
    mondayFridayHours, saturdayHours, sundayStatus,
    locationDescription,
  };

  try {
    const existing = await prisma.contact.findFirst();
    if (existing) {
      const contact = await prisma.contact.update({ where: { id: existing.id }, data });
      return res.json(contact);
    }
    const contact = await prisma.contact.create({ data });
    return res.status(201).json(contact);
  } catch (err) {
    if (err.code === 'P2002') {
      try {
        const existing = await prisma.contact.findFirst();
        if (existing) {
          const contact = await prisma.contact.update({ where: { id: existing.id }, data });
          return res.json(contact);
        }
      } catch (retryErr) { return next(retryErr); }
    }
    next(err);
  }
}

module.exports = { getContact, upsertContact };
