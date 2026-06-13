const prisma = require('../services/prisma.service');
const { hashIp } = require('../middlewares/reviewRateLimit.middleware');

// Campos expuestos al público — nunca ip_hash, deleted_at
function toPublicReview(r) {
  return {
    id:          r.id,
    patient_name: r.patientName,
    treatment:   r.treatment,
    body:        r.body,
    rating:      r.rating,
    approved_at: r.approvedAt,
  };
}

// Campos expuestos al admin — incluye status, fechas internas, nunca ip_hash
function toAdminReview(r) {
  return {
    id:           r.id,
    patient_name: r.patientName,
    treatment:    r.treatment,
    body:         r.body,
    rating:       r.rating,
    status:       r.status,
    created_at:   r.createdAt,
    approved_at:  r.approvedAt,
    deleted_at:   r.deletedAt,
  };
}

// POST /api/reviews — público
async function createReview(req, res, next) {
  try {
    const { patient_name, treatment, body, rating } = req.body;

    const review = await prisma.review.create({
      data: {
        patientName: patient_name,
        treatment:   treatment ?? null,
        body,
        rating,
        ipHash:      hashIp(req.ip),
        status:      'pending',
      },
    });

    return res.status(201).json({ id: review.id, status: review.status });
  } catch (err) {
    next(err);
  }
}

// GET /api/reviews/public — público
async function listPublicReviews(req, res, next) {
  try {
    const [reviews, aggregate] = await Promise.all([
      prisma.review.findMany({
        where:   { status: 'approved' },
        orderBy: { approvedAt: 'desc' },
        take:    20,
        select: {
          id: true, patientName: true, treatment: true,
          body: true, rating: true, approvedAt: true,
        },
      }),
      prisma.review.aggregate({
        where:   { status: 'approved' },
        _avg:    { rating: true },
        _count:  { id: true },
      }),
    ]);

    return res.json({
      reviews: reviews.map(toPublicReview),
      aggregate: {
        avg_rating:  aggregate._avg.rating
          ? Math.round(aggregate._avg.rating * 10) / 10
          : null,
        total_count: aggregate._count.id,
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/reviews — admin
async function listAdminReviews(req, res, next) {
  try {
    const { status } = req.query;

    let where;
    if (status === 'pending' || status === 'approved' || status === 'deleted') {
      where = { status };
    } else {
      // default: pending + approved (no deleted)
      where = { status: { in: ['pending', 'approved'] } };
    }

    const reviews = await prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    // pending primero cuando se muestra mixed
    if (!status) {
      reviews.sort((a, b) => {
        if (a.status === b.status) return 0;
        return a.status === 'pending' ? -1 : 1;
      });
    }

    return res.json({ reviews: reviews.map(toAdminReview) });
  } catch (err) {
    next(err);
  }
}

// GET /api/reviews/stats — admin
async function getStats(req, res, next) {
  try {
    const [pending, approved, deleted, agg] = await Promise.all([
      prisma.review.count({ where: { status: 'pending' } }),
      prisma.review.count({ where: { status: 'approved' } }),
      prisma.review.count({ where: { status: 'deleted' } }),
      prisma.review.aggregate({
        where: { status: 'approved' },
        _avg:  { rating: true },
      }),
    ]);

    return res.json({
      pending_count:  pending,
      approved_count: approved,
      deleted_count:  deleted,
      avg_rating: agg._avg.rating
        ? Math.round(agg._avg.rating * 10) / 10
        : null,
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/reviews/:id/approve — admin
async function approveReview(req, res, next) {
  try {
    const approvedAt = new Date();
    // updateMany con condición en WHERE — atómico, sin TOCTOU
    const result = await prisma.review.updateMany({
      where: { id: req.params.id, status: 'pending' },
      data:  { status: 'approved', approvedAt },
    });

    if (result.count === 0) return res.status(404).json({ error: 'NOT_FOUND' });

    return res.json({ id: req.params.id, status: 'approved', approved_at: approvedAt });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/reviews/:id — admin (soft delete)
async function deleteReview(req, res, next) {
  try {
    // updateMany con condición en WHERE — atómico, sin TOCTOU
    const result = await prisma.review.updateMany({
      where: { id: req.params.id, status: { not: 'deleted' } },
      data:  { status: 'deleted', deletedAt: new Date() },
    });

    if (result.count === 0) return res.status(404).json({ error: 'NOT_FOUND' });

    return res.json({ id: req.params.id, status: 'deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createReview,
  listPublicReviews,
  listAdminReviews,
  getStats,
  approveReview,
  deleteReview,
};
