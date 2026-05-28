jest.mock('../../services/prisma.service', () => ({
  footer: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
}));

const prisma = require('../../services/prisma.service');
const { getFooter, upsertFooter } = require('../../controllers/footer.controller');
const { mockReq, mockRes, mockNext } = require('../helpers/mock-req-res');

const RECORD = { id: '1', singleton: true, doctorName: 'Dra. Yasmin', copyrightText: '© 2026' };

describe('footer.controller', () => {
  describe('getFooter', () => {
    it('returns 404 when no record', async () => {
      prisma.footer.findUnique.mockResolvedValue(null);
      const res = mockRes();
      await getFooter(mockReq(), res, mockNext());
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns record', async () => {
      prisma.footer.findUnique.mockResolvedValue(RECORD);
      const res = mockRes();
      await getFooter(mockReq(), res, mockNext());
      expect(res.json).toHaveBeenCalledWith(RECORD);
    });
  });

  describe('upsertFooter', () => {
    it('upserts and returns record', async () => {
      prisma.footer.upsert.mockResolvedValue(RECORD);
      const req = mockReq({ body: { doctorName: 'Dra. Yasmin' } });
      const res = mockRes();
      await upsertFooter(req, res, mockNext());
      expect(prisma.footer.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { singleton: true } })
      );
      expect(res.json).toHaveBeenCalledWith(RECORD);
    });

    it('passes next on error', async () => {
      const err = new Error('DB error');
      prisma.footer.upsert.mockRejectedValue(err);
      const req = mockReq({ body: {} });
      const res = mockRes();
      const next = mockNext();
      await upsertFooter(req, res, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });
});
