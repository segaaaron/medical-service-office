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

// Public — allow the website to load treatments without authentication
router.get('/', listTreatments);
router.get('/:id', getTreatment);

// Protected — only authenticated admins
router.post('/', authenticate, validate(createTreatmentSchema), createTreatment);
router.put('/:id', authenticate, validate(createTreatmentSchema), updateTreatment);
router.delete('/:id', authenticate, deleteTreatment);

module.exports = router;
