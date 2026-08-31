const prisma = require('../services/prisma.service');
const { hashIp } = require('../middlewares/reviewRateLimit.middleware');

// Tope de la lista del panel: los leads se consultan por recencia, no en bloque.
const LEADS_LIMIT_DEFAULT = 100;
const LEADS_LIMIT_MAX = 500;

/**
 * Alta pública desde el formulario de la web.
 *
 * El formulario redirige a WhatsApp inmediatamente después, así que este alta
 * NUNCA debe bloquear ni romper ese salto: la conversación con la paciente vale
 * más que el registro. Por eso el controlador responde 201 con el id y deja que
 * el frontend siga su camino sin esperar nada más.
 */
async function createLead(req, res, next) {
  try {
    const lead = await prisma.lead.create({
      data: {
        name: req.body.name,
        phone: req.body.phone ?? null,
        treatment: req.body.treatment ?? null,
        message: req.body.message ?? null,
        preferredDate: req.body.preferredDate ?? null,
        source: req.body.source ?? 'contact-form',
        // Se guarda el hash, nunca la IP: sirve para detectar abuso sin
        // conservar un dato personal identificable de la paciente.
        ipHash: hashIp(req.ip),
      },
      select: { id: true, createdAt: true },
    });
    return res.status(201).json(lead);
  } catch (err) {
    next(err);
  }
}

/** Lista para el panel: los más recientes primero. Nunca expone el ipHash. */
async function listLeads(req, res, next) {
  try {
    const raw = parseInt(req.query.limit, 10);
    const limit = Math.min(Math.max(Number.isNaN(raw) ? LEADS_LIMIT_DEFAULT : raw, 1), LEADS_LIMIT_MAX);

    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        phone: true,
        treatment: true,
        message: true,
        preferredDate: true,
        source: true,
        createdAt: true,
      },
    });
    return res.json(leads);
  } catch (err) {
    next(err);
  }
}

module.exports = { createLead, listLeads };
