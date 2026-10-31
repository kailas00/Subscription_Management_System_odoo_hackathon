// Placeholder handlers — return 501 until implemented.
/* eslint-disable no-unused-vars */
import { prisma } from '../../lib/prisma.js';
import { asyncHandler, notImplemented, badRequest, notFound, conflict } from '../../lib/errors.js';
import { getPaging, paged, findPaged } from '../../lib/pagination.js';

// GET /products?search=&type=&active=
// default active=true
// include tax {id,name,rate,type}, variants
// _count subscriptionLines
export const list = asyncHandler(async (req, res) => {
  throw notImplemented();
});

// GET /products/:id
// include tax, variants (ordered attribute, value)
export const get = asyncHandler(async (req, res) => {
  throw notImplemented();
});

// POST /products
// validate taxId exists if given
// return with tax + variants
export const create = asyncHandler(async (req, res) => {
  throw notImplemented();
});

// PATCH /products/:id
// price changes DO NOT alter existing subscription lines (they keep their snapshot unitPrice)
export const update = asyncHandler(async (req, res) => {
  throw notImplemented();
});

// DELETE /products/:id
// soft delete: isActive=false (never hard delete — invoices reference products)
export const archive = asyncHandler(async (req, res) => {
  throw notImplemented();
});

// POST /products/:id/variants
// unique (productId, attribute, value) -> 409 'This variant already exists'
// example: Brand / Odoo / extraPrice 560
export const addVariant = asyncHandler(async (req, res) => {
  throw notImplemented();
});

// PATCH /products/:id/variants/:variantId
// ensure variant.productId === :id else 404
export const updateVariant = asyncHandler(async (req, res) => {
  throw notImplemented();
});

// DELETE /products/:id/variants/:variantId
// if used by subscription lines -> 409 'Variant is used by subscriptions'
export const removeVariant = asyncHandler(async (req, res) => {
  throw notImplemented();
});
