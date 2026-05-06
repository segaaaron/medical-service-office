jest.mock('../../services/prisma.service', () => ({
  promoBanner: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}));
jest.mock('../../middlewares/upload.middleware', () => ({
  deleteUploadedFile: jest.fn(),
}));

const prisma = require('../../services/prisma.service');
const { deleteUploadedFile } = require('../../middlewares/upload.middleware');
const { getPromoBanner, upsertPromoBanner } = require('../../controllers/promo-banner.controller');
const { mockReq, mockRes, mockNext } = require('../helpers/mock-req-res');

const RECORD = { id: '1', title: 'Promo', active: false, imageUrl: '/uploads/banner.webp' };

describe('promo-banner.controller', () => {
  describe('getPromoBanner', () => {
    it('returns 404 when no record', async () => {
      prisma.promoBanner.findFirst.mockResolvedValue(null);
      const res = mockRes();
      await getPromoBanner(mockReq(), res, mockNext());
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns record', async () => {
      prisma.promoBanner.findFirst.mockResolvedValue(RECORD);
      const res = mockRes();
      await getPromoBanner(mockReq(), res, mockNext());
      expect(res.json).toHaveBeenCalledWith(RECORD);
    });
  });

  describe('upsertPromoBanner', () => {
    it('creates with active:false default and 201', async () => {
      prisma.promoBanner.findFirst.mockResolvedValue(null);
      prisma.promoBanner.create.mockResolvedValue(RECORD);
      const req = mockReq({ body: { title: 'Promo' } });
      const res = mockRes();
      await upsertPromoBanner(req, res, mockNext());
      expect(prisma.promoBanner.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ active: false }) })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('updates with 200 when record exists', async () => {
      prisma.promoBanner.findFirst.mockResolvedValue(RECORD);
      prisma.promoBanner.update.mockResolvedValue(RECORD);
      const req = mockReq({ body: { title: 'Actualizado' } });
      const res = mockRes();
      await upsertPromoBanner(req, res, mockNext());
      expect(prisma.promoBanner.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: RECORD.id } }));
    });

    it('deletes old image when new image uploaded', async () => {
      prisma.promoBanner.findFirst.mockResolvedValue(RECORD);
      prisma.promoBanner.update.mockResolvedValue(RECORD);
      const req = mockReq({ body: {}, imageUrl: '/uploads/new.webp' });
      const res = mockRes();
      await upsertPromoBanner(req, res, mockNext());
      expect(deleteUploadedFile).toHaveBeenCalledWith(RECORD.imageUrl);
    });

    it('retries as update on P2002 race condition', async () => {
      const p2002 = Object.assign(new Error(), { code: 'P2002' });
      prisma.promoBanner.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(RECORD);
      prisma.promoBanner.create.mockRejectedValue(p2002);
      prisma.promoBanner.update.mockResolvedValue(RECORD);
      const req = mockReq({ body: { title: 'Retry' } });
      const res = mockRes();
      await upsertPromoBanner(req, res, mockNext());
      expect(prisma.promoBanner.update).toHaveBeenCalled();
    });
  });
});
