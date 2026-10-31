// Subscription state machine — the ONLY place allowed transitions are defined.
// Used by subscriptions controller, portal controller and billing engine.
//  DRAFT ──send──▶ QUOTATION ──confirm──▶ CONFIRMED ──activate──▶ ACTIVE ──close──▶ CLOSED
//    │                 │                      │                  │  ▲
//    └──cancel─────────┴────────cancel────────┘          pause   ▼  │ resume
//                                                               PAUSED
//  CLOSED ──renew (plan.renewable)──▶ ACTIVE  (expiry extended)
import { badRequest } from '../lib/errors.js';

export const TRANSITIONS = {
  send:     { from: ['DRAFT'], to: 'QUOTATION' },
  confirm:  { from: ['DRAFT', 'QUOTATION'], to: 'CONFIRMED' },
  activate: { from: ['CONFIRMED'], to: 'ACTIVE' },
  pause:    { from: ['ACTIVE'], to: 'PAUSED', planFlag: 'pausable' },
  resume:   { from: ['PAUSED'], to: 'ACTIVE' },
  close:    { from: ['ACTIVE', 'PAUSED'], to: 'CLOSED', planFlag: 'closable' },
  cancel:   { from: ['DRAFT', 'QUOTATION', 'CONFIRMED'], to: 'CANCELLED' },
  renew:    { from: ['ACTIVE', 'CLOSED'], to: 'ACTIVE', planFlag: 'renewable' },
};

// Statuses in which lines/customer/plan may still be edited
export const EDITABLE = ['DRAFT', 'QUOTATION'];

/** Throws 400 with a human message if `action` is not allowed. Returns target status. */
export function assertTransition(subscription, action) {
  const t = TRANSITIONS[action];
  if (!t) throw badRequest(`Unknown action "${action}"`);
  if (!t.from.includes(subscription.status)) {
    throw badRequest(`Cannot ${action} a subscription that is ${subscription.status.toLowerCase()}`);
  }
  if (t.planFlag && subscription.plan && !subscription.plan[t.planFlag]) {
    throw badRequest(`The plan "${subscription.plan.name}" does not allow this subscription to be ${action === 'renew' ? 'renewed' : action + 'd'}`);
  }
  if (action === 'confirm' && subscription.quotationValidUntil && new Date(subscription.quotationValidUntil) < new Date()) {
    throw badRequest('This quotation has expired. Update the validity date before confirming.');
  }
  if (['send', 'confirm'].includes(action) && subscription.lines && subscription.lines.length === 0 && Number(subscription.plan?.price || 0) === 0) {
    throw badRequest('Add at least one product line before sending or confirming');
  }
  return t.to;
}

/** Actions available for the UI buttons */
export function availableActions(subscription) {
  return Object.entries(TRANSITIONS)
    .filter(([, t]) => t.from.includes(subscription.status) && (!t.planFlag || subscription.plan?.[t.planFlag]))
    .map(([name]) => name);
}
