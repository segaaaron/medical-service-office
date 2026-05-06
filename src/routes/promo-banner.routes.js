const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/requireRole.middleware');
const { upload, compressAndSave, mergeImageUrl, deleteUploadedFile } = require('../middlewares/upload.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { upsertPromoBannerSchema } = require('../schemas/index');
const { getPromoBanner, upsertPromoBanner } = require('../controllers/promo-banner.controller');

function cleanupOnError(req, res, next) {
  res.on('finish', () => {
    if (res.statusCode >= 400 && req.imageUrl) deleteUploadedFile(req.imageUrl);
  });
  next();
}

const router = Router();

router.get('/', getPromoBanner);

router.put(
  '/',
  authenticate,
  requireRole('ADMIN'),
  upload.single('image'),
  compressAndSave,
  cleanupOnError,
  mergeImageUrl,
  validate(upsertPromoBannerSchema),
  upsertPromoBanner
);

module.exports = router;
