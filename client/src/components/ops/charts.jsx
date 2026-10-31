// Charts read colours from design tokens so they match the UI.
import { Area, Bar, CartesianGrid, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { money, moneyCompact } from '../../lib/format.js';

const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const anim = { isAnimationActive: !reduced, animationDuration: 400, animationEasing: 'ease-out' };

const tokenCache = new Map();
/** Design-token colour as rgb(), read from CSS once and cached (avoids style recalculation on every chart render). */
export const token = (name) => {
  if (!tokenCache.has(name)) {
    try { tokenCache.set(name, `rgb(${getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim()})`); } catch { return '#888'; }
  }
  return tokenCache.get(name);
};
const monthLabel = (m) => new Date(`${m}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'short' });

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-sm shadow-pop">
      <p className="mb-1 font-medium">{new Date(`${label}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2 tabular"><span className="size-2 rounded-full" style={{ background: p.color }} />{p.name}<b className="ml-auto pl-4 font-medium">{money(p.value)}</b></p>
      ))}
    </div>
  );
}

/** Invoiced (soft bars) vs collected (emerald area) per month. Direct legend in the card header. */
export function RevenueTrend({ data = [], height = 300 }) {
  return (
    <div style={{ height }} role="img" aria-label="Invoiced and collected revenue per month">
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="collected" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={token('brand')} stopOpacity={0.28} /><stop offset="1" stopColor={token('brand')} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={token('line')} strokeDasharray="3 4" />
          <XAxis dataKey="month" tickFormatter={monthLabel} tick={{ fontSize: 12, fill: token('faint') }} axisLine={false} tickLine={false} dy={6} />
          <YAxis tickFormatter={moneyCompact} tick={{ fontSize: 12, fill: token('faint') }} axisLine={false} tickLine={false} width={60} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: token('sunken'), opacity: 0.7 }} />
          <Bar dataKey="invoiced" name="Invoiced" fill={token('line')} radius={[5, 5, 0, 0]} maxBarSize={26} {...anim} />
          <Area dataKey="collected" name="Collected" type="monotone" stroke={token('brand')} strokeWidth={2.25} fill="url(#collected)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} {...anim} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Tiny line for the hero card (no axes). */
export function Sparkline({ values = [], color = 'rgb(52 211 153)', height = 56 }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1); const min = Math.min(...values, 0);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * 100, 100 - ((v - min) / (max - min || 1)) * 90 - 5]);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full" style={{ height }} aria-hidden>
      <defs><linearGradient id="spark" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".32" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <path d={`${line} L100 100 L0 100Z`} fill="url(#spark)" />
      <path d={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
