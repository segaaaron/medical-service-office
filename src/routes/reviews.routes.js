const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/requireRole.middleware');
const { validateRateLimiter } = require('../middlewares/reviewRateLimit.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createInviteSchema, submitInviteSchema } = require('../schemas/index');
const {
  listPublicReviews,
  listAdminReviews,
  getStats,
  approveReview,
  deleteReview,
} = require('../controllers/reviews.controller');
const {
  createInvite,
  createInviteBot,
  listInvites,
  revokeInvite,
  validateInvite,
  submitInvite,
} = require('../controllers/reviewInvites.controller');

const router = Router();

// Auth del bot (Loreley) por secreto compartido — alcance: solo crear invitaciones de reseña.
function botAuth(req, res, next) {
  const secret = process.env.BOT_REVIEW_SECRET;
  if (!secret || req.get('x-bot-secret') !== secret) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }
  next();
}

// El formulario público abierto se retiró: la única vía es la invitación con token.
router.post('/', (_req, res) =>
  res.status(410).json({ error: 'GONE', message: 'El formulario abierto de reseñas fue retirado. Las reseñas ahora nacen de una invitación.' })
);

// Público
router.get('/public', listPublicReviews);

// ── Invitaciones ────────────────────────────────────────────────────────────
// Rutas con segmentos estáticos (validate / submit) no colisionan con /invites/:id.
// Públicas
router.get('/invites/validate/:token', validateRateLimiter, validateInvite);
router.post('/invites/:token/submit', validate(submitInviteSchema), submitInvite);
// Bot (Loreley) — crea invitación con secreto compartido y devuelve el link listo para enviar
router.post('/invites/bot', botAuth, createInviteBot);
// Admin
router.post('/invites', authenticate, requireRole('ADMIN'), validate(createInviteSchema), createInvite);
router.get('/invites', authenticate, requireRole('ADMIN'), listInvites);
router.delete('/invites/:id', authenticate, requireRole('ADMIN'), revokeInvite);

// ── Reseñas (admin) ───────────────────────────────────────────────────────────
// /stats ANTES de /:id para evitar captura de ruta
router.get('/stats',   authenticate, requireRole('ADMIN'), getStats);
router.get('/',        authenticate, requireRole('ADMIN'), listAdminReviews);
router.patch('/:id/approve', authenticate, requireRole('ADMIN'), approveReview);
router.delete('/:id',  authenticate, requireRole('ADMIN'), deleteReview);

module.exports = router;
