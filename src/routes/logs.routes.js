const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/requireRole.middleware');
const { listErrorLogs } = require('../controllers/logs.controller');

const router = Router();

// Logs de errores de backend — acceso restringido a ADMIN.
router.get('/', authenticate, requireRole('ADMIN'), listErrorLogs);

module.exports = router;
