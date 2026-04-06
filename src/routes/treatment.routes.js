const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { upload, compressAndSave } = require('../middlewares/upload.middleware');
const {
  listTreatments,
  getTreatment,
  createTreatment,
  updateTreatment,
  deleteTreatment,
} = require('../controllers/treatment.controller');
const { validate } = require('../middlewares/validate.middleware');
const { createTreatmentSchema, updateTreatmentSchema } = require('../schemas/index');

const router = Router();

function mergeImageUrl(req, res, next) {
  if (req.imageUrl) {
    if (!req.body || typeof req.body !== 'object') req.body = {};
    req.body.imageUrl = req.imageUrl;
  }
  next();
}

// Public — allow the website to load treatments without authentication
router.get('/', listTreatments);
router.get('/:id', getTreatment);

// Protected — only authenticated admins
router.post('/', authenticate, upload.single('image'), compressAndSave, mergeImageUrl, validate(createTreatmentSchema), createTreatment);
router.put('/:id', authenticate, upload.single('image'), compressAndSave, mergeImageUrl, validate(updateTreatmentSchema), updateTreatment);
router.delete('/:id', authenticate, deleteTreatment);

module.exports = router;
