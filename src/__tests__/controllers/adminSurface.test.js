jest.mock('../../services/prisma.service', () => ({
  review: { findMany: jest.fn() },
  reviewInvite: { findMany: jest.fn(), updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
}));

const prisma = require('../../services/prisma.service');
const { listAllReviews } = require('../../controllers/reviews.controller');
const { listAllInvites } = require('../../controllers/reviewInvites.controller');
const { mockReq, mockRes, mockNext } = require('../helpers/mock-req-res');

const REVIEW = {
  id: 'rid-1', patientName: 'Ana', patientLastname: 'Pérez', treatment: 'Botox',
  body: 'Excelente', rating: 5, status: 'deleted', createdAt: new Date(), approvedAt: null,
};
const INVITE = {
  id: 'iid-1', token: 't', patientName: 'Ana', patientLastname: 'Pérez', email: null,
  phone: null, status: 'expired', createdAt: new Date(), expiresAt: new Date(), usedAt: null, reviewId: null,
};

/**
 * El panel es la herramienta de trabajo del administrador: no filtra nada por
 * su cuenta y no tiene techo. Todo lo que existe en la base de datos se ve.
 */
describe('superficie de administración: no se oculta nada', () => {
  describe('listAllReviews', () => {
    it('incluye las reseñas eliminadas — sin filtro de estado', async () => {
      prisma.review.findMany.mockResolvedValue([REVIEW]);
      const res = mockRes();
      await listAllReviews(mockReq({ user: { role: 'ADMIN' } }), res, mockNext());
      const call = prisma.review.findMany.mock.calls.at(-1)[0];
      expect(call.where).toBeUndefined();
      expect(res.json).toHaveBeenCalledWith({
        reviews: [expect.objectContaining({ id: 'rid-1', status: 'deleted' })],
      });
    });

    it('no aplica ningún tope de filas', async () => {
      prisma.review.findMany.mockResolvedValue([]);
      await listAllReviews(mockReq({ user: { role: 'ADMIN' } }), mockRes(), mockNext());
      const call = prisma.review.findMany.mock.calls.at(-1)[0];
      expect(call.take).toBeUndefined();
      expect(call.skip).toBeUndefined();
    });

    it('ignora ?status: la superficie admin siempre devuelve todo', async () => {
      prisma.review.findMany.mockResolvedValue([]);
      await listAllReviews(mockReq({ user: { role: 'ADMIN' }, query: { status: 'approved' } }), mockRes(), mockNext());
      expect(prisma.review.findMany.mock.calls.at(-1)[0].where).toBeUndefined();
    });
  });

  describe('listAllInvites', () => {
    it('devuelve todas las invitaciones, sin filtro ni tope', async () => {
      prisma.reviewInvite.findMany.mockResolvedValue([INVITE]);
      const res = mockRes();
      await listAllInvites(mockReq({ user: { role: 'ADMIN' }, query: { status: 'pending' } }), res, mockNext());
      const call = prisma.reviewInvite.findMany.mock.calls.at(-1)[0];
      expect(call.where).toBeUndefined();
      expect(call.take).toBeUndefined();
      expect(res.json).toHaveBeenCalledWith({
        invites: [expect.objectContaining({ id: 'iid-1', status: 'expired' })],
      });
    });
  });
});
