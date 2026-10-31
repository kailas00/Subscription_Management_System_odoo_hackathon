// All money math goes through here. Decimal (Prisma) -> number with 2dp rounding.
export const toNum = (v) => (v === null || v === undefined ? 0 : Number(v));
export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
export const sum = (arr, pick = (x) => x) => round2(arr.reduce((a, x) => a + toNum(pick(x)), 0));
const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: process.env.CURRENCY || 'INR' });
export const formatMoney = (n) => fmt.format(toNum(n));
