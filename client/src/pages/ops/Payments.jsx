import { Link } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { paymentsApi } from '../../api/endpoints.js';
import { useTable } from '../../hooks/useApi.js';
import { PAYMENT_METHODS } from '../../lib/constants.js';
import { date, money } from '../../lib/format.js';
import { DataTable, Input, Money, PageHeader, Person, SearchInput, Select, Toolbar } from '../../components/ui/index.js';

export default function Payments() {
  const t = useTable('payments', paymentsApi.list, { method: '', from: '', to: '' });
  const columns = [
    { key: 'number', header: 'Payment', render: (p) => <span className="doc-no">{p.number}</span> },
    { key: 'date', header: 'Date', render: (p) => date(p.paymentDate) },
    { key: 'invoice', header: 'Invoice', render: (p) => <Link to={`/invoices/${p.invoice.id}`} className="doc-no text-brand hover:underline" onClick={(e) => e.stopPropagation()}>{p.invoice.number}</Link> },
    { key: 'customer', header: 'Customer', render: (p) => <Person name={p.invoice.customer.name} /> },
    { key: 'method', header: 'Method', render: (p) => PAYMENT_METHODS.find((m) => m.value === p.method)?.label },
    { key: 'note', header: 'Note', render: (p) => p.note || <span className="text-faint">—</span>, className: 'max-w-[220px] truncate text-muted' },
    { key: 'by', header: 'Recorded by', render: (p) => p.recordedBy?.name ?? '—', className: 'text-muted' },
    { key: 'amount', header: 'Amount', align: 'right', render: (p) => <Money className="font-medium" value={p.amount} /> },
  ];
  return (
    <>
      <PageHeader title="Payments" description="Money received against invoices, by any method." />
      <Toolbar>
        <SearchInput value={t.params.search} onChange={(v) => t.setParam('search', v)} placeholder="Search payment, invoice or customer" />
        <Select aria-label="Method" className="w-44" value={t.params.method} onChange={(e) => t.setParam('method', e.target.value)} placeholder="All methods" options={PAYMENT_METHODS} />
        <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 sm:w-auto">
          <Input aria-label="From date" type="date" value={t.params.from} onChange={(e) => t.setParam('from', e.target.value)} />
          <span className="text-sm text-muted">to</span>
          <Input aria-label="To date" type="date" value={t.params.to} onChange={(e) => t.setParam('to', e.target.value)} />
        </div>
      </Toolbar>
      <DataTable columns={columns} rows={t.rows} meta={t.meta} loading={t.isLoading} error={t.error} onPage={(p) => t.setParam('page', p)}
        empty={{ icon: Wallet, title: 'No payments match', description: 'Payments appear here when they are recorded on an invoice.' }} />
      {t.meta?.totalAmount !== undefined && t.rows.length > 0 && (
        <p className="mt-3 text-right text-base text-muted">Total for these filters: <b className="tabular text-ink">{money(t.meta.totalAmount)}</b></p>
      )}
    </>
  );
}
