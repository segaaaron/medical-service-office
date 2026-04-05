const prisma = require('../services/prisma.service');

async function getContact(req, res, next) {
  try {
    const contact = await prisma.contact.findFirst();
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    return res.json(contact);
  } catch (err) {
    next(err);
  }
}

async function upsertContact(req, res, next) {
  try {
    const {
      whatsappNumber, whatsappUrl, phone,
      instagramUsername, instagramUrl,
      facebookName, facebookUrl,
      mondayFridayHours, saturdayHours, sundayStatus,
      locationDescription,
    } = req.body;

    const existing = await prisma.contact.findFirst();

    const data = {
      whatsappNumber, whatsappUrl, phone,
      instagramUsername, instagramUrl,
      facebookName, facebookUrl,
      mondayFridayHours, saturdayHours, sundayStatus,
      locationDescription,
    };

    let contact;
    if (existing) {
      contact = await prisma.contact.update({ where: { id: existing.id }, data });
    } else {
      contact = await prisma.contact.create({ data });
    }

    return res.json(contact);
  } catch (err) {
    next(err);
  }
}

module.exports = { getContact, upsertContact };
