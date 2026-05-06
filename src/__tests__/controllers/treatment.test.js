jest.mock('../../services/prisma.service', () => ({
  treatment: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
}));
jest.mock('../../middlewares/upload.middleware', () => ({
  deleteUploadedFile: jest.fn(),
}));

const prisma = require('../../services/prisma.service');
const { deleteUploadedFile } = require('../../middlewares/upload.middleware');
const {
  listTreatments, getTreatment, createTreatment, updateTreatment, deleteTreatment,
} = require('../../controllers/treatment.controller');
const { mockReq, mockRes, mockNext } = require('../helpers/mock-req-res');

const TREATMENT = { id: 'tid-1', name: 'Botox', slug: 'botox', active: true, imageUrl: '/uploads/t.webp' };

describe('treatment.controller', () => {
  describe('listTreatments', () => {
    it('returns paginated treatments', async () => {
      prisma.treatment.findMany.mockResolvedValue([TREATMENT]);
      prisma.treatment.count.mockResolvedValue(1);
      const req = mockReq({ query: {} });
      const res = mockRes();
      await listTreatments(req, res, mockNext());
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: [TREATMENT], total: 1 }));
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
      const req = mockReq({ params: { id: 'tid-1' }, body: {}, imageUrl: '/uploads/new.webp' });
      const res = mockRes();
      await updateTreatment(req, res, mockNext());
      expect(deleteUploadedFile).toHaveBeenCalledWith(TREATMENT.imageUrl);
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
