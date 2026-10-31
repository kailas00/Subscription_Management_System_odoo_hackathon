// Placeholder handlers — return 501 until implemented.
/* eslint-disable no-unused-vars */
import { prisma } from '../../lib/prisma.js';
import { asyncHandler, notImplemented, badRequest, notFound, conflict } from '../../lib/errors.js';
import { getPaging, paged, findPaged } from '../../lib/pagination.js';

// GET /templates?search=
// include plan {id,name,billingPeriod}, _count lines
export const list = asyncHandler(async (req, res) => {
  throw notImplemented();
});

// GET /templates/:id
// include plan, lines { product {id,name,salesPrice,taxId}, variant }
export const get = asyncHandler(async (req, res) => {
  throw notImplemented();
});

// POST /templates
// nested create lines
// validate variant belongs to product
export const create = asyncHandler(async (req, res) => {
  throw notImplemented();
});

// PUT /templates/:id
// transaction: deleteMany lines + update + create lines
export const update = asyncHandler(async (req, res) => {
  throw notImplemented();
});

// DELETE /templates/:id
// isActive=false
export const archive = asyncHandler(async (req, res) => {
  throw notImplemented();
});
