const { Router } = require('express');
const { login, refresh, logout } = require('../controllers/auth.controller');
const { createRateLimit } = require('../middlewares/rate-limit.middleware');
const { loginRateLimiter } = require('../middlewares/loginRateLimit.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { loginSchema, refreshTokenSchema } = require('../schemas/index');
const { REFRESH_RATE_LIMIT_MAX, REFRESH_RATE_LIMIT_WINDOW_MS } = require('../config/env');

const refreshRateLimit = createRateLimit(REFRESH_RATE_LIMIT_MAX, REFRESH_RATE_LIMIT_WINDOW_MS);

const router = Router();

router.post('/login',   loginRateLimiter, validate(loginSchema), login);
router.post('/refresh', refreshRateLimit, validate(refreshTokenSchema), refresh);
router.post('/logout',  authenticate, validate(refreshTokenSchema), logout);

module.exports = router;
