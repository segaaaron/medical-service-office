const bcrypt = require('bcrypt');
const prisma = require('../services/prisma.service');
const logger = require('../config/logger');

const SALT_ROUNDS = 10;
const STRONG_PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;

function safeUser(user) {
  const { password, ...rest } = user;
  return rest;
}

async function getMe(req, res, next) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(safeUser(user));
  } catch (err) {
    next(err);
  }
}

async function listUsers(req, res, next) {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    return res.json(users.map(safeUser));
  } catch (err) {
    next(err);
  }
}

async function getUser(req, res, next) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(safeUser(user));
  } catch (err) {
    next(err);
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function createUser(req, res, next) {
  try {
    const { email, name, password } = req.body;
    if (!email || !name || !password) {
      return res.status(400).json({ error: 'email, name, and password are required' });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'email must be a valid email address' });
    }
    if (!STRONG_PASSWORD_RE.test(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character' });
    }
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: { email, name, password: hashed },
    });
    logger.info({ event: 'user_created', userId: user.id, ip: req.ip, path: req.originalUrl }, 'User created');
    return res.status(201).json(safeUser(user));
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Email already in use' });
    }
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const { email, name, password } = req.body;
    const data = {};
    if (email) data.email = email;
    if (name) data.name = name;
    if (password) {
      if (!STRONG_PASSWORD_RE.test(password)) {
        return res.status(400).json({ error: 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character' });
      }
      data.password = await bcrypt.hash(password, SALT_ROUNDS);
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
    });
    logger.info({ event: 'user_updated', userId: user.id, ip: req.ip, path: req.originalUrl }, 'User updated');
    return res.json(safeUser(user));
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'User not found' });
    if (err.code === 'P2002') return res.status(409).json({ error: 'Email already in use' });
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    logger.info({ event: 'user_deleted', userId: req.params.id, ip: req.ip, path: req.originalUrl }, 'User deleted');
    return res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'User not found' });
    next(err);
  }
}

module.exports = { getMe, listUsers, getUser, createUser, updateUser, deleteUser };
