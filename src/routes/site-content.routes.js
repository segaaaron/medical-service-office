const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { upsertSiteContentSchema } = require('../schemas/index');
const {
  getSiteContent,
  listSiteContent,
  upsertSiteContent,
  deleteSiteContent,
} = require('../controllers/site-content.controller');

const router = Router();

// Public — fetch content by key
router.get('/', listSiteContent);
router.get('/:key', getSiteContent);

// Protected — only authenticated admins
router.put('/', authenticate, validate(upsertSiteContentSchema), upsertSiteContent);
router.delete('/:key', authenticate, deleteSiteContent);

module.exports = router;
