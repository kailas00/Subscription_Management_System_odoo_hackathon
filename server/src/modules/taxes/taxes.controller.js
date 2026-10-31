// Placeholder handlers — return 501 until implemented.
/* eslint-disable no-unused-vars */
import { prisma } from '../../lib/prisma.js';
import { asyncHandler, notImplemented, badRequest, notFound, conflict } from '../../lib/errors.js';
import { getPaging, paged, findPaged } from '../../lib/pagination.js';

// GET /taxes?search=
// order by name
// return all (small table) but keep paged shape
export const list = asyncHandler(async (req, res) => {
  throw notImplemented();
});

// POST /taxes
export const create = asyncHandler(async (req, res) => {
  throw notImplemented();
});

// PATCH /taxes/:id
// changing rate affects FUTURE invoices only (invoice lines store taxAmount snapshot)
export const update = asyncHandler(async (req, res) => {
  throw notImplemented();
});

// DELETE /taxes/:id
// isActive=false
export const archive = asyncHandler(async (req, res) => {
  throw notImplemented();
});
