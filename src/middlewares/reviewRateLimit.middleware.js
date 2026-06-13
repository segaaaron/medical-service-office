const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const prisma = require('../services/prisma.service');

function hashIp(ip) {
  return crypto.createHash('sha256').update(ip ?? 'unknown').digest('hex');
}

// Prisma-backed store — persiste entre restarts, safe para multi-instancia
const prismaStore = {
  async increment(key) {
    const windowMs = 24 * 60 * 60 * 1000;
    const now = Date.now();

    const record = await prisma.rateLimit.upsert({
      where: { ipHash: key },
      create: {
        ipHash:  key,
        count:   1,
        resetAt: new Date(now + windowMs),
      },
      update: {
        // Si la ventana expiró, reinicia; si no, incrementa
        count: {
          increment: 1,
        },
        // resetAt solo se actualiza al crear — se preserva en update
      },
    });

    // Ventana expirada — reiniciar contador
    if (record.resetAt.getTime() <= now) {
      const reset = await prisma.rateLimit.update({
        where: { ipHash: key },
        data:  { count: 1, resetAt: new Date(now + windowMs) },
      });
      return { totalHits: reset.count, resetTime: reset.resetAt };
    }

    return { totalHits: record.count, resetTime: record.resetAt };
  },

  async decrement(key) {
    await prisma.rateLimit.updateMany({
      where: { ipHash: key, count: { gt: 0 } },
      data:  { count: { decrement: 1 } },
    });
  },

  async resetKey(key) {
    await prisma.rateLimit.deleteMany({ where: { ipHash: key } });
  },
};

const reviewRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 2,
  keyGenerator: (req) => hashIp(req.ip),
  skipSuccessfulRequests: false,
  standardHeaders: true,
  legacyHeaders: false,
  store: prismaStore,
  message: { error: 'RATE_LIMITED' },
});

// Limita la validación pública de tokens para frenar fuerza bruta/enumeración.
// In-memory (default store): suficiente para anti-enumeración, sin coste de BD por GET.
const validateRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: (req) => hashIp(req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'RATE_LIMITED' },
});

module.exports = { reviewRateLimiter, validateRateLimiter, hashIp };
