import { prisma } from '../../lib/prisma.js';
import { asyncHandler, badRequest, forbidden, notFound } from '../../lib/errors.js';
import { getPaging, paged, findPaged } from '../../lib/pagination.js';
import { toNum, round2 } from '../../lib/money.js';
import { decorateInvoice, overdueWhere, recordPayment } from '../../services/billing.service.js';
import { isDiscountValid } from '../../services/pricing.service.js';
import { loadSubscription, performAction, buildLines, checkPlan } from '../subscriptions/subscriptions.controller.js';
import { nextNumber } from '../../lib/sequence.js';
import { addDays, startOfDay } from '../../lib/dates.js';
import { sendMail } from '../../lib/email.js';

const CUSTOMER_ACTIONS = ['confirm', 'pause', 'resume', 'close'];
const visibleSubs = { OR: [{ status: { notIn: ['DRAFT'] } }, { requestedByCustomer: true }] };
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
  // (visibleSubs uses OR; status filter is ANDed alongside it)
  const { rows, total } = await findPaged(prisma.subscription, {
    where,
    select: {
      id: true, number: true, status: true, startDate: true, expiryDate: true, nextInvoiceDate: true, quotationValidUntil: true, createdAt: true, requestedByCustomer: true,
      plan: { select: { name: true, billingPeriod: true, intervalCount: true, price: true } },
      lines: { select: { quantity: true, unitPrice: true, product: { select: { name: true, artKey: true, imageUrl: true, tagline: true } } } },
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

/** GET /portal/overview — everything the portal home shows, scoped to the signed-in customer. */
export const overview = asyncHandler(async (req, res) => {
  const customerId = me(req);
  const now = new Date();
  const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const trendStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));
  const [customer, paidYear, invoices12, payments12, recentPayments, nextSub, manager, offers] = await Promise.all([
    prisma.customer.findUnique({ where: { id: customerId }, select: { name: true, company: true, email: true, phone: true, address: true, city: true, country: true, gstin: true, createdAt: true } }),
    prisma.payment.aggregate({ where: { invoice: { customerId }, paymentDate: { gte: yearStart } }, _sum: { amount: true }, _count: true }),
    prisma.invoice.findMany({ where: { customerId, status: { in: ['CONFIRMED', 'PAID'] }, invoiceDate: { gte: trendStart } }, select: { invoiceDate: true, total: true } }),
    prisma.payment.findMany({ where: { invoice: { customerId }, paymentDate: { gte: trendStart } }, select: { paymentDate: true, amount: true } }),
    prisma.payment.findMany({
      where: { invoice: { customerId } }, orderBy: { paymentDate: 'desc' }, take: 5,
      select: { id: true, number: true, method: true, amount: true, paymentDate: true, invoice: { select: { id: true, number: true } } },
    }),
    prisma.subscription.findFirst({
      where: { customerId, status: 'ACTIVE', nextInvoiceDate: { not: null } }, orderBy: { nextInvoiceDate: 'asc' },
      select: { id: true, number: true, nextInvoiceDate: true, plan: { select: { name: true, price: true } }, lines: { select: { quantity: true, unitPrice: true } } },
    }),
    prisma.subscription.findFirst({ where: { customerId, salespersonId: { not: null } }, orderBy: { createdAt: 'desc' }, select: { salesperson: { select: { name: true, email: true } } } }),
    prisma.discount.findMany({ where: { isActive: true, scope: 'SUBSCRIPTION', code: { not: null } }, orderBy: { endDate: 'asc' } }),
  ]);

  // 12-month spending: invoiced vs paid, one row per month (zeros filled)
  const key = (d) => new Date(d).toISOString().slice(0, 7);
  const months = Array.from({ length: 12 }, (_, i) => key(new Date(Date.UTC(trendStart.getUTCFullYear(), trendStart.getUTCMonth() + i, 1))));
  const sumBy = (rows, dateKey, amtKey) => rows.reduce((m, r) => { const k = key(r[dateKey]); m[k] = (m[k] || 0) + toNum(r[amtKey]); return m; }, {});
  const inv = sumBy(invoices12, 'invoiceDate', 'total');
  const pay = sumBy(payments12, 'paymentDate', 'amount');

  const nextAmount = nextSub ? round2(toNum(nextSub.plan.price) + nextSub.lines.reduce((a, l) => a + l.quantity * toNum(l.unitPrice), 0)) : null;

  res.json({ data: {
    customer,
    paidThisYear: toNum(paidYear._sum.amount),
    paymentsThisYear: paidYear._count,
    nextBill: nextSub ? { subscriptionId: nextSub.id, number: nextSub.number, plan: nextSub.plan.name, date: nextSub.nextInvoiceDate, amountBeforeTax: nextAmount } : null,
    trend: months.map((m) => ({ month: m, invoiced: round2(inv[m] || 0), paid: round2(pay[m] || 0) })),
    recentPayments,
    accountManager: manager?.salesperson ?? null,
    // Public offers only: valid, subscription-wide, with a code (no internal rules exposed)
    offers: offers.filter((d) => isDiscountValid(d)).slice(0, 2).map((d) => ({
      name: d.name, code: d.code, type: d.type, value: toNum(d.value), endDate: d.endDate, minPurchase: d.minPurchase ? toNum(d.minPurchase) : null,
    })),
  } });
});

/** GET /portal/catalog — what a customer can add: catalog products (with artwork + features) and the plans on offer. */
export const catalog = asyncHandler(async (req, res) => {
  me(req);
  const now = new Date();
  const [products, plans] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, inCatalog: true }, orderBy: { id: 'asc' },
      select: { id: true, name: true, type: true, salesPrice: true, tagline: true, features: true, artKey: true, imageUrl: true, notes: true,
        tax: { select: { name: true } }, variants: { select: { id: true, attribute: true, value: true, extraPrice: true }, orderBy: { extraPrice: 'asc' } } },
    }),
    prisma.plan.findMany({
      where: { isActive: true, OR: [{ endDate: null }, { endDate: { gte: now } }] }, orderBy: { id: 'asc' },
      select: { id: true, name: true, billingPeriod: true, intervalCount: true, minQuantity: true, price: true, pausable: true, closable: true, renewable: true },
    }),
  ]);
  res.json({ data: { products, plans } });
});

/**
 * POST /portal/requests — the customer asks for a service. It becomes a DRAFT subscription flagged requestedByCustomer;
 * their account manager prices it and sends the offer (quotation) back for the customer to approve.
 */
export const requestSubscription = asyncHandler(async (req, res) => {
  const customerId = me(req);
  const { productId, variantId, planId, quantity, note } = req.body;
  const sub = await prisma.$transaction(async (tx) => {
    const product = await tx.product.findFirst({ where: { id: productId, isActive: true, inCatalog: true } });
    if (!product) throw badRequest('This service is not available to add right now');
    const startDate = addDays(startOfDay(), 1);
    const plan = await checkPlan(tx, planId, startDate);
    const lines = await buildLines(tx, [{ productId, variantId: variantId || null, quantity }], plan);
    const manager = await tx.subscription.findFirst({ where: { customerId, salespersonId: { not: null } }, orderBy: { createdAt: 'desc' }, select: { salespersonId: true } });
    const created = await tx.subscription.create({ data: {
      number: await nextNumber('SUB', tx), customerId, planId: plan.id, salespersonId: manager?.salespersonId ?? null,
      status: 'DRAFT', requestedByCustomer: true, startDate, paymentTermDays: 15,
      notes: note ? `Requested from the customer portal: “${note}”` : 'Requested from the customer portal.',
      lines: { create: lines },
      events: { create: [{ toStatus: 'DRAFT', userId: req.user.id, note: 'Requested by customer via portal' }] },
    }, include: { salesperson: { select: { email: true, name: true } }, customer: { select: { name: true } } } });
    return created;
  });
  if (sub.salesperson?.email) {
    sendMail({ to: sub.salesperson.email, subject: `New request from ${sub.customer.name}: ${sub.number}`,
      text: `${sub.customer.name} asked to add a subscription (${sub.number}). Open it in Brightloop, check the price and send the offer.` }).catch(() => {});
  }
  res.status(201).json({ data: { id: sub.id, number: sub.number } });
});
