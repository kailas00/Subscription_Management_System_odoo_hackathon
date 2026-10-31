// Customer-facing helpers: customers think in services ("Prism Creative Suite"), not document numbers.
import { BILLING_PERIODS } from './constants.js';

export const periodOf = (plan) => BILLING_PERIODS.find((b) => b.value === plan?.billingPeriod);
/** "Every month" / "Every year" */
export const everyLabel = (plan) => `Every ${periodOf(plan)?.unit ?? 'period'}`;
/** Main service name, e.g. "Prism Creative Suite + 2 more" */
export function serviceTitle(s) {
  const names = [...new Set((s.lines ?? []).map((l) => l.product?.name).filter(Boolean))];
  if (!names.length) return s.plan?.name ?? 'Subscription';
  return names.length === 1 ? names[0] : `${names[0]} + ${names.length - 1} more`;
}
/** artKey of the main service (first line) */
export const mainArt = (s) => s.lines?.[0]?.product?.artKey ?? null;
/** Price per billing period before tax */
export const amountBeforeTax = (s) => Number(s.plan?.price || 0) + (s.lines ?? []).reduce((a, l) => a + l.quantity * Number(l.unitPrice || 0), 0);
