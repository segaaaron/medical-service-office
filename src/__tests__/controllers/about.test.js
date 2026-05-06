jest.mock('../../services/prisma.service', () => ({
  aboutUs: {
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
const { getAboutUs, upsertAboutUs } = require('../../controllers/about.controller');
const { mockReq, mockRes, mockNext } = require('../helpers/mock-req-res');

const RECORD = { id: '1', doctorName: 'Dra. Yasmin', imageUrl: '/uploads/old.webp' };

describe('about.controller', () => {
  describe('getAboutUs', () => {
    it('returns 404 when no record exists', async () => {
      prisma.aboutUs.findFirst.mockResolvedValue(null);
      const req = mockReq();
      const res = mockRes();
      await getAboutUs(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });

    it('returns record when it exists', async () => {
      prisma.aboutUs.findFirst.mockResolvedValue(RECORD);
      const req = mockReq();
      const res = mockRes();
      await getAboutUs(req, res, mockNext());
      expect(res.json).toHaveBeenCalledWith(RECORD);
    });
  });

  describe('upsertAboutUs', () => {
    it('creates new record with 201 when none exists', async () => {
      prisma.aboutUs.findFirst.mockResolvedValue(null);
      prisma.aboutUs.create.mockResolvedValue({ id: '2', ...mockReq().body });
      const req = mockReq({ body: { doctorName: 'Nueva' } });
      const res = mockRes();
      await upsertAboutUs(req, res, mockNext());
      expect(prisma.aboutUs.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('updates existing record with 200', async () => {
      const updated = { ...RECORD, doctorName: 'Actualizado' };
      prisma.aboutUs.findFirst.mockResolvedValue(RECORD);
      prisma.aboutUs.update.mockResolvedValue(updated);
      const req = mockReq({ body: { doctorName: 'Actualizado' } });
      const res = mockRes();
      await upsertAboutUs(req, res, mockNext());
      expect(prisma.aboutUs.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: RECORD.id } }));
      expect(res.json).toHaveBeenCalledWith(updated);
    });

    it('deletes old image when new image is uploaded', async () => {
      prisma.aboutUs.findFirst.mockResolvedValue(RECORD);
      prisma.aboutUs.update.mockResolvedValue(RECORD);
      const req = mockReq({ body: {}, imageUrl: '/uploads/new.webp' });
      const res = mockRes();
      await upsertAboutUs(req, res, mockNext());
      expect(deleteUploadedFile).toHaveBeenCalledWith(RECORD.imageUrl);
    });

    it('retries as update on P2002 race condition', async () => {
      const p2002 = Object.assign(new Error('Unique'), { code: 'P2002' });
      prisma.aboutUs.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(RECORD);
      prisma.aboutUs.create.mockRejectedValue(p2002);
      prisma.aboutUs.update.mockResolvedValue(RECORD);
      const req = mockReq({ body: { doctorName: 'Retry' } });
      const res = mockRes();
      await upsertAboutUs(req, res, mockNext());
      expect(prisma.aboutUs.update).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(RECORD);
    });
  });
});
