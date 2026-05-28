const bcrypt = require('bcrypt');
const ms = require('ms');
const prisma = require('../services/prisma.service');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
} = require('../services/auth.service');
const { JWT_REFRESH_EXPIRES_IN } = require('../config/env');
const logger = require('../config/logger');

const DUMMY_HASH = '$2b$12$invalidhashfortimingXXXXXXXXXXXXXXXXXXXXXXXXXX';

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    const hashToCompare = user ? user.password : DUMMY_HASH;
    const valid = await bcrypt.compare(password, hashToCompare);

    if (!user) {
      logger.warn({ event: 'login_user_not_found', ip: req.ip, path: req.originalUrl }, 'Login failed: user not found');
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    if (!valid) {
      logger.warn({ event: 'login_wrong_password', userId: user.id, ip: req.ip, path: req.originalUrl }, 'Login failed: wrong password');
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id, user.role);

    const expiresAt = new Date(Date.now() + ms(JWT_REFRESH_EXPIRES_IN));
    // Store hashed token — raw token never touches DB
    await prisma.$transaction([
      prisma.refreshToken.create({
        data: { token: hashToken(refreshToken), userId: user.id, expiresAt },
      }),
      prisma.refreshToken.deleteMany({
        where: { userId: user.id, expiresAt: { lt: new Date() } },
      }),
    ]);

    logger.info({ event: 'login_success', userId: user.id, ip: req.ip, path: req.originalUrl }, 'Login successful');

    return res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'El refreshToken es requerido' });
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ error: 'Token de refresco inválido o expirado' });
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { token: hashToken(refreshToken) },
    });

    if (!stored || stored.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Token de refresco no encontrado o expirado' });
    }

    const newAccessToken = generateAccessToken(payload.sub, payload.role);
    const newRefreshToken = generateRefreshToken(payload.sub, payload.role);
    const expiresAt = new Date(Date.now() + ms(JWT_REFRESH_EXPIRES_IN));

    await prisma.$transaction([
      prisma.refreshToken.delete({ where: { token: hashToken(refreshToken) } }),
      prisma.refreshToken.create({
        data: { token: hashToken(newRefreshToken), userId: payload.sub, expiresAt },
      }),
    ]);

    logger.info({ event: 'token_refresh', userId: payload.sub, ip: req.ip, path: req.originalUrl }, 'Token refreshed');
    return res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'El refreshToken es requerido' });
    }

    await prisma.refreshToken.deleteMany({ where: { token: hashToken(refreshToken), userId: req.user.id } });
    logger.info({ event: 'logout', ip: req.ip, path: req.originalUrl }, 'User logged out');
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { login, refresh, logout };
