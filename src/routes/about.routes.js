const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { upload, compressAndSave } = require('../middlewares/upload.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { upsertAboutUsSchema } = require('../schemas/index');
const { getAboutUs, upsertAboutUs } = require('../controllers/about.controller');

const router = Router();

function mergeImageUrl(req, res, next) {
  if (req.imageUrl) {
    if (!req.body || typeof req.body !== 'object') req.body = {};
    req.body.imageUrl = req.imageUrl;
  }
  next();
}

router.get('/', getAboutUs);

router.put(
  '/',
  authenticate,
  upload.single('image'),
  compressAndSave,
  mergeImageUrl,
  validate(upsertAboutUsSchema),
  upsertAboutUs
);

module.exports = router;
