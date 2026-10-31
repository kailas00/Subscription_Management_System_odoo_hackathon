import { prisma } from '../../lib/prisma.js';
import { asyncHandler, badRequest, notFound } from '../../lib/errors.js';
import { getPaging, paged, findPaged } from '../../lib/pagination.js';
import { nextNumber } from '../../lib/sequence.js';
import { addDays, startOfDay } from '../../lib/dates.js';
import { sendMail } from '../../lib/email.js';
import { env } from '../../config/env.js';
import { unitPriceFor, computeInvoice } from '../../services/pricing.service.js';
import { previewSubscription, onSubscriptionActivated, activeProductDiscounts } from '../../services/billing.service.js';
import { assertTransition, availableActions, EDITABLE } from '../../services/subscriptionFlow.js';

const fullInclude = {
  customer: true,
  plan: true,
  discount: true,
  template: { select: { id: true, name: true } },
  salesperson: { select: { id: true, name: true } },
  lines: { include: { product: { select: { id: true, name: true, salesPrice: true, artKey: true, imageUrl: true } }, variant: true, tax: true }, orderBy: { id: 'asc' } },
  events: { include: { user: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
  invoices: { select: { id: true, number: true, status: true, total: true, amountPaid: true, invoiceDate: true, dueDate: true, periodStart: true, periodEnd: true }, orderBy: { invoiceDate: 'desc' } },
};

/** Full record + allowed actions + live totals. Shared by staff screens and the portal. */
export async function loadSubscription(id, extraWhere = {}) {
  // Parallel, and totals are computed from the record we already have (no second load of the same subscription).
  const [sub, productDiscounts] = await Promise.all([
    prisma.subscription.findFirst({ where: { id, ...extraWhere }, include: fullInclude }),
    activeProductDiscounts(),
  ]);
  if (!sub) throw notFound('Subscription');
  const totals = computeInvoice({ plan: sub.plan, lines: sub.lines, subscriptionDiscount: sub.discount, productDiscounts });
  return { ...sub, actions: availableActions(sub), totals };
}

export async function buildLines(tx, lines, plan) {
  const out = [];
  for (const l of lines) {
    const product = await tx.product.findUnique({ where: { id: l.productId } });
    if (!product || !product.isActive) throw badRequest('One of the products is missing or archived');
    let variant = null;
    if (l.variantId) {
      variant = await tx.productVariant.findUnique({ where: { id: l.variantId } });
      if (!variant || variant.productId !== product.id) throw badRequest(`The selected variant does not belong to ${product.name}`);
    }
    if (l.quantity < plan.minQuantity) throw badRequest(`${product.name}: quantity must be at least ${plan.minQuantity} for the ${plan.name} plan`);
    out.push({
      productId: product.id,
      variantId: variant?.id ?? null,
      quantity: l.quantity,
      unitPrice: l.unitPrice ?? unitPriceFor(product, variant),
      taxId: l.taxId !== undefined ? l.taxId : product.taxId,
      description: l.description || null,
    });
  }
  return out;
}

export async function checkPlan(tx, planId, startDate) {
  const plan = await tx.plan.findUnique({ where: { id: planId } });
  if (!plan || !plan.isActive) throw badRequest('Choose an active plan');
  if (plan.startDate && startDate < startOfDay(plan.startDate)) throw badRequest(`The ${plan.name} plan is only available from ${plan.startDate.toDateString()}`);
  if (plan.endDate && startDate > plan.endDate) throw badRequest(`The ${plan.name} plan ended on ${plan.endDate.toDateString()}`);
  return plan;
}

async function checkRefs(tx, { customerId, discountId }) {
  if (customerId && !(await tx.customer.findUnique({ where: { id: customerId } }))) throw badRequest('Customer not found');
  if (discountId) {
    const d = await tx.discount.findUnique({ where: { id: discountId } });
    if (!d || !d.isActive || d.scope !== 'SUBSCRIPTION') throw badRequest('Choose an active subscription-level discount');
  }
}

export const list = asyncHandler(async (req, res) => {
  const paging = getPaging(req.query);
  const statuses = req.query.status ? String(req.query.status).split(',').filter(Boolean) : null;
  const where = {
    ...(statuses && { status: { in: statuses } }),
    ...(req.query.customerId && { customerId: req.query.customerId }),
    ...(req.query.planId && { planId: req.query.planId }),
    ...(req.query.requested === 'true' && { requestedByCustomer: true }),
    ...(paging.search && { OR: [
      { number: { contains: paging.search, mode: 'insensitive' } },
      { customer: { name: { contains: paging.search, mode: 'insensitive' } } },
    ] }),
  };
  const { rows, total } = await findPaged(prisma.subscription, {
    where,
    select: {
      id: true, number: true, status: true, startDate: true, expiryDate: true, nextInvoiceDate: true, quotationValidUntil: true, createdAt: true, requestedByCustomer: true,
      customer: { select: { id: true, name: true } }, plan: { select: { id: true, name: true, billingPeriod: true } },
    },
    paging,
  });
  paged(res, rows, total, paging);
});

/** Counts per status for list tabs: GET /subscriptions?counts=true is not needed — use reports/subscriptions-by-status */
export const get = asyncHandler(async (req, res) => {
  res.json({ data: await loadSubscription(req.params.id) });
});

export const preview = asyncHandler(async (req, res) => {
  res.json({ data: await previewSubscription(req.params.id) });
});

export const create = asyncHandler(async (req, res) => {
  const body = req.body;
  const id = await prisma.$transaction(async (tx) => {
    let { planId, lines, quotationValidUntil } = body;
    if (body.templateId) {
      const t = await tx.quotationTemplate.findUnique({ where: { id: body.templateId }, include: { lines: true } });
      if (!t || !t.isActive) throw badRequest('Quotation template not found');
      planId = planId || t.planId;
      if (!lines.length) lines = t.lines.map(({ productId, variantId, quantity }) => ({ productId, variantId, quantity }));
      quotationValidUntil = quotationValidUntil || addDays(startOfDay(), t.validityDays);
    }
    const plan = await checkPlan(tx, planId, body.startDate);
    await checkRefs(tx, body);
    const sub = await tx.subscription.create({
      data: {
        number: await nextNumber('SUB', tx),
        customerId: body.customerId,
        planId: plan.id,
        templateId: body.templateId || null,
        salespersonId: req.user.id,
        discountId: body.discountId || null,
        startDate: body.startDate,
        expiryDate: body.expiryDate || null,
        paymentTermDays: body.paymentTermDays,
        quotationValidUntil: quotationValidUntil || null,
        notes: body.notes || null,
        lines: { create: await buildLines(tx, lines, plan) },
        events: { create: [{ toStatus: 'DRAFT', userId: req.user.id, note: body.templateId ? 'Created from template' : null }] },
      },
    });
    return sub.id;
  });
  res.status(201).json({ data: await loadSubscription(id) });
});

export const update = asyncHandler(async (req, res) => {
  const sub = await prisma.subscription.findUnique({ where: { id: req.params.id }, include: { plan: true } });
  if (!sub) throw notFound('Subscription');
  const { lines, ...data } = req.body;
  const onlyDiscount = Object.keys(req.body).every((k) => k === 'discountId' || k === 'notes');
  if (!EDITABLE.includes(sub.status) && !(onlyDiscount && !['CLOSED', 'CANCELLED'].includes(sub.status))) {
    throw badRequest('Only draft or quotation subscriptions can be edited. Discount and notes can be changed until it is closed.');
  }
  await prisma.$transaction(async (tx) => {
    const plan = data.planId || data.startDate ? await checkPlan(tx, data.planId || sub.planId, data.startDate || sub.startDate) : sub.plan;
    await checkRefs(tx, data);
    const end = data.expiryDate === undefined ? sub.expiryDate : data.expiryDate;
    if (end && end <= (data.startDate || sub.startDate)) throw badRequest('Expiry must be after start date');
    await tx.subscription.update({ where: { id: sub.id }, data });
    if (lines) {
      await tx.subscriptionLine.deleteMany({ where: { subscriptionId: sub.id } });
      const built = await buildLines(tx, lines, plan);
      await tx.subscriptionLine.createMany({ data: built.map((l) => ({ ...l, subscriptionId: sub.id })) });
    }
  });
  res.json({ data: await loadSubscription(sub.id) });
});

/**
 * Applies a lifecycle action. Used by staff (runAction) and the customer portal.
 * @returns updated full record
 */
export async function performAction(id, action, { userId = null, note, newExpiryDate, via } = {}) {
  const sub = await prisma.subscription.findUnique({ where: { id }, include: { plan: true, lines: true, customer: true } });
  if (!sub) throw notFound('Subscription');
  const to = assertTransition(sub, action);
  const today = startOfDay();
  const data = { status: to };

  if (action === 'close' || action === 'cancel') {
    data.closedAt = new Date();
    data.closeReason = note || (action === 'cancel' ? 'Cancelled' : 'Closed');
  }
  if (action === 'resume' && sub.nextInvoiceDate && sub.nextInvoiceDate < today) data.nextInvoiceDate = today; // paused time is not billed
  if (action === 'renew') {
    if (!newExpiryDate) throw badRequest('Choose the new expiry date');
    const floor = sub.expiryDate && sub.expiryDate > today ? sub.expiryDate : today;
    if (newExpiryDate <= floor) throw badRequest('The new expiry date must be later than the current one');
    data.expiryDate = newExpiryDate;
    data.closedAt = null;
    data.closeReason = null;
    if (sub.status === 'CLOSED' && sub.nextInvoiceDate && sub.nextInvoiceDate < today) data.nextInvoiceDate = today;
  }
  if (action === 'activate' && sub.expiryDate && sub.expiryDate <= today) throw badRequest('The expiry date has passed — update it before activating');

  await prisma.$transaction([
    prisma.subscription.update({ where: { id }, data }),
    prisma.subscriptionEvent.create({ data: { subscriptionId: id, fromStatus: sub.status, toStatus: to, userId, note: [via, note].filter(Boolean).join(' — ') || null } }),
  ]);

  if (action === 'activate' || (action === 'renew' && sub.status === 'CLOSED')) await onSubscriptionActivated(id);
  if (action === 'send') {
    await sendMail({
      to: sub.customer.email,
      subject: `Your quotation ${sub.number} from Brightloop Software`,
      text: `Hello ${sub.customer.name}, your quotation ${sub.number} is ready. Review and accept it here: ${env.clientUrl}/portal/subscriptions/${id}`,
      html: `<p>Hello ${sub.customer.name},</p><p>Your quotation <b>${sub.number}</b> is ready.</p><p><a href="${env.clientUrl}/portal/subscriptions/${id}">Review and accept</a></p>`,
    });
  }
  return id;
}

export const runAction = asyncHandler(async (req, res) => {
  const id = await performAction(req.params.id, req.params.action, { userId: req.user.id, note: req.body.note, newExpiryDate: req.body.newExpiryDate });
  res.json({ data: await loadSubscription(id) });
});
