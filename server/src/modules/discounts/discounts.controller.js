// Placeholder handlers — return 501 until implemented.
/* eslint-disable no-unused-vars */
import { prisma } from '../../lib/prisma.js';
import { asyncHandler, notImplemented, badRequest, notFound, conflict } from '../../lib/errors.js';
import { getPaging, paged, findPaged } from '../../lib/pagination.js';

// GET /discounts?search=&scope=&valid=true
// include products {id,name}
// add computed field status: 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'EXHAUSTED' | 'INACTIVE' (use isDiscountValid from services/pricing.service.js)
export const list = asyncHandler(async (req, res) => {
  throw notImplemented();
});

// GET /discounts/:id
// include products
export const get = asyncHandler(async (req, res) => {
  throw notImplemented();
});

// POST /discounts
// body.productIds -> products: { connect: ids.map(id => ({ id })) }
// code unique -> 409
export const create = asyncHandler(async (req, res) => {
  throw notImplemented();
});

// PATCH /discounts/:id
// productIds -> products: { set: ids.map(id => ({ id })) }
// usageLimit cannot go below usedCount
export const update = asyncHandler(async (req, res) => {
  throw notImplemented();
});

// DELETE /discounts/:id
// isActive=false (stops applying on next invoice automatically)
export const archive = asyncHandler(async (req, res) => {
  throw notImplemented();
});
