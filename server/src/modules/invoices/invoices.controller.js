import { prisma } from '../../lib/prisma.js';
import { asyncHandler, badRequest, notFound } from '../../lib/errors.js';
import { getPaging, paged, findPaged } from '../../lib/pagination.js';
import { toNum } from '../../lib/money.js';
import { startOfDay } from '../../lib/dates.js';
import { sendMail, templates } from '../../lib/email.js';
import { env } from '../../config/env.js';
import { generateInvoiceForSubscription, overdueWhere, decorateInvoice } from '../../services/billing.service.js';

export const decorate = decorateInvoice;

const detailInclude = {
  customer: true,
  subscription: { select: { id: true, number: true, plan: { select: { name: true, billingPeriod: true } } } },
  lines: { orderBy: { id: 'asc' } },
  payments: { include: { recordedBy: { select: { name: true } } }, orderBy: { paymentDate: 'desc' } },
};

export async function loadInvoice(id, extraWhere = {}) {
  const inv = await prisma.invoice.findFirst({ where: { id, ...extraWhere }, include: detailInclude });
  if (!inv) throw notFound('Invoice');
  return decorate(inv);
}

export function invoiceFilters(q, search) {
  return {
    ...(q.overdue === 'true' ? overdueWhere() : q.status && { status: q.status }),
    ...(q.customerId && { customerId: q.customerId }),
    ...(q.subscriptionId && { subscriptionId: q.subscriptionId }),
    ...((q.from || q.to) && { invoiceDate: { ...(q.from && { gte: startOfDay(q.from) }), ...(q.to && { lte: q.to }) } }),
    ...(search && { OR: [{ number: { contains: search, mode: 'insensitive' } }, { customer: { name: { contains: search, mode: 'insensitive' } } }] }),
  };
}

export const list = asyncHandler(async (req, res) => {
  const paging = getPaging(req.query, { defaultSort: 'invoiceDate' });
  const { rows, total } = await findPaged(prisma.invoice, {
    where: invoiceFilters(req.query, paging.search),
    select: {
      id: true, number: true, status: true, invoiceDate: true, dueDate: true, total: true, amountPaid: true, sentAt: true,
      customer: { select: { id: true, name: true } }, subscription: { select: { id: true, number: true } },
    },
    paging,
  });
  paged(res, rows.map(decorate), total, paging);
});

export const get = asyncHandler(async (req, res) => res.json({ data: await loadInvoice(req.params.id) }));

export const generate = asyncHandler(async (req, res) => {
  const r = await generateInvoiceForSubscription(req.body.subscriptionId);
  if (!r.created) return res.json({ data: r.invoice, meta: { duplicate: true } });
  res.status(201).json({ data: r.invoice });
});

export const bulkConfirm = asyncHandler(async (req, res) => {
  const r = await prisma.invoice.updateMany({ where: { id: { in: req.body.ids }, status: 'DRAFT', total: { gt: 0 } }, data: { status: 'CONFIRMED' } });
  res.json({ data: { confirmed: r.count } });
});

export const confirm = asyncHandler(async (req, res) => {
  const inv = await prisma.invoice.findUnique({ where: { id: req.params.id } });
  if (!inv) throw notFound('Invoice');
  if (inv.status !== 'DRAFT') throw badRequest('Only draft invoices can be confirmed');
  if (toNum(inv.total) <= 0) throw badRequest('An invoice with a zero total cannot be confirmed');
  await prisma.invoice.update({ where: { id: inv.id }, data: { status: 'CONFIRMED' } });
  res.json({ data: await loadInvoice(inv.id) });
});

export const cancel = asyncHandler(async (req, res) => {
  const inv = await prisma.invoice.findUnique({ where: { id: req.params.id } });
  if (!inv) throw notFound('Invoice');
  if (inv.status === 'PAID') throw badRequest('Paid invoices cannot be cancelled');
  if (inv.status === 'CANCELLED') throw badRequest('This invoice is already cancelled');
  if (toNum(inv.amountPaid) > 0) throw badRequest('This invoice has payments recorded against it and cannot be cancelled');
  await prisma.invoice.update({ where: { id: inv.id }, data: { status: 'CANCELLED', notes: [inv.notes, req.body.reason && `Cancelled: ${req.body.reason}`].filter(Boolean).join('\n') || null } });
  res.json({ data: await loadInvoice(inv.id) });
});

export const send = asyncHandler(async (req, res) => {
  const inv = await prisma.invoice.findUnique({ where: { id: req.params.id }, include: { customer: true } });
  if (!inv) throw notFound('Invoice');
  if (inv.status === 'CANCELLED') throw badRequest('Cancelled invoices cannot be sent');
  if (inv.status === 'DRAFT' && toNum(inv.total) <= 0) throw badRequest('An invoice with a zero total cannot be sent');
  await prisma.invoice.update({ where: { id: inv.id }, data: { status: inv.status === 'DRAFT' ? 'CONFIRMED' : inv.status, sentAt: new Date() } });
  const mail = await sendMail({ to: inv.customer.email, ...templates.invoice(inv, `${env.clientUrl}/portal/invoices/${inv.id}`) });
  res.json({ data: await loadInvoice(inv.id), meta: { email: mail } });
});
