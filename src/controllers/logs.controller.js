const prisma = require('../services/prisma.service');
const { parsePagination } = require('../utils/pagination');

// Construye el filtro WHERE a partir de query params validados.
function buildWhere(query) {
  const where = {};

  const status = parseInt(query.statusCode, 10);
  if (Number.isInteger(status)) where.statusCode = status;

  if (typeof query.method === 'string' && query.method.trim()) {
    where.method = query.method.trim().toUpperCase().slice(0, 10);
  }

  const createdAt = {};
  const from = query.from ? new Date(query.from) : null;
  const to = query.to ? new Date(query.to) : null;
  if (from && !Number.isNaN(from.getTime())) createdAt.gte = from;
  if (to && !Number.isNaN(to.getTime())) createdAt.lte = to;
  if (Object.keys(createdAt).length) where.createdAt = createdAt;

  return where;
}

/**
 * GET /api/logs — lista paginada de errores de backend. Solo ADMIN.
 *
 * Rendimiento: findMany + count se lanzan en paralelo con Promise.all → un solo
 * ida-y-vuelta lógico al pool, sin async-waterfall. El WHERE se apoya en los
 * índices (status_code, created_at desc) definidos en el schema, evitando seq
 * scans bajo crecimiento de la tabla.
 */
async function listErrorLogs(req, res, next) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const where = buildWhere(req.query);

    const [logs, total] = await Promise.all([
      prisma.errorLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.errorLog.count({ where }),
    ]);

    return res.json({
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { listErrorLogs };
