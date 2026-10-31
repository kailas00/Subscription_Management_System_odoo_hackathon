import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertTransition, availableActions } from './subscriptionFlow.js';

const plan = { name: 'Monthly', price: 0, pausable: true, closable: true, renewable: false };
const sub = (status, extra = {}) => ({ status, plan, lines: [{ id: 1 }], ...extra });

test('happy path moves draft to active', () => {
  assert.equal(assertTransition(sub('DRAFT'), 'send'), 'QUOTATION');
  assert.equal(assertTransition(sub('QUOTATION'), 'confirm'), 'CONFIRMED');
  assert.equal(assertTransition(sub('CONFIRMED'), 'activate'), 'ACTIVE');
});

test('illegal jumps are rejected with a readable message', () => {
  assert.throws(() => assertTransition(sub('DRAFT'), 'activate'), /Cannot activate a subscription that is draft/);
  assert.throws(() => assertTransition(sub('CLOSED'), 'pause'), /Cannot pause/);
});

test('plan rules are enforced', () => {
  assert.throws(() => assertTransition(sub('ACTIVE'), 'renew'), /does not allow/);
  assert.throws(() => assertTransition(sub('ACTIVE', { plan: { ...plan, pausable: false } }), 'pause'), /does not allow/);
});

test('expired quotations cannot be confirmed', () => {
  assert.throws(() => assertTransition(sub('QUOTATION', { quotationValidUntil: '2020-01-01' }), 'confirm'), /expired/);
});

test('empty quotations cannot be sent', () => {
  assert.throws(() => assertTransition(sub('DRAFT', { lines: [] }), 'send'), /at least one product/);
});

test('available actions follow status and plan', () => {
  assert.deepEqual(availableActions(sub('ACTIVE')), ['pause', 'close']);
  assert.deepEqual(availableActions(sub('PAUSED')), ['resume', 'close']);
});
