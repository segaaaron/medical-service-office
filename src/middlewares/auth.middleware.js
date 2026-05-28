const { verifyAccessToken } = require('../services/auth.service');
const logger = require('../config/logger');

function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    logger.warn({ event: 'auth_missing_token', ip: req.ip, path: req.originalUrl }, 'Missing or malformed Authorization header');
    return res.status(401).json({ error: 'Encabezado de autorización faltante o inválido' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    logger.warn({ event: 'auth_invalid_token', ip: req.ip, path: req.originalUrl }, 'Token de acceso inválido o expirado');
    return res.status(401).json({ error: 'Token de acceso inválido o expirado' });
  }
}

module.exports = { authenticate };
