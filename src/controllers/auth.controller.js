const bcrypt = require('bcrypt');
const ms = require('ms');
const prisma = require('../services/prisma.service');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../services/auth.service');
const { JWT_REFRESH_EXPIRES_IN } = require('../config/env');
const logger = require('../config/logger');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      logger.warn({ event: 'login_user_not_found', email, ip: req.ip, path: req.originalUrl }, 'Login failed: user not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      logger.warn({ event: 'login_wrong_password', userId: user.id, ip: req.ip, path: req.originalUrl }, 'Login failed: wrong password');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    const expiresAt = new Date(Date.now() + ms(JWT_REFRESH_EXPIRES_IN));
    // Persist new token and clean up expired tokens for this user in one go
    await prisma.$transaction([
      prisma.refreshToken.create({
        data: { token: refreshToken, userId: user.id, expiresAt },
      }),
      prisma.refreshToken.deleteMany({
        where: { userId: user.id, expiresAt: { lt: new Date() } },
      }),
    ]);

    logger.info({ event: 'login_success', userId: user.id, ip: req.ip, path: req.originalUrl }, 'Login successful');

    return res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'refreshToken is required' });
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!stored || stored.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Refresh token not found or expired' });
    }

    const newAccessToken = generateAccessToken(payload.sub);
    logger.info({ event: 'token_refresh', userId: payload.sub, ip: req.ip, path: req.originalUrl }, 'Token refreshed');
    return res.json({ accessToken: newAccessToken });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'refreshToken is required' });
    }

    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    logger.info({ event: 'logout', ip: req.ip, path: req.originalUrl }, 'User logged out');
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { login, refresh, logout };
