import { prisma } from '../../lib/prisma.js';
import { asyncHandler, conflict, notFound } from '../../lib/errors.js';
import { getPaging, paged, findPaged } from '../../lib/pagination.js';
import { toNum, round2 } from '../../lib/money.js';
import { overdueWhere } from '../../services/billing.service.js';

const search = (q) => (q ? { OR: ['name', 'email', 'company'].map((f) => ({ [f]: { contains: q, mode: 'insensitive' } })) } : {});

export const list = asyncHandler(async (req, res) => {
  const paging = getPaging(req.query, { defaultSort: 'name' });
  if (!req.query.sort) paging.orderBy = { name: 'asc' };
  const { rows, total } = await findPaged(prisma.customer, {
    where: search(paging.search),
    include: { _count: { select: { subscriptions: true } }, user: { select: { id: true } } },
    paging,
  });
  paged(res, rows.map(({ user, ...c }) => ({ ...c, hasLogin: !!user })), total, paging);
});

export const get = asyncHandler(async (req, res) => {
  const customer = await prisma.customer.findUnique({
    where: { id: req.params.id },
    include: {
      subscriptions: { take: 20, orderBy: { createdAt: 'desc' }, select: { id: true, number: true, status: true, nextInvoiceDate: true, plan: { select: { name: true } } } },
      invoices: { take: 20, orderBy: { invoiceDate: 'desc' }, select: { id: true, number: true, status: true, total: true, amountPaid: true, dueDate: true } },
    },
  });
  if (!customer) throw notFound('Customer');
  const [open, overdueCount] = await Promise.all([
    prisma.invoice.aggregate({ where: { customerId: customer.id, status: 'CONFIRMED' }, _sum: { total: true, amountPaid: true } }),
    prisma.invoice.count({ where: { customerId: customer.id, ...overdueWhere() } }),
  ]);
  const outstanding = round2(toNum(open._sum.total) - toNum(open._sum.amountPaid));
  res.json({ data: { ...customer, stats: { outstanding, overdueCount } } });
});

export const create = asyncHandler(async (req, res) => {
  if (await prisma.customer.findUnique({ where: { email: req.body.email } })) throw conflict('A customer with this email already exists');
  const customer = await prisma.customer.create({ data: req.body });
  res.status(201).json({ data: customer });
});

export const update = asyncHandler(async (req, res) => {
  const existing = await prisma.customer.findUnique({ where: { id: req.params.id } });
  if (!existing) throw notFound('Customer');
  const customer = await prisma.$transaction(async (tx) => {
    const c = await tx.customer.update({ where: { id: existing.id }, data: req.body });
    if (req.body.email && req.body.email !== existing.email && existing.userId) {
      await tx.user.update({ where: { id: existing.userId }, data: { email: req.body.email } });
    }
    return c;
  });
  res.json({ data: customer });
});
