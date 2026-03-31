const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const {
  listTreatments,
  getTreatment,
  createTreatment,
  updateTreatment,
  deleteTreatment,
} = require('../controllers/treatment.controller');
const { validate } = require('../middlewares/validate.middleware');
const { createTreatmentSchema } = require('../schemas/index');

const router = Router();

// Public — anyone can view treatments
router.get('/', listTreatments);
router.get('/:id', getTreatment);

// Protected — only authenticated admins
router.post('/', authenticate, validate(createTreatmentSchema), createTreatment);
router.put('/:id', authenticate, validate(createTreatmentSchema), updateTreatment);
router.delete('/:id', authenticate, deleteTreatment);

module.exports = router;
