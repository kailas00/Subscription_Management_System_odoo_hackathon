import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeInvoice, isDiscountValid, unitPriceFor } from './pricing.service.js';

const gst18 = { name: 'GST 18%', type: 'PERCENT', rate: 18, isActive: true };
const plan = { name: 'Monthly', price: 0 };

test('variant adds extra price (Odoo brand +560)', () => {
  assert.equal(unitPriceFor({ salesPrice: 1000 }, { extraPrice: 560 }), 1560);
});

test('tax is calculated on line subtotal', () => {
  const r = computeInvoice({ plan, lines: [{ productId: 1, product: { name: 'CRM' }, quantity: 2, unitPrice: 500, tax: gst18 }] });
  assert.equal(r.subtotal, 1000);
  assert.equal(r.taxTotal, 180);
  assert.equal(r.total, 1180);
});

test('plan fee becomes its own line', () => {
  const r = computeInvoice({ plan: { name: 'Pro', price: 299 }, lines: [] });
  assert.equal(r.lines.length, 1);
  assert.equal(r.total, 299);
});

test('product discount respects min quantity and picks best', () => {
  const d10 = { id: 1, scope: 'PRODUCT', type: 'PERCENT', value: 10, minQuantity: 5, isActive: true, usedCount: 0, usageLimit: null, products: [{ id: 1 }] };
  const lines = [{ productId: 1, product: { name: 'Seat' }, quantity: 4, unitPrice: 100, tax: null }];
  assert.equal(computeInvoice({ plan, lines, productDiscounts: [d10] }).discountTotal, 0);
  lines[0].quantity = 10;
  const r = computeInvoice({ plan, lines, productDiscounts: [d10] });
  assert.equal(r.discountTotal, 100);
  assert.deepEqual(r.appliedDiscountIds, [1]);
});

test('subscription discount is spread pro-rata and taxed after discount', () => {
  const d = { id: 2, scope: 'SUBSCRIPTION', type: 'FIXED', value: 100, isActive: true, usedCount: 0, usageLimit: 5 };
  const lines = [
    { productId: 1, product: { name: 'A' }, quantity: 1, unitPrice: 300, tax: gst18 },
    { productId: 2, product: { name: 'B' }, quantity: 1, unitPrice: 700, tax: gst18 },
  ];
  const r = computeInvoice({ plan, lines, subscriptionDiscount: d });
  assert.equal(r.discountTotal, 100);
  assert.equal(r.taxTotal, 162); // 18% of 900
  assert.equal(r.total, 1062);
});

test('expired or exhausted discounts are ignored', () => {
  const now = new Date('2026-06-01');
  assert.equal(isDiscountValid({ isActive: true, endDate: '2026-05-01', usedCount: 0, usageLimit: null }, now), false);
  assert.equal(isDiscountValid({ isActive: true, usedCount: 3, usageLimit: 3 }, now), false);
  assert.equal(isDiscountValid({ isActive: true, usedCount: 2, usageLimit: 3 }, now), true);
});
