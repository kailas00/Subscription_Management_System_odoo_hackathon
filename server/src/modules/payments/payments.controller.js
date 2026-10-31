// Placeholder handlers — return 501 until implemented.
/* eslint-disable no-unused-vars */
import { prisma } from '../../lib/prisma.js';
import { asyncHandler, notImplemented, badRequest, notFound, conflict } from '../../lib/errors.js';
import { getPaging, paged, findPaged } from '../../lib/pagination.js';

// GET /payments?method=&invoiceId=&from=&to=&search=
// include invoice{id,number,customer{name}}, recordedBy{name}
// order paymentDate desc
export const list = asyncHandler(async (req, res) => {
  throw notImplemented();
});

// POST /payments
// transaction: load invoice
// status must be CONFIRMED (DRAFT -> 400 'Confirm the invoice before recording payment'; PAID/CANCELLED -> 400)
// amount <= outstanding (total - amountPaid) else 400 'Amount exceeds the outstanding balance of X'
// number = nextNumber('PAY', tx)
// create payment with recordedById = req.user.id
// await syncInvoicePayments(tx, invoiceId) (billing.service.js)
// return 201 { data: { payment, invoice } }
export const create = asyncHandler(async (req, res) => {
  throw notImplemented();
});
