// Placeholder handlers — return 501 until implemented.
/* eslint-disable no-unused-vars */
import { prisma } from '../../lib/prisma.js';
import { asyncHandler, notImplemented, badRequest, notFound, conflict } from '../../lib/errors.js';
import { getPaging, paged, findPaged } from '../../lib/pagination.js';

// GET /portal/summary
// for req.user.customerId: { activeSubscriptions, pendingQuotations, outstanding, nextInvoiceDate, overdueCount }
export const summary = asyncHandler(async (req, res) => {
  throw notImplemented();
});

// GET /portal/subscriptions
// where customerId = req.user.customerId AND status != DRAFT (drafts are internal)
export const listSubscriptions = asyncHandler(async (req, res) => {
  throw notImplemented();
});

// GET /portal/subscriptions/:id
// MUST check sub.customerId === req.user.customerId else 404 (not 403 — don't leak existence)
// include plan, lines{product,variant,tax}, invoices
// actions = availableActions(sub) filtered to ['confirm','pause','resume','close'] (confirm only when status QUOTATION)
export const getSubscription = asyncHandler(async (req, res) => {
  throw notImplemented();
});

// POST /portal/subscriptions/:id/actions/:action
// ownership check
// 'confirm' only from QUOTATION (customer accepts quote)
// reuse assertTransition()
// create event with note 'By customer via portal'
export const runAction = asyncHandler(async (req, res) => {
  throw notImplemented();
});

// GET /portal/invoices
// customer's invoices, status != DRAFT and != CANCELLED
export const listInvoices = asyncHandler(async (req, res) => {
  throw notImplemented();
});

// GET /portal/invoices/:id
// ownership check
// include lines, payments, subscription{number}
export const getInvoice = asyncHandler(async (req, res) => {
  throw notImplemented();
});

// POST /portal/invoices/:id/pay { method }
// demo payment: ownership check, invoice CONFIRMED, amount = outstanding
// create Payment (note 'Paid via customer portal') + syncInvoicePayments in one transaction (same rules as payments.controller create — extract a shared helper if you like)
export const pay = asyncHandler(async (req, res) => {
  throw notImplemented();
});
