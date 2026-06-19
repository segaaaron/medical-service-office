const { Router } = require('express');
const { authenticate, optionalAuthenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/requireRole.middleware');
const { uploadTreatmentImages, compressTreatmentImages, deleteUploadedFile } = require('../middlewares/upload.middleware');
const {
  listTreatments,
  getTreatment,
  createTreatment,
  updateTreatment,
  deleteTreatment,
  reorderTreatments,
} = require('../controllers/treatment.controller');
const { validate } = require('../middlewares/validate.middleware');
const { createTreatmentSchema, updateTreatmentSchema } = require('../schemas/index');

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

router.get('/', optionalAuthenticate, listTreatments);
router.get('/:id', getTreatment);

router.patch('/reorder', authenticate, requireRole('ADMIN'), reorderTreatments);
router.post('/', authenticate, requireRole('ADMIN'), uploadTreatmentImages, compressTreatmentImages, cleanupOnError, validate(createTreatmentSchema), createTreatment);
router.put('/:id', authenticate, requireRole('ADMIN'), uploadTreatmentImages, compressTreatmentImages, cleanupOnError, validate(updateTreatmentSchema), updateTreatment);
router.delete('/:id', authenticate, requireRole('ADMIN'), deleteTreatment);

module.exports = router;
