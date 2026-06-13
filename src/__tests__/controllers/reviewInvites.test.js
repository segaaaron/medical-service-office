jest.mock('../../services/prisma.service', () => ({
  reviewInvite: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    updateMany: jest.fn(),
    update: jest.fn(),
  },
  review: {
    create: jest.fn(),
  },
  $transaction: jest.fn(),
}));

const prisma = require('../../services/prisma.service');
// Transacción interactiva: ejecuta el callback con el mismo mock como `tx`
prisma.$transaction.mockImplementation(async (cb) => cb(prisma));

const {
  createInvite,
  listInvites,
  revokeInvite,
  validateInvite,
  submitInvite,
} = require('../../controllers/reviewInvites.controller');
const { mockReq, mockRes, mockNext } = require('../helpers/mock-req-res');

const FUTURE = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
const PAST = new Date(Date.now() - 1000);

const INVITE_ROW = {
  id: 'inv-1',
  token: 'tok_abc',
  patientName: 'María José',
  patientLastname: 'Rivera',
  email: 'maria@email.com',
  phone: '+59170000000',
  status: 'pending',
  reviewId: null,
  createdAt: new Date('2026-06-12T10:00:00Z'),
  expiresAt: FUTURE,
  usedAt: null,
};

describe('reviewInvites.controller', () => {
  // ── createInvite ───────────────────────────────────────────────────────────
  describe('createInvite', () => {
    it('crea invitación pending con token y expires_at, responde 201', async () => {
      prisma.reviewInvite.create.mockResolvedValue(INVITE_ROW);
      const req = mockReq({ body: { patient_name: 'María José', patient_lastname: 'Rivera', email: 'maria@email.com', phone: '+59170000000' } });
      const res = mockRes();
      await createInvite(req, res, mockNext());

      expect(prisma.reviewInvite.create).toHaveBeenCalledTimes(1);
      const arg = prisma.reviewInvite.create.mock.calls[0][0];
      expect(arg.data.status).toBe('pending');
      expect(typeof arg.data.token).toBe('string');
      expect(arg.data.token.length).toBeGreaterThanOrEqual(20);
      expect(arg.data.expiresAt instanceof Date).toBe(true);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        id: 'inv-1', token: 'tok_abc', patient_name: 'María José', patient_lastname: 'Rivera', status: 'pending',
      }));
    });

    it('reintenta ante colisión de token (P2002) y luego responde 201', async () => {
      prisma.reviewInvite.create
        .mockRejectedValueOnce(Object.assign(new Error('dup'), { code: 'P2002' }))
        .mockResolvedValueOnce(INVITE_ROW);
      const req = mockReq({ body: { patient_name: 'María José', patient_lastname: 'Rivera' } });
      const res = mockRes();
      await createInvite(req, res, mockNext());

      expect(prisma.reviewInvite.create).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  // ── listInvites ────────────────────────────────────────────────────────────
  describe('listInvites', () => {
    it('expira vencidas, lista created_at desc y oculta token de no-pending', async () => {
      prisma.reviewInvite.updateMany.mockResolvedValue({ count: 0 });
      prisma.reviewInvite.findMany.mockResolvedValue([
        { ...INVITE_ROW, status: 'used', reviewId: 'rev-9' },
      ]);
      const req = mockReq({ query: {} });
      const res = mockRes();
      await listInvites(req, res, mockNext());

      // lazy-expire ejecutado
      expect(prisma.reviewInvite.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'pending' }), data: { status: 'expired' } })
      );
      expect(prisma.reviewInvite.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'desc' }, take: 500 })
      );
      const payload = res.json.mock.calls[0][0];
      expect(payload.invites[0].token).toBeNull(); // used → token oculto
      expect(payload.invites[0].review_id).toBe('rev-9');
    });

    it('filtra por status válido', async () => {
      prisma.reviewInvite.updateMany.mockResolvedValue({ count: 0 });
      prisma.reviewInvite.findMany.mockResolvedValue([]);
      const req = mockReq({ query: { status: 'revoked' } });
      const res = mockRes();
      await listInvites(req, res, mockNext());
      expect(prisma.reviewInvite.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'revoked' } })
      );
    });
  });

  // ── revokeInvite ───────────────────────────────────────────────────────────
  describe('revokeInvite', () => {
    it('revoca una pending → 200', async () => {
      prisma.reviewInvite.updateMany.mockResolvedValue({ count: 1 });
      const req = mockReq({ params: { id: 'inv-1' } });
      const res = mockRes();
      await revokeInvite(req, res, mockNext());
      expect(res.json).toHaveBeenCalledWith({ id: 'inv-1', status: 'revoked' });
    });

    it('ya usada/expirada → 409', async () => {
      prisma.reviewInvite.updateMany.mockResolvedValue({ count: 0 });
      prisma.reviewInvite.findUnique.mockResolvedValue({ id: 'inv-1' });
      const req = mockReq({ params: { id: 'inv-1' } });
      const res = mockRes();
      await revokeInvite(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('inexistente → 404', async () => {
      prisma.reviewInvite.updateMany.mockResolvedValue({ count: 0 });
      prisma.reviewInvite.findUnique.mockResolvedValue(null);
      const req = mockReq({ params: { id: 'nope' } });
      const res = mockRes();
      await revokeInvite(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ── validateInvite ─────────────────────────────────────────────────────────
  describe('validateInvite', () => {
    it('pending vigente → valid:true sólo con nombre/apellido (nunca email/phone)', async () => {
      prisma.reviewInvite.findUnique.mockResolvedValue({
        patientName: 'María José', patientLastname: 'Rivera', status: 'pending', expiresAt: FUTURE,
      });
      const req = mockReq({ params: { token: 'tok_abc' } });
      const res = mockRes();
      await validateInvite(req, res, mockNext());
      const payload = res.json.mock.calls[0][0];
      expect(payload).toEqual({ valid: true, patient_name: 'María José', patient_lastname: 'Rivera' });
      expect(payload).not.toHaveProperty('email');
      expect(payload).not.toHaveProperty('phone');
    });

    it('usada → valid:false reason used', async () => {
      prisma.reviewInvite.findUnique.mockResolvedValue({ patientName: 'A', patientLastname: 'B', status: 'used', expiresAt: FUTURE });
      const req = mockReq({ params: { token: 'tok_abc' } });
      const res = mockRes();
      await validateInvite(req, res, mockNext());
      expect(res.json).toHaveBeenCalledWith({ valid: false, reason: 'used' });
    });

    it('pending pero vencida → marca expired y reason expired', async () => {
      prisma.reviewInvite.findUnique.mockResolvedValue({ patientName: 'A', patientLastname: 'B', status: 'pending', expiresAt: PAST });
      prisma.reviewInvite.updateMany.mockResolvedValue({ count: 1 });
      const req = mockReq({ params: { token: 'tok_abc' } });
      const res = mockRes();
      await validateInvite(req, res, mockNext());
      expect(prisma.reviewInvite.updateMany).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ valid: false, reason: 'expired' });
    });

    it('inexistente → valid:false reason not_found (nunca 404)', async () => {
      prisma.reviewInvite.findUnique.mockResolvedValue(null);
      const req = mockReq({ params: { token: 'nope' } });
      const res = mockRes();
      await validateInvite(req, res, mockNext());
      expect(res.status).not.toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ valid: false, reason: 'not_found' });
    });
  });

  // ── submitInvite ───────────────────────────────────────────────────────────
  describe('submitInvite', () => {
    it('happy-path: claim atómico → crea reseña pending heredando identidad → 201', async () => {
      prisma.reviewInvite.updateMany.mockResolvedValue({ count: 1 });
      prisma.reviewInvite.findUnique.mockResolvedValue({ id: 'inv-1', patientName: 'María José', patientLastname: 'Rivera' });
      prisma.review.create.mockResolvedValue({ id: 'rev-1' });
      prisma.reviewInvite.update.mockResolvedValue({});

      const req = mockReq({ params: { token: 'tok_abc' }, body: { rating: 5, body: 'Excelente atención y resultados naturales.', treatment: 'Botox' } });
      const res = mockRes();
      await submitInvite(req, res, mockNext());

      // claim condicional: pending + no vencido
      const claimArg = prisma.reviewInvite.updateMany.mock.calls[0][0];
      expect(claimArg.where).toEqual(expect.objectContaining({ token: 'tok_abc', status: 'pending' }));
      expect(claimArg.data).toEqual(expect.objectContaining({ status: 'used' }));
      // reseña hereda identidad de la invitación y nace pending
      const reviewArg = prisma.review.create.mock.calls[0][0];
      expect(reviewArg.data).toEqual(expect.objectContaining({
        patientName: 'María José', patientLastname: 'Rivera', status: 'pending', inviteId: 'inv-1', rating: 5,
      }));
      expect(prisma.reviewInvite.update).toHaveBeenCalledWith(expect.objectContaining({ data: { reviewId: 'rev-1' } }));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ review_id: 'rev-1', status: 'pending' });
    });

    it('doble-envío: el 2º falla — claim 0 filas → 409 INVITE_INVALID reason used', async () => {
      prisma.reviewInvite.updateMany.mockResolvedValue({ count: 0 });
      prisma.reviewInvite.findUnique.mockResolvedValue({ status: 'used', expiresAt: FUTURE });
      const req = mockReq({ params: { token: 'tok_abc' }, body: { rating: 5, body: 'x'.repeat(25) } });
      const res = mockRes();
      await submitInvite(req, res, mockNext());
      expect(prisma.review.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: 'INVITE_INVALID', reason: 'used' });
    });

    it('vencida: claim 0 → reason expired (y sincroniza fila)', async () => {
      prisma.reviewInvite.updateMany.mockResolvedValue({ count: 0 }); // claim falla
      prisma.reviewInvite.findUnique.mockResolvedValue({ status: 'pending', expiresAt: PAST });
      const req = mockReq({ params: { token: 'tok_abc' }, body: { rating: 4, body: 'x'.repeat(25) } });
      const res = mockRes();
      await submitInvite(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: 'INVITE_INVALID', reason: 'expired' });
    });

    it('revocada → reason revoked', async () => {
      prisma.reviewInvite.updateMany.mockResolvedValue({ count: 0 });
      prisma.reviewInvite.findUnique.mockResolvedValue({ status: 'revoked', expiresAt: FUTURE });
      const req = mockReq({ params: { token: 'tok_abc' }, body: { rating: 5, body: 'x'.repeat(25) } });
      const res = mockRes();
      await submitInvite(req, res, mockNext());
      expect(res.json).toHaveBeenCalledWith({ error: 'INVITE_INVALID', reason: 'revoked' });
    });

    it('token inexistente → reason not_found', async () => {
      prisma.reviewInvite.updateMany.mockResolvedValue({ count: 0 });
      prisma.reviewInvite.findUnique.mockResolvedValue(null);
      const req = mockReq({ params: { token: 'nope' }, body: { rating: 5, body: 'x'.repeat(25) } });
      const res = mockRes();
      await submitInvite(req, res, mockNext());
      expect(res.json).toHaveBeenCalledWith({ error: 'INVITE_INVALID', reason: 'not_found' });
    });
  });
});
