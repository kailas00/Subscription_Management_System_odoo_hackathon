// Billing-period date helpers (UTC, day precision).
export const startOfDay = (d = new Date()) => {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
};
export const addDays = (d, n) => {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
};

// Month math clamps to month end: Jan 31 + 1 month = Feb 28/29 (no skipping into March).
function addMonthsClamped(d, n) {
  const x = new Date(d);
  const day = x.getUTCDate();
  x.setUTCDate(1);
  x.setUTCMonth(x.getUTCMonth() + n);
  const last = new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth() + 1, 0)).getUTCDate();
  x.setUTCDate(Math.min(day, last));
  return x;
}

export function addPeriod(date, billingPeriod, intervalCount = 1) {
  switch (billingPeriod) {
    case 'DAILY': return addDays(date, intervalCount);
    case 'WEEKLY': return addDays(date, 7 * intervalCount);
    case 'MONTHLY': return addMonthsClamped(date, intervalCount);
    case 'YEARLY': return addMonthsClamped(date, 12 * intervalCount);
    default: throw new Error(`Unknown billing period ${billingPeriod}`);
  }
}

// Multiplier to convert one billing-period amount into Monthly Recurring Revenue.
export const MRR_FACTOR = { DAILY: 30, WEEKLY: 52 / 12, MONTHLY: 1, YEARLY: 1 / 12 };
