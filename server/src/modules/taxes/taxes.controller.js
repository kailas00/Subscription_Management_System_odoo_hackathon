import { prisma } from '../../lib/prisma.js';
import { asyncHandler, notFound } from '../../lib/errors.js';
import { getPaging, paged, findPaged } from '../../lib/pagination.js';

export const list = asyncHandler(async (req, res) => {
  const paging = getPaging({ ...req.query, pageSize: req.query.pageSize || 100 });
  paging.orderBy = [{ isActive: 'desc' }, { name: 'asc' }];
  const where = paging.search ? { name: { contains: paging.search, mode: 'insensitive' } } : {};
  const { rows, total } = await findPaged(prisma.tax, { where, paging });
  paged(res, rows, total, paging);
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json({ data: await prisma.tax.create({ data: req.body }) });
});

export const update = asyncHandler(async (req, res) => {
  if (!(await prisma.tax.findUnique({ where: { id: req.params.id } }))) throw notFound('Tax');
  res.json({ data: await prisma.tax.update({ where: { id: req.params.id }, data: req.body }) });
});

export const archive = asyncHandler(async (req, res) => {
  if (!(await prisma.tax.findUnique({ where: { id: req.params.id } }))) throw notFound('Tax');
  res.json({ data: await prisma.tax.update({ where: { id: req.params.id }, data: { isActive: false } }) });
});
