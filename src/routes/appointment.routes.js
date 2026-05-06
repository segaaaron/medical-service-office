const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/requireRole.middleware');
const {
  createAppointment,
  updateAppointment,
  deleteAppointment,
} = require('../controllers/appointment.controller');
const { validate } = require('../middlewares/validate.middleware');
const { createAppointmentSchema, updateAppointmentSchema } = require('../schemas/index');

const { APPOINTMENT_RATE_LIMIT_MAX, APPOINTMENT_RATE_LIMIT_WINDOW_MS } = require('../config/env');

const appointmentRateLimit = rateLimit({
  windowMs: APPOINTMENT_RATE_LIMIT_WINDOW_MS,
  max: APPOINTMENT_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes de cita. Por favor intenta en una hora.' },
});

const router = Router();

router.post('/', appointmentRateLimit, validate(createAppointmentSchema), createAppointment);
router.put('/:id', authenticate, requireRole('ADMIN'), validate(updateAppointmentSchema), updateAppointment);
router.delete('/:id', authenticate, requireRole('ADMIN'), deleteAppointment);

module.exports = router;
