jest.mock('../../services/prisma.service', () => ({
  siteContent: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
}));
jest.mock('../../middlewares/upload.middleware', () => ({
  deleteUploadedFile: jest.fn(),
}));

const prisma = require('../../services/prisma.service');
const {
  getSiteContent, listSiteContent, upsertSiteContent, deleteSiteContent, uploadImage,
} = require('../../controllers/site-content.controller');
const { mockReq, mockRes, mockNext } = require('../helpers/mock-req-res');

const RECORD = { id: '1', key: 'main', value: { heroTitle: 'Bienvenido' } };

describe('site-content.controller', () => {
  describe('getSiteContent', () => {
    it('returns 404 when not found', async () => {
      prisma.siteContent.findUnique.mockResolvedValue(null);
      const req = mockReq({ params: { key: 'main' } });
      const res = mockRes();
      await getSiteContent(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns content', async () => {
      prisma.siteContent.findUnique.mockResolvedValue(RECORD);
      const req = mockReq({ params: { key: 'main' } });
      const res = mockRes();
      await getSiteContent(req, res, mockNext());
      expect(res.json).toHaveBeenCalledWith(RECORD);
    });
  });

  describe('listSiteContent', () => {
    it('returns paginated list', async () => {
      prisma.siteContent.findMany.mockResolvedValue([RECORD]);
      prisma.siteContent.count.mockResolvedValue(1);
      const req = mockReq({ query: {} });
      const res = mockRes();
      await listSiteContent(req, res, mockNext());
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: [RECORD], total: 1 }));
    });
  });

  describe('upsertSiteContent', () => {
    it('upserts and returns record', async () => {
      prisma.siteContent.upsert.mockResolvedValue(RECORD);
      const req = mockReq({ body: { key: 'main', value: { heroTitle: 'Bienvenido' } } });
      const res = mockRes();
      await upsertSiteContent(req, res, mockNext());
      expect(prisma.siteContent.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { key: 'main' } })
      );
      expect(res.json).toHaveBeenCalledWith(RECORD);
    });
  });

  describe('deleteSiteContent', () => {
    it('returns 404 on P2025', async () => {
      prisma.siteContent.delete.mockRejectedValue(Object.assign(new Error(), { code: 'P2025' }));
      const req = mockReq({ params: { key: 'main' } });
      const res = mockRes();
      await deleteSiteContent(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('deletes with 204', async () => {
      prisma.siteContent.delete.mockResolvedValue(RECORD);
      const req = mockReq({ params: { key: 'main' } });
      const res = mockRes();
      await deleteSiteContent(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(204);
    });
  });

  describe('uploadImage', () => {
    it('returns 400 when no file', async () => {
      const req = mockReq({ imageUrl: undefined });
      const res = mockRes();
      await uploadImage(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns imageUrl', async () => {
      const req = mockReq({ imageUrl: '/uploads/img.webp' });
      const res = mockRes();
      await uploadImage(req, res);
      expect(res.json).toHaveBeenCalledWith({ imageUrl: '/uploads/img.webp' });
    });
  });
});
