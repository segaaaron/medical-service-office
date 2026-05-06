jest.mock('../../services/prisma.service', () => ({
  user: { findUnique: jest.fn() },
  refreshToken: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  $transaction: jest.fn(),
}));
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));
jest.mock('../../services/auth.service', () => ({
  generateAccessToken: jest.fn().mockReturnValue('access-token'),
  generateRefreshToken: jest.fn().mockReturnValue('refresh-token'),
  verifyRefreshToken: jest.fn(),
  hashToken: jest.fn().mockReturnValue('hashed-token'),
}));
jest.mock('../../config/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }));

const prisma = require('../../services/prisma.service');
const bcrypt = require('bcrypt');
const { verifyRefreshToken } = require('../../services/auth.service');
const { login, refresh, logout } = require('../../controllers/auth.controller');
const { mockReq, mockRes, mockNext } = require('../helpers/mock-req-res');

const USER = { id: 'uid-1', email: 'admin@test.com', name: 'Admin', role: 'ADMIN', password: 'hashed' };

describe('auth.controller', () => {
  describe('login', () => {
    it('returns 401 when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const req = mockReq({ body: { email: 'no@test.com', password: '123' } });
      const res = mockRes();
      await login(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 401 on wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue(USER);
      bcrypt.compare.mockResolvedValue(false);
      const req = mockReq({ body: { email: USER.email, password: 'wrong' } });
      const res = mockRes();
      await login(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns tokens and user on success', async () => {
      prisma.user.findUnique.mockResolvedValue(USER);
      bcrypt.compare.mockResolvedValue(true);
      prisma.$transaction.mockResolvedValue([]);
      const req = mockReq({ body: { email: USER.email, password: 'correct' } });
      const res = mockRes();
      await login(req, res, mockNext());
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: expect.objectContaining({ id: USER.id, role: USER.role }),
      }));
    });
  });

  describe('refresh', () => {
    it('returns 400 when no refreshToken provided', async () => {
      const req = mockReq({ body: {} });
      const res = mockRes();
      await refresh(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 401 when token verification fails', async () => {
      verifyRefreshToken.mockImplementation(() => { throw new Error('invalid'); });
      const req = mockReq({ body: { refreshToken: 'bad-token' } });
      const res = mockRes();
      await refresh(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 401 when token not found in DB', async () => {
      verifyRefreshToken.mockReturnValue({ sub: 'uid-1' });
      prisma.refreshToken.findUnique.mockResolvedValue(null);
      const req = mockReq({ body: { refreshToken: 'old-token' } });
      const res = mockRes();
      await refresh(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns new tokens on success', async () => {
      verifyRefreshToken.mockReturnValue({ sub: 'uid-1' });
      prisma.refreshToken.findUnique.mockResolvedValue({
        token: 'hashed-token',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      });
      prisma.$transaction.mockResolvedValue([]);
      const req = mockReq({ body: { refreshToken: 'valid-token' } });
      const res = mockRes();
      await refresh(req, res, mockNext());
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }));
    });
  });

  describe('logout', () => {
    it('returns 400 when no refreshToken provided', async () => {
      const req = mockReq({ body: {}, user: { id: 'uid-1' } });
      const res = mockRes();
      await logout(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('deletes token and returns 204', async () => {
      prisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });
      const req = mockReq({ body: { refreshToken: 'some-token' }, user: { id: 'uid-1' } });
      const res = mockRes();
      await logout(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(204);
    });
  });
});
