const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/requireRole.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { upsertFooterSchema } = require('../schemas/index');
const { getFooter, upsertFooter } = require('../controllers/footer.controller');

const router = Router();

router.get('/', getFooter);
router.put('/', authenticate, requireRole('ADMIN'), validate(upsertFooterSchema), upsertFooter);

module.exports = router;
