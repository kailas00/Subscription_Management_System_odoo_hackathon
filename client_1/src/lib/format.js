const CURRENCY = import.meta.env.VITE_CURRENCY || 'INR';
const moneyFmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: CURRENCY, maximumFractionDigits: 2 });
const compactFmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: CURRENCY, notation: 'compact', maximumFractionDigits: 1 });
const dateFmt = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export const money = (v) => moneyFmt.format(Number(v || 0));
export const moneyCompact = (v) => compactFmt.format(Number(v || 0));
export const date = (v) => (v ? dateFmt.format(new Date(v)) : '—');
export const toInputDate = (v) => (v ? new Date(v).toISOString().slice(0, 10) : '');
export const daysFromToday = (v) => {
  if (!v) return null;
  const a = new Date(); a.setHours(0, 0, 0, 0);
  const b = new Date(v); b.setHours(0, 0, 0, 0);
  return Math.round((b - a) / 86400000);
};
export const relativeDays = (v) => {
  const d = daysFromToday(v);
  if (d === null) return '—';
  if (d === 0) return 'today';
  return d > 0 ? `in ${d} day${d === 1 ? '' : 's'}` : `${-d} day${d === -1 ? '' : 's'} ago`;
};
