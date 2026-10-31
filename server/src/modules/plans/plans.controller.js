// Placeholder handlers — return 501 until implemented.
/* eslint-disable no-unused-vars */
import { prisma } from '../../lib/prisma.js';
import { asyncHandler, notImplemented, badRequest, notFound, conflict } from '../../lib/errors.js';
import { getPaging, paged, findPaged } from '../../lib/pagination.js';

// GET /plans?search=&active=
// include _count: { subscriptions: { where: { status: 'ACTIVE' } } }
export const list = asyncHandler(async (req, res) => {
  throw notImplemented();
});

// GET /plans/:id
export const get = asyncHandler(async (req, res) => {
  throw notImplemented();
});

// POST /plans
export const create = asyncHandler(async (req, res) => {
  throw notImplemented();
});

// PATCH /plans/:id
// billingPeriod change: if plan has ACTIVE subscriptions -> 409 'Plan has active subscriptions; create a new plan instead'
export const update = asyncHandler(async (req, res) => {
  throw notImplemented();
});

// DELETE /plans/:id
// isActive=false
// existing subscriptions continue; plan hidden from new subscriptions
export const archive = asyncHandler(async (req, res) => {
  throw notImplemented();
});
