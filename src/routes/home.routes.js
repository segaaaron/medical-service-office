const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { upsertHomeSchema } = require('../schemas/index');
const { getHome, upsertHome } = require('../controllers/home.controller');

const router = Router();

router.get('/', getHome);

router.put('/', authenticate, validate(upsertHomeSchema), upsertHome);

module.exports = router;
