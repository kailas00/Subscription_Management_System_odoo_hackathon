import { prisma } from '../../lib/prisma.js';
import { asyncHandler, badRequest, conflict, notFound } from '../../lib/errors.js';
import { getPaging, paged, findPaged } from '../../lib/pagination.js';

const include = { tax: { select: { id: true, name: true, rate: true, type: true } }, variants: { orderBy: [{ attribute: 'asc' }, { value: 'asc' }] } };

async function ensureTax(taxId) {
  if (taxId && !(await prisma.tax.findUnique({ where: { id: taxId } }))) throw badRequest('Selected tax does not exist');
}
async function findProduct(id) {
  const p = await prisma.product.findUnique({ where: { id } });
  if (!p) throw notFound('Product');
  return p;
}
async function findVariant(productId, variantId) {
  const v = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!v || v.productId !== productId) throw notFound('Variant');
  return v;
}

export const list = asyncHandler(async (req, res) => {
  const paging = getPaging(req.query);
  if (!req.query.sort) paging.orderBy = { name: 'asc' };
  const where = {
    isActive: req.query.active === 'false' ? false : true,
    ...(req.query.type && { type: req.query.type }),
    ...(paging.search && { name: { contains: paging.search, mode: 'insensitive' } }),
  };
  const { rows, total } = await findPaged(prisma.product, { where, include: { ...include, _count: { select: { subscriptionLines: true } } }, paging });
  paged(res, rows, total, paging);
});

export const get = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id }, include });
  if (!product) throw notFound('Product');
  res.json({ data: product });
});

export const create = asyncHandler(async (req, res) => {
  await ensureTax(req.body.taxId);
  res.status(201).json({ data: await prisma.product.create({ data: req.body, include }) });
});

export const update = asyncHandler(async (req, res) => {
  await findProduct(req.params.id);
  await ensureTax(req.body.taxId);
  res.json({ data: await prisma.product.update({ where: { id: req.params.id }, data: req.body, include }) });
});

export const archive = asyncHandler(async (req, res) => {
  await findProduct(req.params.id);
  res.json({ data: await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } }) });
});

export const addVariant = asyncHandler(async (req, res) => {
  await findProduct(req.params.id);
  const dup = await prisma.productVariant.findFirst({ where: { productId: req.params.id, attribute: req.body.attribute, value: req.body.value } });
  if (dup) throw conflict('This variant already exists');
  res.status(201).json({ data: await prisma.productVariant.create({ data: { ...req.body, productId: req.params.id } }) });
});

export const updateVariant = asyncHandler(async (req, res) => {
  await findVariant(req.params.id, req.params.variantId);
  res.json({ data: await prisma.productVariant.update({ where: { id: req.params.variantId }, data: req.body }) });
});

export const removeVariant = asyncHandler(async (req, res) => {
  await findVariant(req.params.id, req.params.variantId);
  const used = await prisma.subscriptionLine.count({ where: { variantId: req.params.variantId } })
    + await prisma.templateLine.count({ where: { variantId: req.params.variantId } });
  if (used) throw conflict('This variant is used by subscriptions or templates and cannot be removed');
  await prisma.productVariant.delete({ where: { id: req.params.variantId } });
  res.json({ data: { id: req.params.variantId } });
});
