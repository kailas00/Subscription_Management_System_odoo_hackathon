// Bills & payments — every bill, what is still to pay, and the payments we've received.
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Receipt } from 'lucide-react';
import { portalApi } from '../../api/endpoints.js';
import { useTable } from '../../hooks/useApi.js';
import { PAYMENT_METHODS } from '../../lib/constants.js';
import { date, money } from '../../lib/format.js';
import { DataTable, Money, StatusBadge, Tabs } from '../../components/ui/index.js';

export default function PortalInvoices() {
  const nav = useNavigate();
  const t = useTable('portal-invoices', portalApi.invoices, { status: '' });
  const overview = useQuery({ queryKey: ['portal', 'overview'], queryFn: portalApi.overview });
  const payments = overview.data?.data.recentPayments ?? [];
  const o = overview.data?.data;
  return (
    <>
      <h1 className="text-2xl font-semibold">Bills & payments</h1>
      <p className="mt-1 mb-6 text-base text-muted">Open a bill to pay it online, or print it for your records.</p>
      <div className="mb-4"><Tabs value={t.params.status} onChange={(v) => t.setParam('status', v)} items={[{ value: '', label: 'All' }, { value: 'CONFIRMED', label: 'To pay' }, { value: 'PAID', label: 'Paid' }]} /></div>
      <DataTable rows={t.rows} meta={t.meta} loading={t.isLoading} error={t.error} onPage={(p) => t.setParam('page', p)} onRowClick={(i) => nav(`/portal/invoices/${i.id}`)}
        columns={[
          { key: 'date', header: 'Bill date', render: (i) => <span className="font-medium">{date(i.invoiceDate)}</span> },
          { key: 'due', header: 'Pay by', render: (i) => <span className={i.isOverdue ? 'font-medium text-bad' : ''}>{i.status === 'PAID' ? '—' : date(i.dueDate)}</span> },
          { key: 'total', header: 'Amount', align: 'right', render: (i) => <Money value={i.total} /> },
          { key: 'balance', header: 'Still to pay', align: 'right', render: (i) => <Money className="font-medium" value={i.outstanding} muted={!i.outstanding} /> },
          { key: 'status', header: 'Status', render: (i) => <StatusBadge status={i.status} overdue={i.isOverdue} customer invoice /> },
          { key: 'number', header: 'Reference', render: (i) => <span className="doc-no text-muted">{i.number}</span> },
        ]}
        empty={{ icon: Receipt, title: 'No bills yet', description: 'Your first bill appears here when a plan starts.' }} />

      <section className="mt-10" aria-labelledby="h-pay">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="h-pay" className="text-lg font-semibold">Payments we’ve received</h2>
          {o && <p className="text-sm text-muted">{money(o.paidThisYear)} paid in {new Date().getFullYear()} · {o.paymentsThisYear} payment{o.paymentsThisYear === 1 ? '' : 's'}</p>}
        </div>
        {payments.length === 0 ? <p className="mt-3 text-base text-muted">No payments yet.</p> : (
          <ul className="card mt-3 divide-y divide-line p-0">
            {payments.map((p) => (
              <li key={p.id}>
                <Link to={`/portal/invoices/${p.invoice.id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-ground">
                  <span><span className="block font-medium">{date(p.paymentDate)}</span><span className="text-sm text-muted">{PAYMENT_METHODS.find((m) => m.value === p.method)?.label} · for bill {p.invoice.number}</span></span>
                  <span className="font-semibold tabular text-ok">{money(p.amount)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
