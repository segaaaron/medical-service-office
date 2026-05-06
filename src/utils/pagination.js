const { PAGINATION_DEFAULT_LIMIT, PAGINATION_MAX_LIMIT } = require('../config/env');

function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(PAGINATION_MAX_LIMIT, Math.max(1, parseInt(query.limit) || PAGINATION_DEFAULT_LIMIT));
  return { page, limit, skip: (page - 1) * limit };
}

module.exports = { parsePagination };
