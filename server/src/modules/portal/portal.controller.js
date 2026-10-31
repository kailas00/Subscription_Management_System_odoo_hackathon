import { prisma } from '../../lib/prisma.js';
import { asyncHandler, badRequest, forbidden, notFound } from '../../lib/errors.js';
import { getPaging, paged, findPaged } from '../../lib/pagination.js';
import { toNum, round2 } from '../../lib/money.js';
import { decorateInvoice, overdueWhere, recordPayment } from '../../services/billing.service.js';
import { loadSubscription, performAction } from '../subscriptions/subscriptions.controller.js';

const CUSTOMER_ACTIONS = ['confirm', 'pause', 'resume', 'close'];
const visibleSubs = { status: { notIn: ['DRAFT'] } };
const visibleInvoices = { status: { in: ['CONFIRMED', 'PAID'] } };

function me(req) {
  if (!req.user.customerId) throw forbidden('This login is not linked to a customer account');
  return req.user.customerId;
}

export const summary = asyncHandler(async (req, res) => {
  const customerId = me(req);
  const [activeSubscriptions, pendingQuotations, open, overdueCount, next] = await Promise.all([
    prisma.subscription.count({ where: { customerId, status: 'ACTIVE' } }),
    prisma.subscription.count({ where: { customerId, status: 'QUOTATION' } }),
    prisma.invoice.aggregate({ where: { customerId, status: 'CONFIRMED' }, _sum: { total: true, amountPaid: true }, _count: true }),
    prisma.invoice.count({ where: { customerId, ...overdueWhere() } }),
    prisma.subscription.findFirst({ where: { customerId, status: 'ACTIVE', nextInvoiceDate: { not: null } }, orderBy: { nextInvoiceDate: 'asc' }, select: { nextInvoiceDate: true } }),
  ]);
  res.json({ data: {
    activeSubscriptions, pendingQuotations, overdueCount,
    unpaidCount: open._count,
    outstanding: round2(toNum(open._sum.total) - toNum(open._sum.amountPaid)),
    nextInvoiceDate: next?.nextInvoiceDate ?? null,
  } });
});

export const listSubscriptions = asyncHandler(async (req, res) => {
  const customerId = me(req);
  const paging = getPaging(req.query);
  const where = { customerId, ...visibleSubs, ...(req.query.status && { status: { in: req.query.status.split(',') } }) };
  const { rows, total } = await findPaged(prisma.subscription, {
    where,
    select: {
      id: true, number: true, status: true, startDate: true, expiryDate: true, nextInvoiceDate: true, quotationValidUntil: true, createdAt: true,
      plan: { select: { name: true, billingPeriod: true, intervalCount: true } },
      lines: { select: { quantity: true, product: { select: { name: true } } } },
    },
    paging,
  });
  paged(res, rows, total, paging);
});

async function ownSubscription(req) {
  const sub = await loadSubscription(req.params.id, { customerId: me(req), ...visibleSubs });
  const { salesperson, events, ...rest } = sub; // internal details stay internal
  return {
    ...rest,
    actions: sub.actions.filter((a) => CUSTOMER_ACTIONS.includes(a) && (a !== 'confirm' || sub.status === 'QUOTATION')),
    invoices: sub.invoices.filter((i) => ['CONFIRMED', 'PAID'].includes(i.status)).map(decorateInvoice),
  };
}

export const getSubscription = asyncHandler(async (req, res) => res.json({ data: await ownSubscription(req) }));

export const runAction = asyncHandler(async (req, res) => {
  const sub = await ownSubscription(req);
  if (!sub.actions.includes(req.params.action)) throw badRequest('This action is not available for your subscription');
  await performAction(sub.id, req.params.action, { userId: req.user.id, via: 'By customer via portal' });
  res.json({ data: await ownSubscription(req) });
});

export const listInvoices = asyncHandler(async (req, res) => {
  const customerId = me(req);
  const paging = getPaging(req.query, { defaultSort: 'invoiceDate' });
  const where = { customerId, ...(['CONFIRMED', 'PAID'].includes(req.query.status) ? { status: req.query.status } : visibleInvoices) };
  const { rows, total } = await findPaged(prisma.invoice, {
    where,
    select: { id: true, number: true, status: true, invoiceDate: true, dueDate: true, total: true, amountPaid: true, subscription: { select: { id: true, number: true } } },
    paging,
  });
  paged(res, rows.map(decorateInvoice), total, paging);
});

async function ownInvoice(req) {
  const inv = await prisma.invoice.findFirst({
    where: { id: req.params.id, customerId: me(req), ...visibleInvoices },
    include: {
      customer: true,
      subscription: { select: { id: true, number: true, plan: { select: { name: true, billingPeriod: true } } } },
      lines: { orderBy: { id: 'asc' } },
      payments: { select: { id: true, number: true, method: true, amount: true, paymentDate: true }, orderBy: { paymentDate: 'desc' } },
    },
  });
  if (!inv) throw notFound('Invoice');
  return decorateInvoice(inv);
}

export const getInvoice = asyncHandler(async (req, res) => res.json({ data: await ownInvoice(req) }));

export const pay = asyncHandler(async (req, res) => {
  const inv = await ownInvoice(req);
  await recordPayment({ invoiceId: inv.id, method: req.body.method, customerId: me(req), recordedById: req.user.id, note: 'Paid via customer portal' });
  res.status(201).json({ data: await ownInvoice(req) });
});
