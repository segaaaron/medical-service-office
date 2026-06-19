const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/requireRole.middleware');
const { uploadAboutImages, compressAboutImages, mergeImageUrl, deleteUploadedFile } = require('../middlewares/upload.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { upsertAboutUsSchema } = require('../schemas/index');
const { getAboutUs, upsertAboutUs } = require('../controllers/about.controller');

function cleanupOnError(req, res, next) {
  res.on('finish', () => {
    if (res.statusCode >= 400) {
      const urls = req.uploadedUrls || (req.imageUrl ? [req.imageUrl] : []);
      urls.forEach(deleteUploadedFile);
    }
  });
  next();
}

const router = Router();

router.get('/', getAboutUs);

router.put(
  '/',
  authenticate,
  requireRole('ADMIN'),
  uploadAboutImages,
  compressAboutImages,
  cleanupOnError,
  mergeImageUrl,
  validate(upsertAboutUsSchema),
  upsertAboutUs
);

module.exports = router;
