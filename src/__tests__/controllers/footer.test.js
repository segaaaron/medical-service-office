jest.mock('../../services/prisma.service', () => ({
  footer: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}));

const prisma = require('../../services/prisma.service');
const { getFooter, upsertFooter } = require('../../controllers/footer.controller');
const { mockReq, mockRes, mockNext } = require('../helpers/mock-req-res');

const RECORD = { id: '1', doctorName: 'Dra. Yasmin', copyrightText: '© 2026' };

describe('footer.controller', () => {
  describe('getFooter', () => {
    it('returns 404 when no record', async () => {
      prisma.footer.findFirst.mockResolvedValue(null);
      const res = mockRes();
      await getFooter(mockReq(), res, mockNext());
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns record', async () => {
      prisma.footer.findFirst.mockResolvedValue(RECORD);
      const res = mockRes();
      await getFooter(mockReq(), res, mockNext());
      expect(res.json).toHaveBeenCalledWith(RECORD);
    });
  });

  describe('upsertFooter', () => {
    it('creates with 201 when none exists', async () => {
      prisma.footer.findFirst.mockResolvedValue(null);
      prisma.footer.create.mockResolvedValue(RECORD);
      const req = mockReq({ body: { doctorName: 'Dra. Yasmin' } });
      const res = mockRes();
      await upsertFooter(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('updates with 200 when record exists', async () => {
      prisma.footer.findFirst.mockResolvedValue(RECORD);
      prisma.footer.update.mockResolvedValue(RECORD);
      const req = mockReq({ body: { doctorName: 'Actualizado' } });
      const res = mockRes();
      await upsertFooter(req, res, mockNext());
      expect(prisma.footer.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: RECORD.id } }));
      expect(res.json).toHaveBeenCalledWith(RECORD);
    });

    it('retries as update on P2002 race condition', async () => {
      const p2002 = Object.assign(new Error(), { code: 'P2002' });
      prisma.footer.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(RECORD);
      prisma.footer.create.mockRejectedValue(p2002);
      prisma.footer.update.mockResolvedValue(RECORD);
      const req = mockReq({ body: { doctorName: 'Retry' } });
      const res = mockRes();
      await upsertFooter(req, res, mockNext());
      expect(prisma.footer.update).toHaveBeenCalled();
    });
  });
});
