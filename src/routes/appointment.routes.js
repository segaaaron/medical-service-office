const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/requireRole.middleware');
const {
  listAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} = require('../controllers/appointment.controller');
const { validate } = require('../middlewares/validate.middleware');
const { createAppointmentSchema } = require('../schemas/index');

const appointmentRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes de cita. Por favor intenta en una hora.' },
});

const router = Router();

// Public — patients can create an appointment request
router.post('/', appointmentRateLimit, validate(createAppointmentSchema), createAppointment);

// Protected — only authenticated admins can manage appointments
router.get('/', authenticate, listAppointments);
router.get('/:id', authenticate, getAppointment);
router.put('/:id', authenticate, requireRole('ADMIN', 'RECEPTIONIST'), updateAppointment);
router.delete('/:id', authenticate, requireRole('ADMIN', 'RECEPTIONIST'), deleteAppointment);

module.exports = router;
