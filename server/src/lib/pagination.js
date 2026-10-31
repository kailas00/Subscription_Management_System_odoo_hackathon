// Standard list query: ?page=1&pageSize=20&search=&sort=createdAt&order=desc
// Response: { data: [...], meta: { page, pageSize, total, totalPages } }
export function getPaging(query, { maxPageSize = 100, defaultSort = 'createdAt' } = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const pageSize = Math.min(maxPageSize, Math.max(1, parseInt(query.pageSize, 10) || 20));
  const order = query.order === 'asc' ? 'asc' : 'desc';
  const sort = /^[a-zA-Z]+$/.test(query.sort || '') ? query.sort : defaultSort;
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize, orderBy: { [sort]: order }, search: (query.search || '').trim() };
}

export function paged(res, data, total, { page, pageSize }) {
  return res.json({ data, meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) } });
}

// Runs findMany + count in one transaction.
export async function findPaged(model, { where, include, select, paging }) {
  const [rows, total] = await Promise.all([
    model.findMany({ where, include, select, skip: paging.skip, take: paging.take, orderBy: paging.orderBy }),
    model.count({ where }),
  ]);
  return { rows, total };
}
