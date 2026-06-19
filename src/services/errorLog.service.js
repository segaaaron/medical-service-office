const crypto = require('crypto');
const { Prisma } = require('@prisma/client');
const prisma = require('./prisma.service');
const logger = require('../config/logger');
const { ERROR_LOG_RETENTION_DAYS } = require('../config/env');
const { sanitizePayload } = require('../utils/sanitize');

/**
 * Persistencia de errores de backend (solo 5xx) en la tabla error_logs.
 *
 * Diseño:
 *  - NO bloqueante: el caller hace fire-and-forget (sin await). La escritura
 *    nunca se interpone en la latencia de la respuesta al cliente.
 *  - Nunca lanza: cualquier fallo al persistir se loguea con pino y se traga.
 *    Esto rompe la cadena de recursión: si la DB está caída, el error de
 *    persistencia NO vuelve a entrar al error.middleware.
 *  - Payload sanitizado (PII redactado) vía sanitizePayload.
 *  - Limpieza de retención probabilística (~2%): amortiza el coste sin cron ni
 *    timers, igual filosofía que el rate-limit basado en DB. O(1) amortizado.
 */

const CLEANUP_PROBABILITY = 0.02;

// Backpressure: tope de escrituras de log concurrentes. Bajo un storm de 5xx
// (típicamente CAUSADO por la DB), evita encolar creates ilimitados sobre el
// pool y amplificar la saturación. El excedente se descarta (se pierde la fila
// de log, no la respuesta al cliente).
const MAX_INFLIGHT = 50;
let inFlight = 0;

function hashIp(ip) {
  if (!ip) return null;
  return crypto.createHash('sha256').update(ip).digest('hex');
}

// Deriva el patrón de ruta montada (ej. "/api/treatments/:id") sin valores reales.
function resolveRoute(req) {
  const base = req.baseUrl || '';
  const routePath = req.route && req.route.path ? req.route.path : '';
  const full = `${base}${routePath}`.trim();
  return full ? full.slice(0, 255) : null;
}

/**
 * Construye el registro a persistir a partir del error y el request.
 * Síncrono y barato; se ejecuta en el path del request.
 */
function buildRecord(err, req, statusCode) {
  return {
    statusCode,
    name: err && err.name ? String(err.name).slice(0, 100) : null,
    code: err && err.code != null ? String(err.code).slice(0, 50) : null,
    message: err && err.message ? String(err.message) : null,
    stack: err && err.stack ? String(err.stack) : null,
    method: (req.method || 'UNKNOWN').slice(0, 10),
    // Solo el pathname: el query-string crudo puede llevar PII/secretos sin
    // redactar. La query ya se persiste sanitizada en la columna `query`.
    path: (req.originalUrl || req.url || '').split('?')[0].slice(0, 8192),
    route: resolveRoute(req),
    body: sanitizePayload(req.body),
    query: sanitizePayload(req.query),
    params: sanitizePayload(req.params),
    ipHash: hashIp(req.ip),
    userId: req.user && req.user.id ? String(req.user.id).slice(0, 64) : null,
    requestId: req.headers && req.headers['x-request-id']
      ? String(req.headers['x-request-id']).slice(0, 64)
      : null,
  };
}

async function purgeOld() {
  const cutoff = new Date(Date.now() - ERROR_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  try {
    const { count } = await prisma.errorLog.deleteMany({ where: { createdAt: { lt: cutoff } } });
    if (count > 0) logger.info({ event: 'error_log_purge', count }, 'Purged old error logs');
  } catch (e) {
    logger.warn({ err: e }, 'error_log purge failed');
  }
}

/**
 * Persiste un error. Fire-and-forget: el caller NO debe await-earlo.
 * Devuelve la promesa por testabilidad, pero ya viene con .catch interno.
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {number} statusCode
 * @returns {Promise<void>}
 */
function recordError(err, req, statusCode) {
  let record;
  try {
    record = buildRecord(err, req, statusCode);
  } catch (e) {
    logger.warn({ err: e }, 'error_log buildRecord failed');
    return Promise.resolve();
  }

  if (inFlight >= MAX_INFLIGHT) {
    logger.warn({ event: 'error_log_dropped', inFlight }, 'error_log dropped (backpressure)');
    return Promise.resolve();
  }

  // Prisma exige Prisma.DbNull (no null plano) para fijar columnas Json? a NULL.
  const data = {
    ...record,
    body: record.body ?? Prisma.DbNull,
    query: record.query ?? Prisma.DbNull,
    params: record.params ?? Prisma.DbNull,
  };

  inFlight++;
  return prisma.errorLog
    .create({ data })
    .then(() => {
      if (Math.random() < CLEANUP_PROBABILITY) return purgeOld();
    })
    .catch((e) => {
      // Tragar SIEMPRE: nunca propagar al error.middleware (anti-recursión).
      logger.error({ err: e }, 'Failed to persist error log');
    })
    .finally(() => { inFlight--; });
}

module.exports = { recordError, buildRecord, purgeOld, hashIp };
