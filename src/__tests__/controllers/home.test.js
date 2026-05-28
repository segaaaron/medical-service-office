jest.mock('../../services/prisma.service', () => ({
  home: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
}));

const prisma = require('../../services/prisma.service');
const { getHome, upsertHome } = require('../../controllers/home.controller');
const { mockReq, mockRes, mockNext } = require('../helpers/mock-req-res');

const RECORD = { id: '1', singleton: true, doctorName: 'Dra. Yasmin', subtitle: 'Especialista' };

describe('home.controller', () => {
  describe('getHome', () => {
    it('returns 404 when no record', async () => {
      prisma.home.findUnique.mockResolvedValue(null);
      const res = mockRes();
      await getHome(mockReq(), res, mockNext());
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns record', async () => {
      prisma.home.findUnique.mockResolvedValue(RECORD);
      const res = mockRes();
      await getHome(mockReq(), res, mockNext());
      expect(res.json).toHaveBeenCalledWith(RECORD);
    });
  });

  describe('upsertHome', () => {
    it('upserts and returns record', async () => {
      prisma.home.upsert.mockResolvedValue(RECORD);
      const req = mockReq({ body: { doctorName: 'Dra. Yasmin' } });
      const res = mockRes();
      await upsertHome(req, res, mockNext());
      expect(prisma.home.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { singleton: true } })
      );
      expect(res.json).toHaveBeenCalledWith(RECORD);
    });

    it('passes next on error', async () => {
      const err = new Error('DB error');
      prisma.home.upsert.mockRejectedValue(err);
      const req = mockReq({ body: {} });
      const res = mockRes();
      const next = mockNext();
      await upsertHome(req, res, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });
});
