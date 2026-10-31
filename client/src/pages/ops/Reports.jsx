import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download } from 'lucide-react';
import { reportsApi } from '../../api/endpoints.js';
import { useTable } from '../../hooks/useApi.js';
import { BILLING_PERIODS, STATUS } from '../../lib/constants.js';
import { date, money, toInputDate } from '../../lib/format.js';
import { Button, Card, DataTable, Input, Money, PageHeader, Spinner, Tabs, Toolbar } from '../../components/ui/index.js';
import { RevenueTrend, token } from '../../components/ops/charts.jsx';

function presetRange(p) {
  const now = new Date();
  const y = now.getFullYear(); const m = now.getMonth();
  const d = (yy, mm, dd) => toInputDate(new Date(Date.UTC(yy, mm, dd)));
  switch (p) {
    case 'last-month': return { from: d(y, m - 1, 1), to: d(y, m, 0) };
    case 'quarter': { const q = Math.floor(m / 3) * 3; return { from: d(y, q, 1), to: toInputDate(now) }; }
    case 'year': return { from: d(y, 0, 1), to: toInputDate(now) };
    default: return { from: d(y, m, 1), to: toInputDate(now) };
  }
}

function toCsv(rows) {
  const head = ['Invoice', 'Customer', 'Email', 'Due date', 'Days overdue', 'Outstanding'];
  const safe = (v) => { const t = String(v ?? ''); return /^[=+\-@\t\r]/.test(t) ? `'${t}` : t; };
  const esc = (v) => `"${safe(v).replace(/"/g, '""')}"`;
  return [head, ...rows.map((r) => [r.number, r.customer.name, r.customer.email, toInputDate(r.dueDate), r.daysOverdue, r.outstanding])].map((r) => r.map(esc).join(',')).join('\n');
}

const TONE_COLOR = { ok: 'ok', info: 'info', accent: 'accent', warn: 'warn', bad: 'bad', neutral: 'faint' };

export default function Reports() {
  const [preset, setPreset] = useState('month');
  const [custom, setCustom] = useState(presetRange('month'));
  const range = preset === 'custom' ? custom : presetRange(preset);

  const summary = useQuery({ queryKey: ['reports', 'summary', range], queryFn: () => reportsApi.summary(range) });
  const trend = useQuery({ queryKey: ['reports', 'trend', 12], queryFn: () => reportsApi.revenueTrend({ months: 12 }) });
  const byStatus = useQuery({ queryKey: ['reports', 'status'], queryFn: reportsApi.subscriptionsByStatus });
  const plans = useQuery({ queryKey: ['reports', 'plans'], queryFn: reportsApi.planBreakdown });
  const overdue = useTable('reports-overdue', reportsApi.overdue);
  const s = summary.data?.data;
  const statusData = useMemo(() => (byStatus.data?.data ?? []).map((r) => ({ ...r, label: STATUS[r.status].label, color: token(TONE_COLOR[STATUS[r.status].tone]) })), [byStatus.data]);

  async function exportCsv() {
    const all = await reportsApi.overdue({ pageSize: 100 });
    const blob = new Blob([toCsv(all.data)], { type: 'text/csv' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `overdue-invoices-${toInputDate(new Date())}.csv` });
    a.click(); URL.revokeObjectURL(a.href);
  }

  const figures = s && [
    ['Collected', money(s.revenue), 'Payments received in the period'],
    ['Invoiced', money(s.invoiced), `${s.invoiceCount} invoices issued`],
    ['New subscriptions', s.newSubscriptions, 'Created in the period'],
    ['Closed subscriptions', s.churned, 'Closed in the period'],
    ['Active now', s.activeSubscriptions, `MRR ${money(s.mrr)}`],
    ['Outstanding now', money(s.outstanding), `${money(s.overdueAmount)} of it overdue`],
  ];

  return (
    <>
      <PageHeader title="Reports" description="Revenue, collections and the health of the subscription book." />
      <Toolbar>
        <Tabs value={preset} onChange={setPreset} items={[{ value: 'month', label: 'This month' }, { value: 'last-month', label: 'Last month' },
          { value: 'quarter', label: 'This quarter' }, { value: 'year', label: 'This year' }, { value: 'custom', label: 'Custom' }]} />
        {preset === 'custom' && (
          <div className="flex items-end gap-2">
            <Input aria-label="From date" type="date" value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} />
            <span className="pb-2 text-muted">to</span>
            <Input aria-label="To date" type="date" value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} />
          </div>
        )}
        <span className="text-sm text-muted">{date(range.from)} – {date(range.to)}</span>
      </Toolbar>

      {summary.isLoading ? <Spinner /> : figures && (
        <dl className="card mb-6 grid grid-cols-2 gap-px overflow-hidden bg-line sm:grid-cols-3 lg:grid-cols-6">
          {figures.map(([k, v, sub]) => (
            <div key={k} className="bg-surface px-4 py-3.5"><dt className="text-sm text-muted">{k}</dt><dd className="mt-0.5 text-lg font-semibold tabular">{v}</dd><dd className="text-xs text-muted">{sub}</dd></div>
          ))}
        </dl>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        <Card title="Invoiced vs collected, last 12 months">{trend.data ? <RevenueTrend data={trend.data.data} /> : <Spinner />}</Card>
        <Card title="Subscriptions by status">
          <div style={{ height: 280 }} role="img" aria-label="Number of subscriptions in each status">
            <ResponsiveContainer>
              <BarChart data={statusData} layout="vertical" margin={{ left: 8, right: 24 }}>
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis type="category" dataKey="label" width={88} tick={{ fontSize: 12, fill: token('muted') }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: token('sunken') }} formatter={(v) => [v, 'Subscriptions']} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={20} isAnimationActive={false} label={{ position: 'right', fontSize: 12, fill: token('ink') }}>
                  {statusData.map((d) => <Cell key={d.status} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <h2 className="mb-3 mt-8 text-md font-semibold">Recurring revenue by plan</h2>
      <DataTable dense rows={(plans.data?.data ?? []).map((p) => ({ ...p, id: p.planId }))} loading={plans.isLoading} error={plans.error}
        columns={[
          { key: 'name', header: 'Plan', render: (p) => <span className="font-medium">{p.name}</span> },
          { key: 'period', header: 'Billing', render: (p) => BILLING_PERIODS.find((b) => b.value === p.billingPeriod)?.label },
          { key: 'activeCount', header: 'Active subscriptions', align: 'right' },
          { key: 'mrr', header: 'MRR', align: 'right', render: (p) => <Money className="font-medium" value={p.mrr} /> },
        ]} empty={{ title: 'No active subscriptions yet' }} />

      <div className="mb-3 mt-8 flex items-center justify-between">
        <h2 className="text-md font-semibold">Overdue invoices</h2>
        <Button size="sm" variant="secondary" icon={Download} onClick={exportCsv} disabled={!overdue.rows.length}>Export CSV</Button>
      </div>
      <DataTable dense rows={overdue.rows} meta={overdue.meta} loading={overdue.isLoading} error={overdue.error} onPage={(p) => overdue.setParam('page', p)}
        columns={[
          { key: 'number', header: 'Invoice', render: (r) => <Link to={`/invoices/${r.id}`} className="doc-no text-brand hover:underline">{r.number}</Link> },
          { key: 'customer', header: 'Customer', render: (r) => <span>{r.customer.name}<span className="block text-xs text-muted">{r.customer.email}</span></span> },
          { key: 'due', header: 'Due date', render: (r) => date(r.dueDate) },
          { key: 'days', header: 'Days overdue', align: 'right', render: (r) => <span className="font-medium text-bad">{r.daysOverdue}</span> },
          { key: 'outstanding', header: 'Outstanding', align: 'right', render: (r) => <Money className="font-medium" value={r.outstanding} /> },
        ]} empty={{ title: 'Nothing overdue', description: 'Every confirmed invoice is within its payment terms.' }} />
    </>
  );
}
