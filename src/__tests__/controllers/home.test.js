jest.mock('../../services/prisma.service', () => ({
  home: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}));

const prisma = require('../../services/prisma.service');
const { getHome, upsertHome } = require('../../controllers/home.controller');
const { mockReq, mockRes, mockNext } = require('../helpers/mock-req-res');

const RECORD = { id: '1', doctorName: 'Dra. Yasmin', subtitle: 'Especialista' };

describe('home.controller', () => {
  describe('getHome', () => {
    it('returns 404 when no record', async () => {
      prisma.home.findFirst.mockResolvedValue(null);
      const res = mockRes();
      await getHome(mockReq(), res, mockNext());
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns record', async () => {
      prisma.home.findFirst.mockResolvedValue(RECORD);
      const res = mockRes();
      await getHome(mockReq(), res, mockNext());
      expect(res.json).toHaveBeenCalledWith(RECORD);
    });
  });

  describe('upsertHome', () => {
    it('creates with 201 when none exists', async () => {
      prisma.home.findFirst.mockResolvedValue(null);
      prisma.home.create.mockResolvedValue(RECORD);
      const req = mockReq({ body: { doctorName: 'Dra. Yasmin' } });
      const res = mockRes();
      await upsertHome(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('updates with 200 when record exists', async () => {
      prisma.home.findFirst.mockResolvedValue(RECORD);
      prisma.home.update.mockResolvedValue(RECORD);
      const req = mockReq({ body: { doctorName: 'Actualizado' } });
      const res = mockRes();
      await upsertHome(req, res, mockNext());
      expect(prisma.home.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: RECORD.id } }));
      expect(res.json).toHaveBeenCalledWith(RECORD);
    });

    it('retries as update on P2002 race condition', async () => {
      const p2002 = Object.assign(new Error(), { code: 'P2002' });
      prisma.home.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(RECORD);
      prisma.home.create.mockRejectedValue(p2002);
      prisma.home.update.mockResolvedValue(RECORD);
      const req = mockReq({ body: { doctorName: 'Retry' } });
      const res = mockRes();
      await upsertHome(req, res, mockNext());
      expect(prisma.home.update).toHaveBeenCalled();
    });
  });
});
