const getPaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const offset = (page - 1) * limit;
  const sort = query.sort || 'created_at';
  const order = (query.order || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  return { page, limit, offset, sort, order };
};

const buildPaginationMeta = (total, page, limit) => ({
  page, limit, total, totalPages: Math.ceil(total / limit)
});

module.exports = { getPaginationParams, buildPaginationMeta };
