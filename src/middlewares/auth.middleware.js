const { verifyAccessToken } = require('../services/auth.service');
const prisma = require('../services/prisma.service');
const logger = require('../config/logger');

async function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    logger.warn({ event: 'auth_missing_token', ip: req.ip, path: req.originalUrl }, 'Missing or malformed Authorization header');
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true },
    });
    if (!user) {
      logger.warn({ event: 'auth_user_not_found', userId: payload.sub, ip: req.ip, path: req.originalUrl }, 'Token valid but user not found');
      return res.status(401).json({ error: 'Invalid or expired access token' });
    }
    req.user = { id: user.id, role: user.role };
    next();
  } catch {
    logger.warn({ event: 'auth_invalid_token', ip: req.ip, path: req.originalUrl }, 'Invalid or expired access token');
    return res.status(401).json({ error: 'Invalid or expired access token' });
  }
}

module.exports = { authenticate };
