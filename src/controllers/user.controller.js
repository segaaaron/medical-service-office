const bcrypt = require('bcrypt');
const prisma = require('../services/prisma.service');
const logger = require('../config/logger');
const { BCRYPT_SALT_ROUNDS } = require('../config/env');
const { parsePagination } = require('../utils/pagination');

function safeUser(user) {
  const { password, ...rest } = user;
  return rest;
}

async function getMe(req, res, next) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    return res.json(safeUser(user));
  } catch (err) {
    next(err);
  }
}

async function listUsers(req, res, next) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const [users, total] = await Promise.all([
      prisma.user.findMany({ orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.user.count(),
    ]);
    return res.json({ data: users.map(safeUser), total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

async function getUser(req, res, next) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    return res.json(safeUser(user));
  } catch (err) {
    next(err);
  }
}

async function createUser(req, res, next) {
  try {
    const { email, name, password } = req.body;
    const hashed = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const user = await prisma.user.create({ data: { email, name, password: hashed } });
    logger.info({ event: 'user_created', userId: user.id, ip: req.ip, path: req.originalUrl }, 'User created');
    return res.status(201).json(safeUser(user));
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'El correo electrónico ya está registrado' });
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const { email, name, password } = req.body;
    const data = {};
    if (email !== undefined) data.email = email;
    if (name !== undefined) data.name = name;
    if (password !== undefined) data.password = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    const user = await prisma.user.update({ where: { id: req.params.id }, data });
    logger.info({ event: 'user_updated', userId: user.id, ip: req.ip, path: req.originalUrl }, 'User updated');
    return res.json(safeUser(user));
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Usuario no encontrado' });
    if (err.code === 'P2002') return res.status(409).json({ error: 'El correo electrónico ya está registrado' });
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
    }
    await prisma.user.delete({ where: { id: req.params.id } });
    logger.info({ event: 'user_deleted', userId: req.params.id, ip: req.ip, path: req.originalUrl }, 'User deleted');
    return res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Usuario no encontrado' });
    next(err);
  }
}

module.exports = { getMe, listUsers, getUser, createUser, updateUser, deleteUser };
