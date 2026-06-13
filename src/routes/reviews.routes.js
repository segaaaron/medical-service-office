const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/requireRole.middleware');
const { reviewRateLimiter } = require('../middlewares/reviewRateLimit.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createReviewSchema } = require('../schemas/index');
const {
  createReview,
  listPublicReviews,
  listAdminReviews,
  getStats,
  approveReview,
  deleteReview,
} = require('../controllers/reviews.controller');

const router = Router();

// Públicos
router.post('/',       reviewRateLimiter, validate(createReviewSchema), createReview);
router.get('/public',  listPublicReviews);

// Admin — /stats ANTES de /:id para evitar captura de ruta
router.get('/stats',   authenticate, requireRole('ADMIN'), getStats);
router.get('/',        authenticate, requireRole('ADMIN'), listAdminReviews);
router.patch('/:id/approve', authenticate, requireRole('ADMIN'), approveReview);
router.delete('/:id',  authenticate, requireRole('ADMIN'), deleteReview);

module.exports = router;
