import { prisma } from '../../lib/prisma.js';
import { asyncHandler, badRequest, notFound } from '../../lib/errors.js';
import { getPaging, paged, findPaged } from '../../lib/pagination.js';

const include = {
  plan: { select: { id: true, name: true, billingPeriod: true, intervalCount: true, price: true, minQuantity: true } },
  lines: { include: { product: { select: { id: true, name: true, salesPrice: true, taxId: true } }, variant: true }, orderBy: { id: 'asc' } },
};

async function validate({ planId, lines }) {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan || !plan.isActive) throw badRequest('Choose an active plan');
  for (const l of lines) {
    const product = await prisma.product.findUnique({ where: { id: l.productId } });
    if (!product || !product.isActive) throw badRequest('One of the products is missing or archived');
    if (l.variantId) {
      const v = await prisma.productVariant.findUnique({ where: { id: l.variantId } });
      if (!v || v.productId !== l.productId) throw badRequest(`The selected variant does not belong to ${product.name}`);
    }
    if (l.quantity < plan.minQuantity) throw badRequest(`${product.name}: quantity must be at least ${plan.minQuantity} for the ${plan.name} plan`);
  }
}
const lineData = (lines) => lines.map(({ productId, variantId, quantity }) => ({ productId, variantId: variantId || null, quantity }));

export const list = asyncHandler(async (req, res) => {
  const paging = getPaging(req.query);
  const where = { isActive: true, ...(paging.search && { name: { contains: paging.search, mode: 'insensitive' } }) };
  const { rows, total } = await findPaged(prisma.quotationTemplate, { where, include: { plan: include.plan, _count: { select: { lines: true } } }, paging });
  paged(res, rows, total, paging);
});

export const get = asyncHandler(async (req, res) => {
  const t = await prisma.quotationTemplate.findUnique({ where: { id: req.params.id }, include });
  if (!t) throw notFound('Template');
  res.json({ data: t });
});

export const create = asyncHandler(async (req, res) => {
  await validate(req.body);
  const { lines, ...data } = req.body;
  const t = await prisma.quotationTemplate.create({ data: { ...data, lines: { create: lineData(lines) } }, include });
  res.status(201).json({ data: t });
});

export const update = asyncHandler(async (req, res) => {
  if (!(await prisma.quotationTemplate.findUnique({ where: { id: req.params.id } }))) throw notFound('Template');
  await validate(req.body);
  const { lines, ...data } = req.body;
  const t = await prisma.$transaction(async (tx) => {
    await tx.templateLine.deleteMany({ where: { templateId: req.params.id } });
    return tx.quotationTemplate.update({ where: { id: req.params.id }, data: { ...data, lines: { create: lineData(lines) } }, include });
  });
  res.json({ data: t });
});

export const archive = asyncHandler(async (req, res) => {
  if (!(await prisma.quotationTemplate.findUnique({ where: { id: req.params.id } }))) throw notFound('Template');
  res.json({ data: await prisma.quotationTemplate.update({ where: { id: req.params.id }, data: { isActive: false } }) });
});
