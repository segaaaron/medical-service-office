const logger = require('../config/logger');

/**
 * Returns middleware that checks req.user.role against allowed roles.
 * Must be used after authenticate middleware.
 * @param  {...string} roles - Allowed roles (e.g. 'ADMIN', 'RECEPTIONIST')
 */
function requireRole(...roles) {
  return function requireRoleMiddleware(req, res, next) {
    if (!req.user || !roles.includes(req.user.role)) {
      logger.warn(
        { event: 'access_denied_role', userId: req.user?.id, role: req.user?.role, requiredRoles: roles, ip: req.ip, path: req.originalUrl },
        'Forbidden: insufficient role'
      );
      return res.status(403).json({ error: 'Acceso denegado: permisos insuficientes' });
    }
    next();
  };
}

module.exports = { requireRole };
