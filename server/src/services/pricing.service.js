// ─────────────────────────────────────────────────────────────────────────────
// Pricing engine — PURE functions (no DB). Single source of truth for:
//   • subscription totals shown on quotations
//   • invoice lines generated on billing day
//. Used by billing.service.js and the subscriptions module.
// Covered by pricing.service.test.js  →  npm test
// ─────────────────────────────────────────────────────────────────────────────
import { toNum, round2 } from '../lib/money.js';

/** Is a discount usable right now? (active, in date range, usage left) */
export function isDiscountValid(d, asOf = new Date()) {
  if (!d || !d.isActive) return false;
  if (d.startDate && new Date(d.startDate) > asOf) return false;
  if (d.endDate && new Date(d.endDate) < asOf) return false;
  if (d.usageLimit !== null && d.usageLimit !== undefined && d.usedCount >= d.usageLimit) return false;
  return true;
}

const discountValue = (d, base) =>
  round2(Math.min(base, d.type === 'PERCENT' ? (base * toNum(d.value)) / 100 : toNum(d.value)));

export function taxFor(tax, net, qty) {
  if (!tax || !tax.isActive) return 0;
  return round2(tax.type === 'PERCENT' ? (net * toNum(tax.rate)) / 100 : toNum(tax.rate) * qty);
}

/**
 * @param {object} p
 * @param {object} p.plan                 { name, price }
 * @param {Array}  p.lines                subscription lines incl. { productId, product{name}, variant{attribute,value}, description, quantity, unitPrice, tax }
 * @param {object} [p.subscriptionDiscount] discount attached to the subscription (scope SUBSCRIPTION)
 * @param {Array}  [p.productDiscounts]   all active PRODUCT-scope discounts incl. products:[{id}]
 * @param {Date}   [p.asOf]
 * @returns {{ lines, subtotal, discountTotal, taxTotal, total, appliedDiscountIds:number[] }}
 */
export function computeInvoice({ plan, lines = [], subscriptionDiscount = null, productDiscounts = [], asOf = new Date() }) {
  const applied = new Set();

  // 1) Base lines
  const out = [];
  if (plan && toNum(plan.price) > 0) {
    out.push({ productId: null, description: `${plan.name} — plan fee`, quantity: 1, unitPrice: toNum(plan.price), tax: null });
  }
  for (const l of lines) {
    const variantLabel = l.variant ? ` (${l.variant.attribute}: ${l.variant.value})` : '';
    out.push({
      productId: l.productId,
      description: l.description || `${l.product?.name ?? 'Product'}${variantLabel}`,
      quantity: l.quantity,
      unitPrice: toNum(l.unitPrice),
      tax: l.tax || null,
    });
  }
  for (const l of out) {
    l.gross = round2(l.quantity * l.unitPrice);
    l.discountAmount = 0;
    l.discountId = null;
  }

  // 2) PRODUCT-scope discounts: best eligible discount per line
  const validProductDiscounts = productDiscounts.filter((d) => d.scope === 'PRODUCT' && isDiscountValid(d, asOf));
  for (const l of out) {
    if (!l.productId) continue;
    let best = null;
    for (const d of validProductDiscounts) {
      if (!d.products?.some((p) => p.id === l.productId)) continue;
      if (d.minQuantity && l.quantity < d.minQuantity) continue;
      if (d.minPurchase && l.gross < toNum(d.minPurchase)) continue;
      const amt = discountValue(d, l.gross);
      if (!best || amt > best.amt) best = { d, amt };
    }
    if (best && best.amt > 0) {
      l.discountAmount = best.amt;
      l.discountId = best.d.id;
      applied.add(best.d.id);
    }
  }

  // 3) SUBSCRIPTION-scope discount: spread pro-rata so tax is charged on the discounted amount
  const d = subscriptionDiscount;
  if (d && d.scope === 'SUBSCRIPTION' && isDiscountValid(d, asOf)) {
    const netBefore = round2(out.reduce((a, l) => a + l.gross - l.discountAmount, 0));
    const totalQty = out.reduce((a, l) => a + l.quantity, 0);
    const eligible = netBefore > 0
      && (!d.minPurchase || netBefore >= toNum(d.minPurchase))
      && (!d.minQuantity || totalQty >= d.minQuantity);
    if (eligible) {
      const totalOff = discountValue(d, netBefore);
      let allocated = 0;
      out.forEach((l, i) => {
        const net = l.gross - l.discountAmount;
        const share = i === out.length - 1 ? round2(totalOff - allocated) : round2((totalOff * net) / netBefore);
        allocated = round2(allocated + share);
        l.discountAmount = round2(l.discountAmount + share);
        l.discountId = l.discountId ?? d.id;
      });
      if (totalOff > 0) applied.add(d.id);
    }
  }

  // 4) Taxes + totals
  const result = out.map((l) => {
    const subtotal = round2(l.gross - l.discountAmount);
    const taxAmount = taxFor(l.tax, subtotal, l.quantity);
    return {
      productId: l.productId,
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      discountId: l.discountId,
      discountAmount: l.discountAmount,
      taxName: l.tax?.name ?? null,
      taxAmount,
      subtotal,
      total: round2(subtotal + taxAmount),
    };
  });

  const gross = round2(result.reduce((a, l) => a + l.quantity * l.unitPrice, 0));
  const discountTotal = round2(result.reduce((a, l) => a + l.discountAmount, 0));
  const taxTotal = round2(result.reduce((a, l) => a + l.taxAmount, 0));
  return {
    lines: result,
    subtotal: gross,                 // before discounts
    discountTotal,
    taxTotal,
    total: round2(gross - discountTotal + taxTotal),
    appliedDiscountIds: [...applied],
  };
}

/** Unit price of a product line = product sales price + variant extra price */
export const unitPriceFor = (product, variant) => round2(toNum(product.salesPrice) + toNum(variant?.extraPrice));
