jest.mock('../../services/prisma.service', () => ({
  appointment: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  treatment: {
    findUnique: jest.fn(),
  },
}));

const prisma = require('../../services/prisma.service');
const {
  listAppointments, getAppointment, createAppointment,
  updateAppointment, deleteAppointment,
} = require('../../controllers/appointment.controller');
const { mockReq, mockRes, mockNext } = require('../helpers/mock-req-res');

const TREATMENT = { id: 'tid-1', active: true };
const APPOINTMENT = { id: 'aid-1', patientName: 'Paciente Demo', treatmentId: 'tid-1', status: 'PENDING' };

describe('appointment.controller', () => {
  describe('listAppointments', () => {
    it('returns paginated appointments', async () => {
      prisma.appointment.findMany.mockResolvedValue([APPOINTMENT]);
      prisma.appointment.count.mockResolvedValue(1);
      const req = mockReq({ query: {} });
      const res = mockRes();
      await listAppointments(req, res, mockNext());
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: [APPOINTMENT], total: 1 }));
    });

    it('returns 400 on invalid status filter', async () => {
      const req = mockReq({ query: { status: 'INVALID' } });
      const res = mockRes();
      await listAppointments(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getAppointment', () => {
    it('returns 404 when not found', async () => {
      prisma.appointment.findUnique.mockResolvedValue(null);
      const req = mockReq({ params: { id: 'aid-x' } });
      const res = mockRes();
      await getAppointment(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns appointment', async () => {
      prisma.appointment.findUnique.mockResolvedValue(APPOINTMENT);
      const req = mockReq({ params: { id: 'aid-1' } });
      const res = mockRes();
      await getAppointment(req, res, mockNext());
      expect(res.json).toHaveBeenCalledWith(APPOINTMENT);
    });
  });

  describe('createAppointment', () => {
    it('returns 422 when treatment does not exist', async () => {
      prisma.treatment.findUnique.mockResolvedValue(null);
      const req = mockReq({ body: { treatmentId: 'tid-x' } });
      const res = mockRes();
      await createAppointment(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('returns 422 when treatment is inactive', async () => {
      prisma.treatment.findUnique.mockResolvedValue({ id: 'tid-1', active: false });
      const req = mockReq({ body: { treatmentId: 'tid-1' } });
      const res = mockRes();
      await createAppointment(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('creates appointment with 201', async () => {
      prisma.treatment.findUnique.mockResolvedValue(TREATMENT);
      prisma.appointment.create.mockResolvedValue(APPOINTMENT);
      const req = mockReq({
        body: { patientName: 'Demo', patientPhone: '1234567890', treatmentId: 'tid-1' },
      });
      const res = mockRes();
      await createAppointment(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(APPOINTMENT);
    });
  });

  describe('updateAppointment', () => {
    it('returns 422 when treatmentId is invalid', async () => {
      prisma.treatment.findUnique.mockResolvedValue(null);
      const req = mockReq({ params: { id: 'aid-1' }, body: { treatmentId: 'tid-x' } });
      const res = mockRes();
      await updateAppointment(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('returns 404 on P2025', async () => {
      const req = mockReq({ params: { id: 'aid-x' }, body: { status: 'CONFIRMED' } });
      const res = mockRes();
      const next = mockNext();
      prisma.appointment.update.mockRejectedValue(Object.assign(new Error(), { code: 'P2025' }));
      await updateAppointment(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('updates appointment', async () => {
      const updated = { ...APPOINTMENT, status: 'CONFIRMED' };
      prisma.appointment.update.mockResolvedValue(updated);
      const req = mockReq({ params: { id: 'aid-1' }, body: { status: 'CONFIRMED' } });
      const res = mockRes();
      await updateAppointment(req, res, mockNext());
      expect(res.json).toHaveBeenCalledWith(updated);
    });
  });

  describe('deleteAppointment', () => {
    it('returns 404 on P2025', async () => {
      prisma.appointment.delete.mockRejectedValue(Object.assign(new Error(), { code: 'P2025' }));
      const req = mockReq({ params: { id: 'aid-x' } });
      const res = mockRes();
      await deleteAppointment(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('deletes appointment with 204', async () => {
      prisma.appointment.delete.mockResolvedValue(APPOINTMENT);
      const req = mockReq({ params: { id: 'aid-1' } });
      const res = mockRes();
      await deleteAppointment(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(204);
    });
  });
});
