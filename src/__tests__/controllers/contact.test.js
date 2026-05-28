jest.mock('../../services/prisma.service', () => ({
  contact: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
}));

const prisma = require('../../services/prisma.service');
const { getContact, upsertContact } = require('../../controllers/contact.controller');
const { mockReq, mockRes, mockNext } = require('../helpers/mock-req-res');

const CONTACT_BODY = {
  whatsappNumber: '5211234567890', whatsappUrl: 'https://wa.me/1', phone: '5551234567',
  instagramUsername: '@test', instagramUrl: 'https://ig.com/test',
  facebookName: 'Test', facebookUrl: 'https://fb.com/test',
  mondayFridayHours: '9-18', saturdayHours: '9-14', sundayStatus: 'Cerrado',
  locationDescription: 'Av. Reforma 1',
};
const RECORD = { id: '1', singleton: true, ...CONTACT_BODY };

describe('contact.controller', () => {
  describe('getContact', () => {
    it('returns 404 when no record', async () => {
      prisma.contact.findUnique.mockResolvedValue(null);
      const res = mockRes();
      await getContact(mockReq(), res, mockNext());
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns record', async () => {
      prisma.contact.findUnique.mockResolvedValue(RECORD);
      const res = mockRes();
      await getContact(mockReq(), res, mockNext());
      expect(res.json).toHaveBeenCalledWith(RECORD);
    });
  });

  describe('upsertContact', () => {
    it('upserts and returns record', async () => {
      prisma.contact.upsert.mockResolvedValue(RECORD);
      const req = mockReq({ body: CONTACT_BODY });
      const res = mockRes();
      await upsertContact(req, res, mockNext());
      expect(prisma.contact.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { singleton: true } })
      );
      expect(res.json).toHaveBeenCalledWith(RECORD);
    });

    it('passes next on error', async () => {
      const err = new Error('DB error');
      prisma.contact.upsert.mockRejectedValue(err);
      const req = mockReq({ body: CONTACT_BODY });
      const res = mockRes();
      const next = mockNext();
      await upsertContact(req, res, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });
});
