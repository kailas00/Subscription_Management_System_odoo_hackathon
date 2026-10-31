// Placeholder handlers — return 501 until implemented.
/* eslint-disable no-unused-vars */
import { prisma } from '../../lib/prisma.js';
import { asyncHandler, notImplemented, badRequest, notFound, conflict } from '../../lib/errors.js';
import { getPaging, paged, findPaged } from '../../lib/pagination.js';

// GET /invoices?status=&overdue=true&customerId=&subscriptionId=&from=&to=&search=
// overdue=true -> where = { ...overdueWhere() } (billing.service.js)
// from/to filter invoiceDate
// search number or customer.name
// select list fields + customer{id,name} + subscription{id,number}
// add computed isOverdue + outstanding (total - amountPaid)
export const list = asyncHandler(async (req, res) => {
  throw notImplemented();
});

// GET /invoices/:id
// include customer, subscription{id,number,plan{name}}, lines, payments{recordedBy{name}} desc
// add outstanding + isOverdue
export const get = asyncHandler(async (req, res) => {
  throw notImplemented();
});

// POST /invoices/generate { subscriptionId }
// const r = await generateInvoiceForSubscription(id)
// 201 if r.created else 200 with { data: r.invoice, meta: { duplicate: true } }
export const generate = asyncHandler(async (req, res) => {
  throw notImplemented();
});

// POST /invoices/bulk-confirm { ids }
// updateMany where id in ids AND status DRAFT -> CONFIRMED
// return { data: { confirmed: count } }
export const bulkConfirm = asyncHandler(async (req, res) => {
  throw notImplemented();
});

// POST /invoices/:id/confirm
// only DRAFT -> CONFIRMED else 400
// total must be > 0
export const confirm = asyncHandler(async (req, res) => {
  throw notImplemented();
});

// POST /invoices/:id/cancel
// allowed for DRAFT or CONFIRMED with amountPaid = 0
// PAID -> 400 'Paid invoices cannot be cancelled'
// note: cancelling does not free the period; generate a credit/new invoice manually (out of scope)
export const cancel = asyncHandler(async (req, res) => {
  throw notImplemented();
});

// POST /invoices/:id/send
// DRAFT -> auto-confirm first
// sendMail({ to: customer.email, ...templates.invoice(inv, CLIENT_URL + '/portal/invoices/' + id) }) (lib/email.js)
// set sentAt
// return invoice
export const send = asyncHandler(async (req, res) => {
  throw notImplemented();
});
