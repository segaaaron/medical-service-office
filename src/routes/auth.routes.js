const { Router } = require('express');
const { login, refresh, logout } = require('../controllers/auth.controller');
const { loginRateLimiter } = require('../middlewares/loginRateLimit.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { loginSchema, refreshTokenSchema } = require('../schemas/index');

const router = Router();

router.post('/login',   loginRateLimiter, validate(loginSchema), login);
router.post('/refresh', validate(refreshTokenSchema), refresh);
router.post('/logout',  authenticate, validate(refreshTokenSchema), logout);

module.exports = router;
