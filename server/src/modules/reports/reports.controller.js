import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../lib/errors.js';
import { getPaging, paged } from '../../lib/pagination.js';
import { toNum, round2 } from '../../lib/money.js';
import { startOfDay, MRR_FACTOR } from '../../lib/dates.js';
import { overdueWhere } from '../../services/billing.service.js';

function range(q) {
  const now = new Date();
  const from = q.from ? startOfDay(q.from) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const to = q.to ? new Date(new Date(q.to).setUTCHours(23, 59, 59, 999)) : now;
  return { from, to };
}

// Recurring amount per period (lines before tax/discount + plan fee), grouped by plan, for ACTIVE subscriptions.
async function activeRecurringByPlan(planId) {
  return prisma.$queryRaw`
    SELECT p.id AS "planId", p.name, p."billingPeriod"::text AS "billingPeriod", p."intervalCount",
           COUNT(s.id)::int AS "activeCount",
           COALESCE(SUM(COALESCE(l.amount, 0) + p.price), 0)::float AS "periodAmount"
    FROM "Subscription" s
    JOIN "Plan" p ON p.id = s."planId"
    LEFT JOIN (SELECT "subscriptionId", SUM(quantity * "unitPrice") AS amount FROM "SubscriptionLine" GROUP BY "subscriptionId") l
      ON l."subscriptionId" = s.id
    WHERE s.status = 'ACTIVE' ${planId ? Prisma.sql`AND p.id = ${planId}` : Prisma.empty}
    GROUP BY p.id
    ORDER BY p.name`;
}
const mrrOf = (r) => round2((r.periodAmount * MRR_FACTOR[r.billingPeriod]) / (r.intervalCount || 1));

export const summary = asyncHandler(async (req, res) => {
  const { from, to } = range(req.query);
  const [byPlan, activeSubscriptions, collected, invoiced, open, overdue, newSubscriptions, churned] = await Promise.all([
    activeRecurringByPlan(req.query.planId),
    prisma.subscription.count({ where: { status: 'ACTIVE', ...(req.query.planId && { planId: req.query.planId }) } }),
    prisma.payment.aggregate({ where: { paymentDate: { gte: from, lte: to } }, _sum: { amount: true } }),
    prisma.invoice.aggregate({ where: { status: { not: 'CANCELLED' }, invoiceDate: { gte: from, lte: to } }, _sum: { total: true }, _count: true }),
    prisma.invoice.aggregate({ where: { status: 'CONFIRMED' }, _sum: { total: true, amountPaid: true }, _count: true }),
    prisma.invoice.aggregate({ where: overdueWhere(), _sum: { total: true, amountPaid: true }, _count: true }),
    prisma.subscription.count({ where: { createdAt: { gte: from, lte: to }, status: { notIn: ['DRAFT', 'CANCELLED'] } } }),
    prisma.subscription.count({ where: { status: 'CLOSED', closedAt: { gte: from, lte: to } } }),
  ]);
  res.json({ data: {
    from, to,
    activeSubscriptions,
    mrr: round2(byPlan.reduce((a, r) => a + mrrOf(r), 0)),
    revenue: toNum(collected._sum.amount),
    invoiced: toNum(invoiced._sum.total),
    invoiceCount: invoiced._count,
    outstanding: round2(toNum(open._sum.total) - toNum(open._sum.amountPaid)),
    unpaidCount: open._count,
    overdueCount: overdue._count,
    overdueAmount: round2(toNum(overdue._sum.total) - toNum(overdue._sum.amountPaid)),
    newSubscriptions,
    churned,
  } });
});

export const revenueTrend = asyncHandler(async (req, res) => {
  const months = req.query.months || 12;
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));
  const [inv, pay] = await Promise.all([
    prisma.$queryRaw`
      SELECT to_char(date_trunc('month', "invoiceDate"), 'YYYY-MM') AS month, SUM(total)::float AS value
      FROM "Invoice" WHERE status <> 'CANCELLED' AND "invoiceDate" >= ${start} GROUP BY 1`,
    prisma.$queryRaw`
      SELECT to_char(date_trunc('month', "paymentDate"), 'YYYY-MM') AS month, SUM(amount)::float AS value
      FROM "Payment" WHERE "paymentDate" >= ${start} GROUP BY 1`,
  ]);
  const im = Object.fromEntries(inv.map((r) => [r.month, r.value]));
  const pm = Object.fromEntries(pay.map((r) => [r.month, r.value]));
  const data = Array.from({ length: months }, (_, i) => {
    const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1));
    const month = d.toISOString().slice(0, 7);
    return { month, invoiced: round2(im[month] || 0), collected: round2(pm[month] || 0) };
  });
  res.json({ data });
});

export const subscriptionsByStatus = asyncHandler(async (req, res) => {
  const rows = await prisma.subscription.groupBy({ by: ['status'], _count: { _all: true } });
  const order = ['DRAFT', 'QUOTATION', 'CONFIRMED', 'ACTIVE', 'PAUSED', 'CLOSED', 'CANCELLED'];
  const map = Object.fromEntries(rows.map((r) => [r.status, r._count._all]));
  res.json({ data: order.map((status) => ({ status, count: map[status] || 0 })) });
});

export const planBreakdown = asyncHandler(async (req, res) => {
  const rows = await activeRecurringByPlan(req.query.planId);
  res.json({ data: rows.map((r) => ({ planId: r.planId, name: r.name, billingPeriod: r.billingPeriod, activeCount: r.activeCount, mrr: mrrOf(r) })) });
});

export const overdue = asyncHandler(async (req, res) => {
  const paging = getPaging(req.query);
  const where = overdueWhere();
  const [rows, total] = await Promise.all([
    prisma.invoice.findMany({
      where, skip: paging.skip, take: paging.take, orderBy: { dueDate: 'asc' },
      select: { id: true, number: true, dueDate: true, total: true, amountPaid: true, customer: { select: { id: true, name: true, email: true } }, subscription: { select: { id: true, number: true } } },
    }),
    prisma.invoice.count({ where }),
  ]);
  const today = startOfDay();
  paged(res, rows.map((r) => ({
    ...r,
    outstanding: round2(toNum(r.total) - toNum(r.amountPaid)),
    daysOverdue: Math.round((today - startOfDay(r.dueDate)) / 86400000),
  })), total, paging);
});
