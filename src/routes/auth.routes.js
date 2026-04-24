const { Router } = require('express');
const { login, refresh, logout } = require('../controllers/auth.controller');
const { createRateLimit } = require('../middlewares/rate-limit.middleware');
const { loginRateLimiter } = require('../middlewares/loginRateLimit.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { loginSchema } = require('../schemas/index');

const refreshRateLimit = createRateLimit(20, 15 * 60 * 1000); // 20 req / 15 min

const router = Router();

router.post('/login',   loginRateLimiter, validate(loginSchema), login);
router.post('/refresh', refreshRateLimit, refresh);
router.post('/logout',  logout);

module.exports = router;
