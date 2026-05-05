const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/requireRole.middleware');
const { upload, compressAndSave, mergeImageUrl } = require('../middlewares/upload.middleware');
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

router.get('/', listTreatments);
router.get('/:id', getTreatment);

router.post('/', authenticate, requireRole('ADMIN'), upload.single('image'), compressAndSave, mergeImageUrl, validate(createTreatmentSchema), createTreatment);
router.put('/:id', authenticate, requireRole('ADMIN'), upload.single('image'), compressAndSave, mergeImageUrl, validate(updateTreatmentSchema), updateTreatment);
router.delete('/:id', authenticate, requireRole('ADMIN'), deleteTreatment);

module.exports = router;
