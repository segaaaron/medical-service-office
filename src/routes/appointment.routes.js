const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const {
  listAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} = require('../controllers/appointment.controller');
const { createRateLimit } = require('../middlewares/rate-limit.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createAppointmentSchema } = require('../schemas/index');

const appointmentRateLimit = createRateLimit(5, 60 * 60 * 1000); // 5 req / hour

const router = Router();

// Public — patients can create an appointment request
router.post('/', appointmentRateLimit, validate(createAppointmentSchema), createAppointment);

// Protected — only authenticated admins can manage appointments
router.get('/', authenticate, listAppointments);
router.get('/:id', authenticate, getAppointment);
router.put('/:id', authenticate, updateAppointment);
router.delete('/:id', authenticate, deleteAppointment);

module.exports = router;
