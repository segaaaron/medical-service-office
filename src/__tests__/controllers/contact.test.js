jest.mock('../../services/prisma.service', () => ({
  contact: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
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
const RECORD = { id: '1', ...CONTACT_BODY };

describe('contact.controller', () => {
  describe('getContact', () => {
    it('returns 404 when no record', async () => {
      prisma.contact.findFirst.mockResolvedValue(null);
      const res = mockRes();
      await getContact(mockReq(), res, mockNext());
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns record', async () => {
      prisma.contact.findFirst.mockResolvedValue(RECORD);
      const res = mockRes();
      await getContact(mockReq(), res, mockNext());
      expect(res.json).toHaveBeenCalledWith(RECORD);
    });
  });

  describe('upsertContact', () => {
    it('creates with 201 when none exists', async () => {
      prisma.contact.findFirst.mockResolvedValue(null);
      prisma.contact.create.mockResolvedValue(RECORD);
      const req = mockReq({ body: CONTACT_BODY });
      const res = mockRes();
      await upsertContact(req, res, mockNext());
      expect(prisma.contact.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('updates with 200 when record exists', async () => {
      prisma.contact.findFirst.mockResolvedValue(RECORD);
      prisma.contact.update.mockResolvedValue(RECORD);
      const req = mockReq({ body: CONTACT_BODY });
      const res = mockRes();
      await upsertContact(req, res, mockNext());
      expect(prisma.contact.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: RECORD.id } }));
      expect(res.json).toHaveBeenCalledWith(RECORD);
    });

    it('retries as update on P2002 race condition', async () => {
      const p2002 = Object.assign(new Error(), { code: 'P2002' });
      prisma.contact.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(RECORD);
      prisma.contact.create.mockRejectedValue(p2002);
      prisma.contact.update.mockResolvedValue(RECORD);
      const req = mockReq({ body: CONTACT_BODY });
      const res = mockRes();
      await upsertContact(req, res, mockNext());
      expect(prisma.contact.update).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(RECORD);
    });
  });
});
