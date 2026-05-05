const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/requireRole.middleware');
const { upload, compressAndSave, mergeImageUrl } = require('../middlewares/upload.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { upsertPromoBannerSchema } = require('../schemas/index');
const { getPromoBanner, upsertPromoBanner } = require('../controllers/promo-banner.controller');

const router = Router();

router.get('/', getPromoBanner);

router.put(
  '/',
  authenticate,
  requireRole('ADMIN'),
  upload.single('image'),
  compressAndSave,
  mergeImageUrl,
  validate(upsertPromoBannerSchema),
  upsertPromoBanner
);

module.exports = router;
