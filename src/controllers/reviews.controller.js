const prisma = require('../services/prisma.service');

// Campos expuestos al público — nunca ip_hash, deleted_at
function toPublicReview(r) {
  return {
    id:          r.id,
    patient_name: r.patientName,
    patient_lastname: r.patientLastname,
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
    patient_lastname: r.patientLastname,
    treatment:    r.treatment,
    body:         r.body,
    rating:       r.rating,
    status:       r.status,
    created_at:   r.createdAt,
    approved_at:  r.approvedAt,
    deleted_at:   r.deletedAt,
  };
}

/**
 * Reseñas públicas por página.
 *
 * El tope era 20 sin paginar: al pasar de esa cifra las reseñas más antiguas
 * dejaban de existir para el sitio, sin aviso. Se pagina con el mismo contrato
 * que `/treatments` para no inventar una convención nueva:
 *
 *   - sin `?page`  → objeto con las 20 más recientes y el agregado (compatible
 *                    con lo que el sitio ya consume hoy).
 *   - con `?page=N` → añade `total`, `page`, `limit` y `totalPages`.
 *
 * El agregado se calcula SIEMPRE sobre todas las aprobadas, no sobre la página:
 * es la nota media del consultorio, no la de un tramo.
 */
// Seis: dos filas exactas en la rejilla de tres columnas del sitio. Con 9 la
// última fila quedaba coja en escritorio.
const PUBLIC_REVIEWS_PAGE_SIZE = 6;

// GET /api/reviews/public — público
async function listPublicReviews(req, res, next) {
  try {
    const paginado = req.query.page !== undefined;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = paginado ? PUBLIC_REVIEWS_PAGE_SIZE : 20;
    const skip = paginado ? (page - 1) * limit : 0;

    const [reviews, aggregate] = await Promise.all([
      prisma.review.findMany({
        where:   { status: 'approved' },
        orderBy: { approvedAt: 'desc' },
        skip,
        take:    limit,
        select: {
          id: true, patientName: true, patientLastname: true, treatment: true,
          body: true, rating: true, approvedAt: true,
        },
      }),
      prisma.review.aggregate({
        where:   { status: 'approved' },
        _avg:    { rating: true },
        _count:  { id: true },
      }),
    ]);

    const total = aggregate._count.id;

    return res.json({
      reviews: reviews.map(toPublicReview),
      aggregate: {
        avg_rating:  aggregate._avg.rating
          ? Math.round(aggregate._avg.rating * 10) / 10
          : null,
        total_count: total,
      },
      ...(paginado
        ? { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) }
        : {}),
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

/**
 * GET /api/admin/reviews — superficie de administración.
 *
 * Devuelve TODAS las reseñas: pendientes, aprobadas y eliminadas, sin tope de
 * filas. `listAdminReviews` esconde las eliminadas salvo que se pidan y corta
 * en 500 sin decirlo; el panel es la herramienta del administrador y ahí no se
 * oculta nada. Qué mostrar y cómo agruparlo es decisión de la interfaz, no del
 * backend: aquí sale el dato completo y cada reseña lleva su `status`.
 */
async function listAllReviews(req, res, next) {
  try {
    const reviews = await prisma.review.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    });
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
  listPublicReviews,
  listAdminReviews,
  listAllReviews,
  getStats,
  approveReview,
  deleteReview,
};
