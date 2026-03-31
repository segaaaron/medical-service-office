/**
 * Simple in-memory rate limiter middleware factory.
 * Tracks requests per IP using a Map and cleans up expired entries.
 *
 * @param {number} maxRequests - Maximum number of requests allowed in the window
 * @param {number} windowMs   - Time window in milliseconds
 * @returns Express middleware
 */
function createRateLimit(maxRequests, windowMs) {
  // Map<ip, { count: number, resetAt: number }>
  const store = new Map();

  return function rateLimitMiddleware(req, res, next) {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    // Clean up expired entries periodically (every request on this instance)
    for (const [key, record] of store.entries()) {
      if (now > record.resetAt) {
        store.delete(key);
      }
    }

    const record = store.get(ip);

    if (!record || now > record.resetAt) {
      // First request or window expired — start fresh
      store.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
      res.set('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        error: 'Too many requests, please try again later.',
        retryAfter: retryAfterSec,
      });
    }

    record.count += 1;
    return next();
  };
}

module.exports = { createRateLimit };
