jest.mock('../../services/prisma.service', () => ({
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
}));
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
}));
jest.mock('../../config/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }));

const prisma = require('../../services/prisma.service');
const { getMe, listUsers, getUser, createUser, updateUser, deleteUser } = require('../../controllers/user.controller');
const { mockReq, mockRes, mockNext } = require('../helpers/mock-req-res');

const USER = { id: 'uid-1', email: 'admin@test.com', name: 'Admin', role: 'ADMIN', password: 'hashed' };
const SAFE_USER = { id: 'uid-1', email: 'admin@test.com', name: 'Admin', role: 'ADMIN' };

describe('user.controller', () => {
  describe('getMe', () => {
    it('returns 404 when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const req = mockReq({ user: { id: 'uid-x' } });
      const res = mockRes();
      await getMe(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns user without password', async () => {
      prisma.user.findUnique.mockResolvedValue(USER);
      const req = mockReq({ user: { id: 'uid-1' } });
      const res = mockRes();
      await getMe(req, res, mockNext());
      const response = res.json.mock.calls[0][0];
      expect(response).not.toHaveProperty('password');
      expect(response).toMatchObject(SAFE_USER);
    });
  });

  describe('listUsers', () => {
    it('returns paginated users without passwords', async () => {
      prisma.user.findMany.mockResolvedValue([USER]);
      prisma.user.count.mockResolvedValue(1);
      const req = mockReq({ query: {} });
      const res = mockRes();
      await listUsers(req, res, mockNext());
      const response = res.json.mock.calls[0][0];
      expect(response.data[0]).not.toHaveProperty('password');
      expect(response.total).toBe(1);
    });
  });

  describe('getUser', () => {
    it('returns 404 when not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const req = mockReq({ params: { id: 'uid-x' } });
      const res = mockRes();
      await getUser(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns user without password', async () => {
      prisma.user.findUnique.mockResolvedValue(USER);
      const req = mockReq({ params: { id: 'uid-1' } });
      const res = mockRes();
      await getUser(req, res, mockNext());
      expect(res.json.mock.calls[0][0]).not.toHaveProperty('password');
    });
  });

  describe('createUser', () => {
    it('returns 409 on duplicate email (P2002)', async () => {
      prisma.user.create.mockRejectedValue(Object.assign(new Error(), { code: 'P2002' }));
      const req = mockReq({ body: { email: 'dup@test.com', name: 'Dup', password: 'Pass1234!' }, ip: '127.0.0.1', originalUrl: '/api/users' });
      const res = mockRes();
      await createUser(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('creates user with 201 without password in response', async () => {
      prisma.user.create.mockResolvedValue(USER);
      const req = mockReq({ body: { email: 'new@test.com', name: 'Nuevo', password: 'Pass1234!' }, ip: '127.0.0.1', originalUrl: '/api/users' });
      const res = mockRes();
      await createUser(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json.mock.calls[0][0]).not.toHaveProperty('password');
    });
  });

  describe('updateUser', () => {
    it('returns 404 on P2025', async () => {
      prisma.user.update.mockRejectedValue(Object.assign(new Error(), { code: 'P2025' }));
      const req = mockReq({ params: { id: 'uid-x' }, body: { name: 'X' }, ip: '127.0.0.1', originalUrl: '/api/users/uid-x' });
      const res = mockRes();
      await updateUser(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 409 on P2002 duplicate email', async () => {
      prisma.user.update.mockRejectedValue(Object.assign(new Error(), { code: 'P2002' }));
      const req = mockReq({ params: { id: 'uid-1' }, body: { email: 'dup@test.com' }, ip: '127.0.0.1', originalUrl: '/api/users/uid-1' });
      const res = mockRes();
      await updateUser(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('updates user and returns without password', async () => {
      prisma.user.update.mockResolvedValue(USER);
      const req = mockReq({ params: { id: 'uid-1' }, body: { name: 'Actualizado' }, ip: '127.0.0.1', originalUrl: '/api/users/uid-1' });
      const res = mockRes();
      await updateUser(req, res, mockNext());
      expect(res.json.mock.calls[0][0]).not.toHaveProperty('password');
    });
  });

  describe('deleteUser', () => {
    it('returns 400 when trying to delete own account', async () => {
      const req = mockReq({ params: { id: 'uid-1' }, user: { id: 'uid-1' }, ip: '127.0.0.1', originalUrl: '/api/users/uid-1' });
      const res = mockRes();
      await deleteUser(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 404 on P2025', async () => {
      prisma.user.delete.mockRejectedValue(Object.assign(new Error(), { code: 'P2025' }));
      const req = mockReq({ params: { id: 'uid-2' }, user: { id: 'uid-1' }, ip: '127.0.0.1', originalUrl: '/api/users/uid-2' });
      const res = mockRes();
      await deleteUser(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('deletes user with 204', async () => {
      prisma.user.delete.mockResolvedValue(USER);
      const req = mockReq({ params: { id: 'uid-2' }, user: { id: 'uid-1' }, ip: '127.0.0.1', originalUrl: '/api/users/uid-2' });
      const res = mockRes();
      await deleteUser(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(204);
    });
  });
});
