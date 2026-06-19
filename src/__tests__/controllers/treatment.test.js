jest.mock('../../services/prisma.service', () => ({
  treatment: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  $executeRaw: jest.fn(),
}));
jest.mock('../../middlewares/upload.middleware', () => ({
  deleteUploadedFile: jest.fn(),
}));

const prisma = require('../../services/prisma.service');
const { deleteUploadedFile } = require('../../middlewares/upload.middleware');
const {
  listTreatments, getTreatment, createTreatment, updateTreatment, deleteTreatment, reorderTreatments,
} = require('../../controllers/treatment.controller');
const { mockReq, mockRes, mockNext } = require('../helpers/mock-req-res');

const TREATMENT = { id: 'tid-1', name: 'Botox', slug: 'botox', active: true, imageUrl: '/uploads/t.webp' };

describe('treatment.controller', () => {
  describe('listTreatments', () => {
    it('returns a full array when no page param (sitemap/SSG/reorder)', async () => {
      prisma.treatment.findMany.mockResolvedValue([TREATMENT]);
      const req = mockReq({ query: {} });
      const res = mockRes();
      await listTreatments(req, res, mockNext());
      expect(res.json).toHaveBeenCalledWith([TREATMENT]);
      // sin page → NO se hace count
      expect(prisma.treatment.count).not.toHaveBeenCalled();
    });

    it('returns a full array with ?all=true (even if page also present)', async () => {
      prisma.treatment.findMany.mockResolvedValue([TREATMENT]);
      const req = mockReq({ query: { all: 'true', page: '2' } });
      const res = mockRes();
      await listTreatments(req, res, mockNext());
      expect(res.json).toHaveBeenCalledWith([TREATMENT]);
      expect(prisma.treatment.count).not.toHaveBeenCalled();
    });

    it('returns a paginated object with backend limit=8 when page is present', async () => {
      prisma.treatment.findMany.mockResolvedValue([TREATMENT]);
      prisma.treatment.count.mockResolvedValue(20);
      const req = mockReq({ query: { page: '2' } });
      const res = mockRes();
      await listTreatments(req, res, mockNext());
      expect(prisma.treatment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 8, take: 8 })
      );
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [TREATMENT], total: 20, page: 2, limit: 8, totalPages: 3,
      }));
    });

    it('non-admin only sees active; admin sees all', async () => {
      prisma.treatment.findMany.mockResolvedValue([]);
      const pub = mockReq({ query: {} });
      await listTreatments(pub, mockRes(), mockNext());
      expect(prisma.treatment.findMany).toHaveBeenLastCalledWith(
        expect.objectContaining({ where: { active: true } })
      );
      const admin = mockReq({ query: {}, user: { role: 'ADMIN' } });
      await listTreatments(admin, mockRes(), mockNext());
      expect(prisma.treatment.findMany).toHaveBeenLastCalledWith(
        expect.objectContaining({ where: {} })
      );
    });
  });

  describe('getTreatment', () => {
    it('returns 404 when not found', async () => {
      prisma.treatment.findUnique.mockResolvedValue(null);
      const req = mockReq({ params: { id: 'tid-x' } });
      const res = mockRes();
      await getTreatment(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns treatment', async () => {
      prisma.treatment.findUnique.mockResolvedValue(TREATMENT);
      const req = mockReq({ params: { id: 'tid-1' } });
      const res = mockRes();
      await getTreatment(req, res, mockNext());
      expect(res.json).toHaveBeenCalledWith(TREATMENT);
    });
  });

  describe('createTreatment', () => {
    it('returns 400 when name cannot generate slug', async () => {
      const req = mockReq({ body: { name: '@@@' } });
      const res = mockRes();
      await createTreatment(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 409 on P2002 duplicate', async () => {
      prisma.treatment.create.mockRejectedValue(Object.assign(new Error(), { code: 'P2002' }));
      const req = mockReq({ body: { name: 'Botox' } });
      const res = mockRes();
      await createTreatment(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('creates treatment with 201', async () => {
      prisma.treatment.create.mockResolvedValue(TREATMENT);
      const req = mockReq({ body: { name: 'Botox' } });
      const res = mockRes();
      await createTreatment(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(TREATMENT);
    });

    it('defaults active to false', async () => {
      prisma.treatment.create.mockResolvedValue(TREATMENT);
      const req = mockReq({ body: { name: 'Nuevo' } });
      const res = mockRes();
      await createTreatment(req, res, mockNext());
      const createCall = prisma.treatment.create.mock.calls[0][0];
      expect(createCall.data.active).toBe(false);
    });

    it('persists before/after image urls when provided', async () => {
      prisma.treatment.create.mockResolvedValue(TREATMENT);
      const req = mockReq({ body: {
        name: 'Nuevo',
        beforeImageUrl: '/uploads/b.webp',
        afterImageUrl: '/uploads/a.webp',
      } });
      await createTreatment(req, mockRes(), mockNext());
      const { data } = prisma.treatment.create.mock.calls[0][0];
      expect(data.beforeImageUrl).toBe('/uploads/b.webp');
      expect(data.afterImageUrl).toBe('/uploads/a.webp');
    });

    it('defaults before/after to null when absent', async () => {
      prisma.treatment.create.mockResolvedValue(TREATMENT);
      const req = mockReq({ body: { name: 'Nuevo' } });
      await createTreatment(req, mockRes(), mockNext());
      const { data } = prisma.treatment.create.mock.calls[0][0];
      expect(data.beforeImageUrl).toBeNull();
      expect(data.afterImageUrl).toBeNull();
    });
  });

  describe('updateTreatment', () => {
    it('returns 404 when not found', async () => {
      prisma.treatment.findUnique.mockResolvedValue(null);
      const req = mockReq({ params: { id: 'tid-x' }, body: { name: 'X' } });
      const res = mockRes();
      await updateTreatment(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('deletes old image when new image uploaded', async () => {
      prisma.treatment.findUnique.mockResolvedValue(TREATMENT);
      prisma.treatment.update.mockResolvedValue(TREATMENT);
      const req = mockReq({ params: { id: 'tid-1' }, body: { imageUrl: '/uploads/new.webp' } });
      const res = mockRes();
      await updateTreatment(req, res, mockNext());
      expect(deleteUploadedFile).toHaveBeenCalledWith(TREATMENT.imageUrl);
    });

    it('removes before image (null) and deletes old file', async () => {
      const cur = { ...TREATMENT, beforeImageUrl: '/uploads/old-b.webp' };
      prisma.treatment.findUnique.mockResolvedValue(cur);
      prisma.treatment.update.mockResolvedValue(cur);
      const req = mockReq({ params: { id: 'tid-1' }, body: { beforeImageUrl: null } });
      await updateTreatment(req, mockRes(), mockNext());
      expect(deleteUploadedFile).toHaveBeenCalledWith('/uploads/old-b.webp');
      expect(prisma.treatment.update.mock.calls[0][0].data.beforeImageUrl).toBeNull();
    });

    it('does not touch before/after when fields absent', async () => {
      prisma.treatment.findUnique.mockResolvedValue(TREATMENT);
      prisma.treatment.update.mockResolvedValue(TREATMENT);
      const req = mockReq({ params: { id: 'tid-1' }, body: { name: 'X' } });
      await updateTreatment(req, mockRes(), mockNext());
      const { data } = prisma.treatment.update.mock.calls[0][0];
      expect('beforeImageUrl' in data).toBe(false);
      expect('afterImageUrl' in data).toBe(false);
    });

    it('returns 409 on P2002', async () => {
      prisma.treatment.findUnique.mockResolvedValue(TREATMENT);
      prisma.treatment.update.mockRejectedValue(Object.assign(new Error(), { code: 'P2002' }));
      const req = mockReq({ params: { id: 'tid-1' }, body: { name: 'Duplicado' } });
      const res = mockRes();
      await updateTreatment(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe('reorderTreatments', () => {
    const VALID_ITEMS = [
      { id: 'tid-1', order: 0 },
      { id: 'tid-2', order: 1 },
    ];

    beforeEach(() => {
      jest.clearAllMocks();
      prisma.treatment.update.mockResolvedValue({});
      prisma.$executeRaw.mockResolvedValue(2);
    });

    it('returns 400 when body is not an array', async () => {
      const req = mockReq({ body: { id: 'tid-1', order: 0 } });
      const res = mockRes();
      await reorderTreatments(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when body is empty array', async () => {
      const req = mockReq({ body: [] });
      const res = mockRes();
      await reorderTreatments(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when id is empty string', async () => {
      const req = mockReq({ body: [{ id: '', order: 0 }] });
      const res = mockRes();
      await reorderTreatments(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when order is a float', async () => {
      const req = mockReq({ body: [{ id: 'tid-1', order: 1.5 }] });
      const res = mockRes();
      await reorderTreatments(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when order is negative', async () => {
      const req = mockReq({ body: [{ id: 'tid-1', order: -1 }] });
      const res = mockRes();
      await reorderTreatments(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when order exceeds INT max', async () => {
      const req = mockReq({ body: [{ id: 'tid-1', order: 2_147_483_648 }] });
      const res = mockRes();
      await reorderTreatments(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when body contains duplicate ids', async () => {
      const req = mockReq({ body: [{ id: 'tid-1', order: 0 }, { id: 'tid-1', order: 1 }] });
      const res = mockRes();
      await reorderTreatments(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('passes DB errors to next', async () => {
      const dbErr = new Error('db down');
      prisma.$executeRaw.mockRejectedValue(dbErr);
      const req = mockReq({ body: VALID_ITEMS });
      const res = mockRes();
      const next = mockNext();
      await reorderTreatments(req, res, next);
      expect(next).toHaveBeenCalledWith(dbErr);
    });

    it('returns { ok: true } on success', async () => {
      prisma.$executeRaw.mockResolvedValue(2);
      const req = mockReq({ body: VALID_ITEMS });
      const res = mockRes();
      await reorderTreatments(req, res, mockNext());
      expect(res.json).toHaveBeenCalledWith({ ok: true });
      expect(prisma.$executeRaw).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteTreatment', () => {
    it('returns 404 on P2025', async () => {
      prisma.treatment.findUnique.mockResolvedValue(null);
      prisma.treatment.delete.mockRejectedValue(Object.assign(new Error(), { code: 'P2025' }));
      const req = mockReq({ params: { id: 'tid-x' } });
      const res = mockRes();
      await deleteTreatment(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 409 when treatment has appointments (P2003)', async () => {
      prisma.treatment.findUnique.mockResolvedValue(TREATMENT);
      prisma.treatment.delete.mockRejectedValue(Object.assign(new Error(), { code: 'P2003' }));
      const req = mockReq({ params: { id: 'tid-1' } });
      const res = mockRes();
      await deleteTreatment(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('deletes with 204', async () => {
      prisma.treatment.findUnique.mockResolvedValue(TREATMENT);
      prisma.treatment.delete.mockResolvedValue(TREATMENT);
      const req = mockReq({ params: { id: 'tid-1' } });
      const res = mockRes();
      await deleteTreatment(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(204);
    });
  });
});
