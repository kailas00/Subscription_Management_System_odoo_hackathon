// Placeholder handlers — return 501 until implemented.
/* eslint-disable no-unused-vars */
import { prisma } from '../../lib/prisma.js';
import { asyncHandler, notImplemented, badRequest, notFound, conflict } from '../../lib/errors.js';
import { getPaging, paged, findPaged } from '../../lib/pagination.js';

// GET /reports/summary?from=&to= (default: current month)
// return { activeSubscriptions, mrr, revenue (sum payments.amount in range), invoiced (sum invoice.total non-cancelled in range), outstanding (sum total-amountPaid of CONFIRMED), overdueCount, overdueAmount, newSubscriptions (created in range), churned (closed in range) }
// MRR: raw SQL sum(qty*unitPrice per line + plan.price) * MRR_FACTOR[billingPeriod] / intervalCount for ACTIVE subs (lib/dates.js)
// use prisma.aggregate / groupBy / $queryRaw — never load all rows
export const summary = asyncHandler(async (req, res) => {
  throw notImplemented();
});

// GET /reports/revenue-trend?months=12
// [{ month: '2026-01', invoiced, collected }]
// $queryRaw with date_trunc('month', ...) on Invoice.invoiceDate and Payment.paymentDate
// fill missing months with 0
export const revenueTrend = asyncHandler(async (req, res) => {
  throw notImplemented();
});

// GET /reports/subscriptions-by-status
// prisma.subscription.groupBy({ by: ['status'], _count: true }) -> [{ status, count }]
export const subscriptionsByStatus = asyncHandler(async (req, res) => {
  throw notImplemented();
});

// GET /reports/plan-breakdown
// per plan: { planId, name, billingPeriod, activeCount, mrr }
export const planBreakdown = asyncHandler(async (req, res) => {
  throw notImplemented();
});

// GET /reports/overdue?page=
// paged invoices with overdueWhere() incl. customer{name,email}, daysOverdue
// order dueDate asc
export const overdue = asyncHandler(async (req, res) => {
  throw notImplemented();
});
