const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const crypto = require('crypto');

function hashIp(ip) {
  return crypto.createHash('sha256').update(ip ?? 'unknown').digest('hex');
}

// Limita la validación pública de tokens para frenar fuerza bruta/enumeración.
// In-memory (default store): suficiente para anti-enumeración, sin coste de BD por GET.
const validateRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: (req) => hashIp(ipKeyGenerator(req.ip)),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'RATE_LIMITED' },
});

// Alta de leads: un formulario legítimo se envía una vez, no diez por minuto.
const leadRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: (req) => hashIp(ipKeyGenerator(req.ip)),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'RATE_LIMITED' },
});

module.exports = { validateRateLimiter, leadRateLimiter, hashIp };
