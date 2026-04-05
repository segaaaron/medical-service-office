const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { upsertContactSchema } = require('../schemas/index');
const { getContact, upsertContact } = require('../controllers/contact.controller');

const router = Router();

// Public — fetch contact info
router.get('/', getContact);

// Protected — only authenticated admins
router.put('/', authenticate, validate(upsertContactSchema), upsertContact);

module.exports = router;
