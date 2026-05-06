const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/requireRole.middleware');
const { upload, compressAndSave, mergeImageUrl, deleteUploadedFile } = require('../middlewares/upload.middleware');
const {
  listTreatments,
  getTreatment,
  createTreatment,
  updateTreatment,
  deleteTreatment,
} = require('../controllers/treatment.controller');
const { validate } = require('../middlewares/validate.middleware');
const { createTreatmentSchema, updateTreatmentSchema } = require('../schemas/index');

function cleanupOnError(req, res, next) {
  res.on('finish', () => {
    if (res.statusCode >= 400 && req.imageUrl) deleteUploadedFile(req.imageUrl);
  });
  next();
}

const router = Router();

router.get('/', listTreatments);
router.get('/:id', getTreatment);

router.post('/', authenticate, requireRole('ADMIN'), upload.single('image'), compressAndSave, mergeImageUrl, cleanupOnError, validate(createTreatmentSchema), createTreatment);
router.put('/:id', authenticate, requireRole('ADMIN'), upload.single('image'), compressAndSave, mergeImageUrl, cleanupOnError, validate(updateTreatmentSchema), updateTreatment);
router.delete('/:id', authenticate, requireRole('ADMIN'), deleteTreatment);

module.exports = router;
