const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { upload, compressAndSave } = require('../middlewares/upload.middleware');
const { getPromoBanner, upsertPromoBanner } = require('../controllers/promo-banner.controller');

const router = Router();

function mergeImageUrl(req, res, next) {
  if (req.imageUrl) {
    if (!req.body || typeof req.body !== 'object') req.body = {};
    req.body.imageUrl = req.imageUrl;
  }
  next();
}

router.get('/', getPromoBanner);

router.put(
  '/',
  authenticate,
  upload.single('image'),
  compressAndSave,
  mergeImageUrl,
  upsertPromoBanner
);

module.exports = router;
