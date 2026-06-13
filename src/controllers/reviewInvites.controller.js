const crypto = require('crypto');
const prisma = require('../services/prisma.service');

// Campos expuestos al admin en la lista — incluye contacto (email/phone)
function toAdminInvite(i) {
  return {
    id:               i.id,
    token:            i.status === 'pending' ? i.token : null,
    patient_name:     i.patientName,
    patient_lastname: i.patientLastname,
    email:            i.email,
    phone:            i.phone,
    status:           i.status,
    created_at:       i.createdAt,
    expires_at:       i.expiresAt,
    used_at:          i.usedAt,
    review_id:        i.reviewId,
  };
}

// Token CSPRNG impredecible — base64url (~43 chars), nunca Math.random ni UUID secuencial
function generateToken() {
  return crypto.randomBytes(32).toString('base64url');
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// Marca como 'expired' las invitaciones pending cuya ventana ya venció (lazy-expire en lectura).
// O(filas vencidas) con índice en status — barato, evita un cron obligatorio.
async function expireStale(now) {
  await prisma.reviewInvite.updateMany({
    where: { status: 'pending', expiresAt: { lte: now } },
    data:  { status: 'expired' },
  });
}

// Determina el motivo de invalidez de un token tras un claim atómico fallido.
async function resolveInvalidReason(token, now) {
  const invite = await prisma.reviewInvite.findUnique({
    where:  { token },
    select: { status: true, expiresAt: true },
  });
  if (!invite) return 'not_found';
  if (invite.status === 'used') return 'used';
  if (invite.status === 'revoked') return 'revoked';
  if (invite.status === 'expired') return 'expired';
  // pending pero la ventana venció — sincronizar fila y reportar expired
  if (invite.expiresAt.getTime() <= now.getTime()) {
    await prisma.reviewInvite.updateMany({
      where: { token, status: 'pending' },
      data:  { status: 'expired' },
    });
    return 'expired';
  }
  return 'used'; // perdió la carrera: otro request ya lo consumió
}

// POST /api/reviews/invites — admin
async function createInvite(req, res, next) {
  const { patient_name, patient_lastname, email, phone } = req.body;

  // Reintenta sólo ante colisión de token (P2002) — probabilidad ínfima con 256 bits
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const expiresAt = new Date(Date.now() + SEVEN_DAYS_MS);
      const invite = await prisma.reviewInvite.create({
        data: {
          token:           generateToken(),
          patientName:     patient_name,
          patientLastname: patient_lastname,
          email:           email ?? null,
          phone:           phone ?? null,
          status:          'pending',
          expiresAt,
        },
      });

      return res.status(201).json({
        id:               invite.id,
        token:            invite.token,
        patient_name:     invite.patientName,
        patient_lastname: invite.patientLastname,
        status:           invite.status,
        expires_at:       invite.expiresAt,
      });
    } catch (err) {
      if (err.code === 'P2002' && attempt < 2) continue;
      return next(err);
    }
  }
}

// GET /api/reviews/invites — admin
async function listInvites(req, res, next) {
  try {
    const now = new Date();
    await expireStale(now);

    const { status } = req.query;
    const where =
      status === 'pending' || status === 'used' || status === 'expired' || status === 'revoked'
        ? { status }
        : undefined;

    const invites = await prisma.reviewInvite.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    return res.json({ invites: invites.map(toAdminInvite) });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/reviews/invites/:id — admin (revoke)
async function revokeInvite(req, res, next) {
  try {
    // updateMany con condición en WHERE — atómico, sin TOCTOU
    const result = await prisma.reviewInvite.updateMany({
      where: { id: req.params.id, status: 'pending' },
      data:  { status: 'revoked' },
    });

    if (result.count === 0) {
      const exists = await prisma.reviewInvite.findUnique({
        where:  { id: req.params.id },
        select: { id: true },
      });
      // Ya estaba used/expired/revoked → 409; no existe → 404
      return res.status(exists ? 409 : 404).json({ error: 'NOT_FOUND' });
    }

    return res.json({ id: req.params.id, status: 'revoked' });
  } catch (err) {
    next(err);
  }
}

// GET /api/reviews/invites/validate/:token — público
// Nunca revela email/phone/token. 404 jamás (no filtrar existencia) → siempre 200.
async function validateInvite(req, res, next) {
  try {
    const now = new Date();
    const invite = await prisma.reviewInvite.findUnique({
      where:  { token: req.params.token },
      select: { patientName: true, patientLastname: true, status: true, expiresAt: true },
    });

    if (!invite) return res.json({ valid: false, reason: 'not_found' });

    if (invite.status !== 'pending') {
      return res.json({ valid: false, reason: invite.status }); // used | expired | revoked
    }

    if (invite.expiresAt.getTime() <= now.getTime()) {
      await prisma.reviewInvite.updateMany({
        where: { token: req.params.token, status: 'pending' },
        data:  { status: 'expired' },
      });
      return res.json({ valid: false, reason: 'expired' });
    }

    return res.json({
      valid: true,
      patient_name:     invite.patientName,
      patient_lastname: invite.patientLastname,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/reviews/invites/:token/submit — público (único camino para crear reseña)
async function submitInvite(req, res, next) {
  const { token } = req.params;
  const { rating, body, treatment } = req.body;

  try {
    const now = new Date();

    // Transacción interactiva corta: claim atómico → crea reseña → enlaza.
    // El UPDATE condicional garantiza el "un solo uso" incluso bajo carrera.
    const result = await prisma.$transaction(async (tx) => {
      const claim = await tx.reviewInvite.updateMany({
        where: { token, status: 'pending', expiresAt: { gt: now } },
        data:  { status: 'used', usedAt: now },
      });
      if (claim.count === 0) return { ok: false };

      const invite = await tx.reviewInvite.findUnique({
        where:  { token },
        select: { id: true, patientName: true, patientLastname: true },
      });

      const review = await tx.review.create({
        data: {
          patientName:     invite.patientName,
          patientLastname: invite.patientLastname,
          treatment:       treatment ?? null,
          body,
          rating,
          status:          'pending',
          inviteId:        invite.id,
        },
        select: { id: true },
      });

      await tx.reviewInvite.update({
        where: { id: invite.id },
        data:  { reviewId: review.id },
      });

      return { ok: true, reviewId: review.id };
    }, { timeout: 5000 });

    if (!result.ok) {
      const reason = await resolveInvalidReason(token, now);
      return res.status(409).json({ error: 'INVITE_INVALID', reason });
    }

    return res.status(201).json({ review_id: result.reviewId, status: 'pending' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createInvite,
  listInvites,
  revokeInvite,
  validateInvite,
  submitInvite,
};
