const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { upload, compressAndSave, mergeImageUrl } = require('../middlewares/upload.middleware');
const { getPromoBanner, upsertPromoBanner } = require('../controllers/promo-banner.controller');

const router = Router();

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
