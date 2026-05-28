jest.mock('../../services/prisma.service', () => ({
  promoBanner: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
}));
jest.mock('../../middlewares/upload.middleware', () => ({
  deleteUploadedFile: jest.fn(),
}));

const prisma = require('../../services/prisma.service');
const { deleteUploadedFile } = require('../../middlewares/upload.middleware');
const { getPromoBanner, upsertPromoBanner } = require('../../controllers/promo-banner.controller');
const { mockReq, mockRes, mockNext } = require('../helpers/mock-req-res');

const RECORD = { id: '1', singleton: true, title: 'Promo', active: false, imageUrl: '/uploads/banner.webp' };

describe('promo-banner.controller', () => {
  describe('getPromoBanner', () => {
    it('returns 404 when no record', async () => {
      prisma.promoBanner.findUnique.mockResolvedValue(null);
      const res = mockRes();
      await getPromoBanner(mockReq(), res, mockNext());
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns record', async () => {
      prisma.promoBanner.findUnique.mockResolvedValue(RECORD);
      const res = mockRes();
      await getPromoBanner(mockReq(), res, mockNext());
      expect(res.json).toHaveBeenCalledWith(RECORD);
    });
  });

  describe('upsertPromoBanner', () => {
    it('upserts with active:false default in create and returns record', async () => {
      prisma.promoBanner.upsert.mockResolvedValue(RECORD);
      const req = mockReq({ body: { title: 'Promo' } });
      const res = mockRes();
      await upsertPromoBanner(req, res, mockNext());
      expect(prisma.promoBanner.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { singleton: true },
          create: expect.objectContaining({ active: false }),
        })
      );
      expect(res.json).toHaveBeenCalledWith(RECORD);
    });

    it('deletes old image when new image uploaded', async () => {
      prisma.promoBanner.findUnique.mockResolvedValue(RECORD);
      prisma.promoBanner.upsert.mockResolvedValue(RECORD);
      const req = mockReq({ body: {}, imageUrl: '/uploads/new.webp' });
      const res = mockRes();
      await upsertPromoBanner(req, res, mockNext());
      expect(deleteUploadedFile).toHaveBeenCalledWith(RECORD.imageUrl);
    });

    it('does not delete image when no new image uploaded', async () => {
      prisma.promoBanner.upsert.mockResolvedValue(RECORD);
      const req = mockReq({ body: { title: 'Sin imagen' } });
      const res = mockRes();
      await upsertPromoBanner(req, res, mockNext());
      expect(deleteUploadedFile).not.toHaveBeenCalled();
    });

    it('deletes existing image and sets null when imageUrl: null sent', async () => {
      prisma.promoBanner.findUnique.mockResolvedValue(RECORD);
      prisma.promoBanner.upsert.mockResolvedValue({ ...RECORD, imageUrl: null });
      const req = mockReq({ body: { imageUrl: null } });
      const res = mockRes();
      await upsertPromoBanner(req, res, mockNext());
      expect(deleteUploadedFile).toHaveBeenCalledWith(RECORD.imageUrl);
      expect(prisma.promoBanner.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ update: expect.objectContaining({ imageUrl: null }) })
      );
    });

    it('does not call deleteUploadedFile when imageUrl: null but no existing image', async () => {
      prisma.promoBanner.findUnique.mockResolvedValue({ ...RECORD, imageUrl: null });
      prisma.promoBanner.upsert.mockResolvedValue({ ...RECORD, imageUrl: null });
      const req = mockReq({ body: { imageUrl: null } });
      const res = mockRes();
      await upsertPromoBanner(req, res, mockNext());
      expect(deleteUploadedFile).not.toHaveBeenCalled();
    });

    it('passes next on error', async () => {
      const err = new Error('DB error');
      prisma.promoBanner.upsert.mockRejectedValue(err);
      const req = mockReq({ body: {} });
      const res = mockRes();
      const next = mockNext();
      await upsertPromoBanner(req, res, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });
});
