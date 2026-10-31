import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../lib/errors.js';
import { getPaging, paged, findPaged } from '../../lib/pagination.js';
import { toNum } from '../../lib/money.js';
import { startOfDay } from '../../lib/dates.js';
import { recordPayment } from '../../services/billing.service.js';

export const list = asyncHandler(async (req, res) => {
  const paging = getPaging(req.query, { defaultSort: 'paymentDate' });
  const q = req.query;
  const where = {
    ...(q.method && { method: q.method }),
    ...(q.invoiceId && { invoiceId: q.invoiceId }),
    ...((q.from || q.to) && { paymentDate: { ...(q.from && { gte: startOfDay(q.from) }), ...(q.to && { lte: q.to }) } }),
    ...(paging.search && { OR: [
      { number: { contains: paging.search, mode: 'insensitive' } },
      { invoice: { number: { contains: paging.search, mode: 'insensitive' } } },
      { invoice: { customer: { name: { contains: paging.search, mode: 'insensitive' } } } },
    ] }),
  };
  const [{ rows, total }, sum] = await Promise.all([
    findPaged(prisma.payment, {
      where,
      include: { invoice: { select: { id: true, number: true, customer: { select: { id: true, name: true } } } }, recordedBy: { select: { name: true } } },
      paging,
    }),
    prisma.payment.aggregate({ where, _sum: { amount: true } }),
  ]);
  res.json({ data: rows, meta: { page: paging.page, pageSize: paging.pageSize, total, totalPages: Math.max(1, Math.ceil(total / paging.pageSize)), totalAmount: toNum(sum._sum.amount) } });
});

export const create = asyncHandler(async (req, res) => {
  const result = await recordPayment({ ...req.body, recordedById: req.user.id });
  res.status(201).json({ data: result });
});
