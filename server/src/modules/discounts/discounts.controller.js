import { prisma } from '../../lib/prisma.js';
import { asyncHandler, badRequest, conflict, notFound } from '../../lib/errors.js';
import { getPaging, paged, findPaged } from '../../lib/pagination.js';
import { isDiscountValid } from '../../services/pricing.service.js';

const include = { products: { select: { id: true, name: true } } };

export function discountStatus(d, now = new Date()) {
  if (!d.isActive) return 'INACTIVE';
  if (d.usageLimit !== null && d.usedCount >= d.usageLimit) return 'EXHAUSTED';
  if (d.endDate && new Date(d.endDate) < now) return 'EXPIRED';
  if (d.startDate && new Date(d.startDate) > now) return 'SCHEDULED';
  return 'ACTIVE';
}
const withStatus = (d) => ({ ...d, status: discountStatus(d) });

export const list = asyncHandler(async (req, res) => {
  const paging = getPaging(req.query);
  const where = {
    ...(req.query.scope && { scope: req.query.scope }),
    ...(paging.search && { OR: [{ name: { contains: paging.search, mode: 'insensitive' } }, { code: { contains: paging.search, mode: 'insensitive' } }] }),
  };
  if (req.query.valid === 'true') {
    // small table: filter validity in JS so usageLimit/usedCount comparison stays simple
    const all = await prisma.discount.findMany({ where: { ...where, isActive: true }, include, orderBy: { name: 'asc' } });
    const rows = all.filter((d) => isDiscountValid(d)).map(withStatus);
    return paged(res, rows, rows.length, { page: 1, pageSize: Math.max(rows.length, 1) });
  }
  const { rows, total } = await findPaged(prisma.discount, { where, include, paging });
  paged(res, rows.map(withStatus), total, paging);
});

export const get = asyncHandler(async (req, res) => {
  const d = await prisma.discount.findUnique({ where: { id: req.params.id }, include });
  if (!d) throw notFound('Discount');
  res.json({ data: withStatus(d) });
});

export const create = asyncHandler(async (req, res) => {
  const { productIds, ...data } = req.body;
  if (data.code && (await prisma.discount.findUnique({ where: { code: data.code } }))) throw conflict('This discount code is already used');
  const d = await prisma.discount.create({
    data: { ...data, products: { connect: (data.scope === 'PRODUCT' ? productIds : []).map((id) => ({ id })) } },
    include,
  });
  res.status(201).json({ data: withStatus(d) });
});

export const update = asyncHandler(async (req, res) => {
  const existing = await prisma.discount.findUnique({ where: { id: req.params.id } });
  if (!existing) throw notFound('Discount');
  const { productIds, ...data } = req.body;
  if (data.usageLimit !== undefined && data.usageLimit !== null && data.usageLimit < existing.usedCount) {
    throw badRequest(`Usage limit cannot be lower than the ${existing.usedCount} times it has already been used`);
  }
  const type = data.type ?? existing.type;
  const value = data.value ?? Number(existing.value);
  if (type === 'PERCENT' && value > 100) throw badRequest('Percentage discount cannot exceed 100');
  const scope = data.scope ?? existing.scope;
  const d = await prisma.discount.update({
    where: { id: existing.id },
    data: { ...data, ...(productIds && { products: { set: (scope === 'PRODUCT' ? productIds : []).map((id) => ({ id })) } }) },
    include,
  });
  res.json({ data: withStatus(d) });
});

export const archive = asyncHandler(async (req, res) => {
  if (!(await prisma.discount.findUnique({ where: { id: req.params.id } }))) throw notFound('Discount');
  const d = await prisma.discount.update({ where: { id: req.params.id }, data: { isActive: false }, include });
  res.json({ data: withStatus(d) });
});
