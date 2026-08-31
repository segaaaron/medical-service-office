const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/requireRole.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { leadRateLimiter } = require('../middlewares/reviewRateLimit.middleware');
const { createLeadSchema } = require('../schemas/index');
const { createLead, listLeads } = require('../controllers/leads.controller');

const router = Router();

// Pública: la escribe el formulario de contacto de la web. Con límite por IP
// para que un bot no llene la tabla.
router.post('/', leadRateLimiter, validate(createLeadSchema), createLead);

// Panel: solo ADMIN.
router.get('/', authenticate, requireRole('ADMIN'), listLeads);

module.exports = router;
