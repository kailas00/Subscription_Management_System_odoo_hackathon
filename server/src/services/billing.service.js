// ─────────────────────────────────────────────────────────────────────────────
// Billing engine — turns ACTIVE subscriptions into invoices.
// Guarantees:
//   • Never bills twice: DB unique (subscriptionId, periodStart) + idempotent catch.
//   • Never skips: loops period-by-period until nextInvoiceDate > asOf (catch-up).
//   • Atomic: invoice + lines + discount usage + nextInvoiceDate in ONE transaction.
// ─────────────────────────────────────────────────────────────────────────────
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { nextNumber } from '../lib/sequence.js';
import { addDays, addPeriod, startOfDay } from '../lib/dates.js';
import { toNum, round2, formatMoney } from '../lib/money.js';
import { computeInvoice } from './pricing.service.js';
import { notFound, badRequest } from '../lib/errors.js';

const BATCH = 200;

export const pricingInclude = {
  plan: true,
  discount: true,
  customer: true,
  lines: { include: { product: true, variant: true, tax: true } },
};

export async function activeProductDiscounts(tx = prisma) {
  return tx.discount.findMany({ where: { isActive: true, scope: 'PRODUCT' }, include: { products: { select: { id: true } } } });
}

/** Preview totals for a subscription (used by quotation screens). */
export async function previewSubscription(subscriptionId) {
  const sub = await prisma.subscription.findUnique({ where: { id: subscriptionId }, include: pricingInclude });
  if (!sub) throw notFound('Subscription');
  return computeInvoice({ plan: sub.plan, lines: sub.lines, subscriptionDiscount: sub.discount, productDiscounts: await activeProductDiscounts() });
}

/**
 * Create the invoice for the subscription's current period (nextInvoiceDate).
 * @returns {{ invoice, created: boolean }}
 */
export async function generateInvoiceForSubscription(subscriptionId, { asOf = new Date() } = {}) {
  try {
    return await prisma.$transaction(async (tx) => {
      const sub = await tx.subscription.findUnique({ where: { id: subscriptionId }, include: pricingInclude });
      if (!sub) throw notFound('Subscription');
      if (sub.status !== 'ACTIVE') throw badRequest('Only active subscriptions can be invoiced');
      if (!sub.nextInvoiceDate) throw badRequest('Subscription has no next invoice date');

      const periodStart = startOfDay(sub.nextInvoiceDate);
      if (sub.expiryDate && periodStart >= startOfDay(sub.expiryDate)) throw badRequest('Subscription has expired — renew it first');
      const periodEnd = addDays(addPeriod(periodStart, sub.plan.billingPeriod, sub.plan.intervalCount), -1);

      const pricing = computeInvoice({
        plan: sub.plan, lines: sub.lines, subscriptionDiscount: sub.discount,
        productDiscounts: await activeProductDiscounts(tx), asOf,
      });

      const invoiceDate = periodStart; // invoice is dated on its billing date, also when catching up
      const invoice = await tx.invoice.create({
        data: {
          number: await nextNumber('INV', tx),
          subscriptionId: sub.id,
          customerId: sub.customerId,
          status: 'DRAFT',
          invoiceDate,
          dueDate: addDays(invoiceDate, sub.paymentTermDays),
          periodStart,
          periodEnd,
          subtotal: pricing.subtotal,
          discountTotal: pricing.discountTotal,
          taxTotal: pricing.taxTotal,
          total: pricing.total,
          lines: { create: pricing.lines },
        },
        include: { lines: true },
      });

      if (pricing.appliedDiscountIds.length) {
        await tx.discount.updateMany({ where: { id: { in: pricing.appliedDiscountIds } }, data: { usedCount: { increment: 1 } } });
      }
      await tx.subscription.update({
        where: { id: sub.id },
        data: { nextInvoiceDate: addPeriod(periodStart, sub.plan.billingPeriod, sub.plan.intervalCount) },
      });
      return { invoice, created: true };
    });
  } catch (err) {
    // Same period already invoiced (concurrent run / double click) → idempotent, not an error.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const sub = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
      const invoice = await prisma.invoice.findFirst({ where: { subscriptionId, periodStart: startOfDay(sub.nextInvoiceDate) } });
      return { invoice, created: false };
    }
    throw err;
  }
}

/** Called right after a subscription becomes ACTIVE: schedules and bills the first period. */
export async function onSubscriptionActivated(subscriptionId) {
  const current = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
  if (!current) throw notFound('Subscription');
  // Only set the schedule the first time (a resumed/renewed subscription keeps its schedule).
  const sub = current.nextInvoiceDate
    ? current
    : await prisma.subscription.update({ where: { id: subscriptionId }, data: { nextInvoiceDate: startOfDay(current.startDate) } });
  if (startOfDay(sub.nextInvoiceDate) <= startOfDay(new Date())) return generateInvoiceForSubscription(subscriptionId);
  return { invoice: null, created: false }; // future start → the daily billing run will pick it up
}

/**
 * Billing run — call from cron or POST /api/billing/run.
 * 1) auto-close expired subscriptions whose plan has autoClose
 * 2) generate every due invoice (catch-up safe), in batches
 */
export async function runBillingCycle({ asOf = new Date() } = {}) {
  const today = startOfDay(asOf);
  const summary = { asOf: today, invoicesCreated: 0, skippedDuplicates: 0, autoClosed: 0, errors: [] };

  // 1) Auto-close
  const expiring = await prisma.subscription.findMany({
    where: { status: { in: ['ACTIVE', 'PAUSED'] }, expiryDate: { lt: today }, plan: { autoClose: true } },
    select: { id: true, status: true },
  });
  for (const s of expiring) {
    await prisma.$transaction([
      prisma.subscription.update({ where: { id: s.id }, data: { status: 'CLOSED', closedAt: new Date(), closeReason: 'Expired (auto-close)' } }),
      prisma.subscriptionEvent.create({ data: { subscriptionId: s.id, fromStatus: s.status, toStatus: 'CLOSED', note: 'Auto-closed at expiry' } }),
    ]);
    summary.autoClosed++;
  }

  // 2) Due invoices — process in batches, loop each subscription until caught up
  let cursor = 0;
  for (;;) {
    const due = await prisma.subscription.findMany({
      where: { id: { gt: cursor }, status: 'ACTIVE', nextInvoiceDate: { lte: today } },
      select: { id: true }, orderBy: { id: 'asc' }, take: BATCH,
    });
    if (!due.length) break;
    for (const { id } of due) {
      cursor = id;
      for (let guard = 0; guard < 400; guard++) {
        const s = await prisma.subscription.findUnique({ where: { id }, select: { nextInvoiceDate: true, expiryDate: true, status: true } });
        if (s.status !== 'ACTIVE' || !s.nextInvoiceDate || startOfDay(s.nextInvoiceDate) > today) break;
        if (s.expiryDate && startOfDay(s.nextInvoiceDate) >= startOfDay(s.expiryDate)) break;
        try {
          const r = await generateInvoiceForSubscription(id, { asOf });
          if (r.created) summary.invoicesCreated++; else { summary.skippedDuplicates++; break; }
        } catch (e) {
          summary.errors.push({ subscriptionId: id, message: e.message });
          break;
        }
      }
    }
  }
  return summary;
}

/** Recompute amountPaid & status from payments. Call inside the payment transaction. */
export async function syncInvoicePayments(tx, invoiceId) {
  const inv = await tx.invoice.findUnique({ where: { id: invoiceId }, include: { payments: true } });
  const paid = round2(inv.payments.reduce((a, p) => a + toNum(p.amount), 0));
  const status = paid >= toNum(inv.total) && toNum(inv.total) > 0 ? 'PAID' : inv.status === 'PAID' ? 'CONFIRMED' : inv.status;
  return tx.invoice.update({ where: { id: invoiceId }, data: { amountPaid: paid, status } });
}

/** Overdue = confirmed, past due date, not fully paid. Use this filter everywhere. */
export const overdueWhere = (asOf = new Date()) => ({ status: 'CONFIRMED', dueDate: { lt: startOfDay(asOf) } });

/** Adds outstanding balance + overdue flag to an invoice (derived on read, never stale). */
export const decorateInvoice = (inv) => ({
  ...inv,
  outstanding: round2(toNum(inv.total) - toNum(inv.amountPaid)),
  isOverdue: inv.status === 'CONFIRMED' && new Date(inv.dueDate) < startOfDay(),
});

/**
 * Records a payment against an invoice in one transaction (used by staff payments and the customer portal).
 * Pass customerId to restrict to that customer's invoices. amount defaults to the full outstanding balance.
 */
export async function recordPayment(args, attempt = 1) {
  try {
    return await recordPaymentOnce(args);
  } catch (e) {
    // P2034: serialization conflict with a concurrent payment on the same invoice — retry with fresh numbers
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2034' && attempt < 3) return recordPayment(args, attempt + 1);
    throw e;
  }
}

async function recordPaymentOnce({ invoiceId, method, amount, paymentDate = new Date(), note = null, recordedById = null, customerId = null }) {
  return prisma.$transaction(async (tx) => {
    const inv = await tx.invoice.findUnique({ where: { id: invoiceId } });
    if (!inv || (customerId && inv.customerId !== customerId)) throw notFound('Invoice');
    if (inv.status === 'DRAFT') throw badRequest('Confirm the invoice before recording a payment');
    if (inv.status === 'PAID') throw badRequest('This invoice is already fully paid');
    if (inv.status === 'CANCELLED') throw badRequest('Payments cannot be recorded on a cancelled invoice');
    const outstanding = round2(toNum(inv.total) - toNum(inv.amountPaid));
    const amt = round2(amount ?? outstanding);
    if (amt <= 0) throw badRequest('Amount must be greater than 0');
    if (amt > outstanding) throw badRequest(`Amount exceeds the outstanding balance of ${formatMoney(outstanding)}`);
    if (paymentDate > new Date()) throw badRequest('Payment date cannot be in the future');
    const payment = await tx.payment.create({
      data: { number: await nextNumber('PAY', tx), invoiceId, method, amount: amt, paymentDate, note, recordedById },
    });
    const invoice = await syncInvoicePayments(tx, invoiceId);
    return { payment, invoice };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
