// Placeholder handlers — return 501 until implemented.
/* eslint-disable no-unused-vars */
import { prisma } from '../../lib/prisma.js';
import { asyncHandler, notImplemented, badRequest, notFound, conflict } from '../../lib/errors.js';
import { getPaging, paged, findPaged } from '../../lib/pagination.js';

// GET /subscriptions?status=&customerId=&planId=&search=
// status may be comma list 'ACTIVE,PAUSED'
// search on number OR customer.name
// select ONLY list fields: id, number, status, startDate, expiryDate, nextInvoiceDate, customer{id,name}, plan{id,name,billingPeriod}
// (keep it light: thousands of rows, must respond < 2s)
export const list = asyncHandler(async (req, res) => {
  throw notImplemented();
});

// GET /subscriptions/:id
// include customer, plan, discount, template{id,name}, salesperson{id,name}, lines{product,variant,tax}, events{user{name}} desc, invoices (id,number,status,total,amountPaid,dueDate) desc
// ADD: actions = availableActions(sub) from services/subscriptionFlow.js
// ADD: totals = computeInvoice(...) — reuse previewSubscription() from services/billing.service.js
export const get = asyncHandler(async (req, res) => {
  throw notImplemented();
});

// GET /subscriptions/:id/preview
// res.json({ data: await previewSubscription(id) })
export const preview = asyncHandler(async (req, res) => {
  throw notImplemented();
});

// POST /subscriptions
// 1) if templateId: load template -> planId = template.planId, lines = template lines (unless body.lines given), quotationValidUntil = today + validityDays
// 2) for each line: unitPrice ??= unitPriceFor(product, variant) (pricing.service.js), taxId ??= product.taxId; validate variant.productId === productId
// 3) plan must be isActive and available on startDate (plan.startDate/endDate)
// 4) each line quantity >= plan.minQuantity else 400
// 5) number = await nextNumber('SUB', tx) (lib/sequence.js)
// 6) salespersonId = req.user.id
// 7) create event { toStatus: 'DRAFT', userId }
// all in prisma.$transaction
// return 201 with same shape as get
export const create = asyncHandler(async (req, res) => {
  throw notImplemented();
});

// PATCH /subscriptions/:id
// only when status in EDITABLE (subscriptionFlow.js) else 400 'Only draft or quotation subscriptions can be edited'
// if lines provided: deleteMany + recreate (same defaults as create)
// discountId may be changed in any status except CLOSED/CANCELLED
export const update = asyncHandler(async (req, res) => {
  throw notImplemented();
});

// POST /subscriptions/:id/actions/:action
// load with plan + lines
// const to = assertTransition(sub, action)
// transaction: update status (+ closedAt/closeReason for close/cancel; renew: expiryDate = body.newExpiryDate (required, must be > current expiry) and status ACTIVE) + create SubscriptionEvent { fromStatus, toStatus: to, note, userId }
// AFTER commit: if action === 'activate' -> await onSubscriptionActivated(id) (billing.service.js) creates first invoice
// if action === 'send' -> optional email to customer
// return updated subscription (same shape as get)
export const runAction = asyncHandler(async (req, res) => {
  throw notImplemented();
});
