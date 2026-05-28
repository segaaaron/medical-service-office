jest.mock('../../services/prisma.service', () => ({
  aboutUs: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
}));
jest.mock('../../middlewares/upload.middleware', () => ({
  deleteUploadedFile: jest.fn(),
}));

const prisma = require('../../services/prisma.service');
const { deleteUploadedFile } = require('../../middlewares/upload.middleware');
const { getAboutUs, upsertAboutUs } = require('../../controllers/about.controller');
const { mockReq, mockRes, mockNext } = require('../helpers/mock-req-res');

const RECORD = { id: '1', singleton: true, doctorName: 'Dra. Yasmin', imageUrl: '/uploads/old.webp' };

describe('about.controller', () => {
  describe('getAboutUs', () => {
    it('returns 404 when no record exists', async () => {
      prisma.aboutUs.findUnique.mockResolvedValue(null);
      const req = mockReq();
      const res = mockRes();
      await getAboutUs(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });

    it('returns record when it exists', async () => {
      prisma.aboutUs.findUnique.mockResolvedValue(RECORD);
      const req = mockReq();
      const res = mockRes();
      await getAboutUs(req, res, mockNext());
      expect(res.json).toHaveBeenCalledWith(RECORD);
    });
  });

  describe('upsertAboutUs', () => {
    it('upserts and returns record', async () => {
      prisma.aboutUs.upsert.mockResolvedValue(RECORD);
      const req = mockReq({ body: { doctorName: 'Dra. Yasmin' } });
      const res = mockRes();
      await upsertAboutUs(req, res, mockNext());
      expect(prisma.aboutUs.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { singleton: true } })
      );
      expect(res.json).toHaveBeenCalledWith(RECORD);
    });

    it('deletes old image when new image is uploaded', async () => {
      prisma.aboutUs.findUnique.mockResolvedValue(RECORD);
      prisma.aboutUs.upsert.mockResolvedValue(RECORD);
      const req = mockReq({ body: {}, imageUrl: '/uploads/new.webp' });
      const res = mockRes();
      await upsertAboutUs(req, res, mockNext());
      expect(deleteUploadedFile).toHaveBeenCalledWith(RECORD.imageUrl);
    });

    it('does not delete image when no new image uploaded', async () => {
      prisma.aboutUs.upsert.mockResolvedValue(RECORD);
      const req = mockReq({ body: { doctorName: 'Sin imagen' } });
      const res = mockRes();
      await upsertAboutUs(req, res, mockNext());
      expect(deleteUploadedFile).not.toHaveBeenCalled();
    });

    it('deletes existing image and sets null when imageUrl: null sent', async () => {
      prisma.aboutUs.findUnique.mockResolvedValue(RECORD);
      prisma.aboutUs.upsert.mockResolvedValue({ ...RECORD, imageUrl: null });
      const req = mockReq({ body: { imageUrl: null } });
      const res = mockRes();
      await upsertAboutUs(req, res, mockNext());
      expect(deleteUploadedFile).toHaveBeenCalledWith(RECORD.imageUrl);
      expect(prisma.aboutUs.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ update: expect.objectContaining({ imageUrl: null }) })
      );
    });

    it('does not call deleteUploadedFile when imageUrl: null but no existing image', async () => {
      prisma.aboutUs.findUnique.mockResolvedValue({ ...RECORD, imageUrl: null });
      prisma.aboutUs.upsert.mockResolvedValue({ ...RECORD, imageUrl: null });
      const req = mockReq({ body: { imageUrl: null } });
      const res = mockRes();
      await upsertAboutUs(req, res, mockNext());
      expect(deleteUploadedFile).not.toHaveBeenCalled();
    });
  });
});
