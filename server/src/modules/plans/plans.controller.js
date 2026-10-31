import { prisma } from '../../lib/prisma.js';
import { asyncHandler, conflict, notFound } from '../../lib/errors.js';
import { getPaging, paged, findPaged } from '../../lib/pagination.js';

const withCounts = { _count: { select: { subscriptions: { where: { status: 'ACTIVE' } } } } };

export const list = asyncHandler(async (req, res) => {
  const paging = getPaging(req.query);
  if (!req.query.sort) paging.orderBy = { name: 'asc' };
  const where = {
    isActive: req.query.active === 'false' ? false : true,
    ...(paging.search && { name: { contains: paging.search, mode: 'insensitive' } }),
  };
  const { rows, total } = await findPaged(prisma.plan, { where, include: withCounts, paging });
  paged(res, rows, total, paging);
});

export const get = asyncHandler(async (req, res) => {
  const plan = await prisma.plan.findUnique({ where: { id: req.params.id }, include: withCounts });
  if (!plan) throw notFound('Plan');
  res.json({ data: plan });
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json({ data: await prisma.plan.create({ data: req.body, include: withCounts }) });
});

export const update = asyncHandler(async (req, res) => {
  const plan = await prisma.plan.findUnique({ where: { id: req.params.id }, include: withCounts });
  if (!plan) throw notFound('Plan');
  const periodChanged = (req.body.billingPeriod && req.body.billingPeriod !== plan.billingPeriod)
    || (req.body.intervalCount && req.body.intervalCount !== plan.intervalCount);
  if (periodChanged && plan._count.subscriptions > 0) {
    throw conflict('This plan has active subscriptions, so its billing period cannot change. Create a new plan instead.');
  }
  res.json({ data: await prisma.plan.update({ where: { id: plan.id }, data: req.body, include: withCounts }) });
});

export const archive = asyncHandler(async (req, res) => {
  if (!(await prisma.plan.findUnique({ where: { id: req.params.id } }))) throw notFound('Plan');
  res.json({ data: await prisma.plan.update({ where: { id: req.params.id }, data: { isActive: false } }) });
});
