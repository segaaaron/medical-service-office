const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/requireRole.middleware');
const { upload, compressAndSave, mergeImageUrl } = require('../middlewares/upload.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { upsertAboutUsSchema } = require('../schemas/index');
const { getAboutUs, upsertAboutUs } = require('../controllers/about.controller');

const router = Router();

router.get('/', getAboutUs);

router.put(
  '/',
  authenticate,
  requireRole('ADMIN'),
  upload.single('image'),
  compressAndSave,
  mergeImageUrl,
  validate(upsertAboutUsSchema),
  upsertAboutUs
);

module.exports = router;
