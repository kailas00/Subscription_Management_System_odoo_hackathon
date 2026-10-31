import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCheck, Receipt } from 'lucide-react';
import { invoicesApi } from '../../api/endpoints.js';
import { useAction, useTable } from '../../hooks/useApi.js';
import { date, daysFromToday } from '../../lib/format.js';
import { Button, DataTable, Input, Money, PageHeader, SearchInput, StatusBadge, Tabs, Toolbar } from '../../components/ui/index.js';

const TABS = [
  { value: 'all', label: 'All' }, { value: 'DRAFT', label: 'Draft' }, { value: 'CONFIRMED', label: 'Unpaid' },
  { value: 'overdue', label: 'Overdue' }, { value: 'PAID', label: 'Paid' }, { value: 'CANCELLED', label: 'Cancelled' },
];

export default function Invoices() {
  const nav = useNavigate();
  const [tab, setTab] = useState('all');
  const [selected, setSelected] = useState([]);
  const t = useTable('invoices', invoicesApi.list, { status: '', overdue: '', from: '', to: '' });
  const bulk = useAction(() => invoicesApi.bulkConfirm(selected), {
    success: (r) => `${r.data.confirmed} invoice${r.data.confirmed === 1 ? '' : 's'} confirmed`, invalidate: ['invoices'], onSuccess: () => setSelected([]),
  });

  const changeTab = (v) => {
    setTab(v); setSelected([]);
    t.setParam('status', ['all', 'overdue'].includes(v) ? '' : v);
    t.setParam('overdue', v === 'overdue' ? 'true' : '');
  };
  const drafts = tab === 'DRAFT';
  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const columns = [
    drafts && { key: 'select', header: <input type="checkbox" aria-label="Select all" className="size-4 accent-[rgb(var(--brand))]"
      checked={t.rows.length > 0 && selected.length === t.rows.length} onChange={(e) => setSelected(e.target.checked ? t.rows.map((r) => r.id) : [])} />,
    render: (i) => <input type="checkbox" aria-label={`Select ${i.number}`} className="size-4 accent-[rgb(var(--brand))]" checked={selected.includes(i.id)}
      onClick={(e) => e.stopPropagation()} onChange={() => toggle(i.id)} /> },
    { key: 'number', header: 'Invoice', render: (i) => <span className="doc-no font-medium">{i.number}</span> },
    { key: 'customer', header: 'Customer', render: (i) => i.customer.name },
    { key: 'sub', header: 'Subscription', render: (i) => (i.subscription ? <span className="doc-no text-muted">{i.subscription.number}</span> : '—') },
    { key: 'date', header: 'Date', render: (i) => date(i.invoiceDate), className: 'text-muted' },
    { key: 'due', header: 'Due', render: (i) => (i.isOverdue
      ? <span className="font-medium text-bad">{date(i.dueDate)}<span className="block text-xs">{-daysFromToday(i.dueDate)} days overdue</span></span>
      : date(i.dueDate)) },
    { key: 'total', header: 'Total', align: 'right', render: (i) => <Money value={i.total} /> },
    { key: 'outstanding', header: 'Balance', align: 'right', render: (i) => (['CONFIRMED'].includes(i.status) ? <Money className="font-medium" value={i.outstanding} /> : <span className="text-faint">—</span>) },
    { key: 'status', header: 'Status', render: (i) => <StatusBadge status={i.status} overdue={i.isOverdue} /> },
  ].filter(Boolean);

  return (
    <>
      <PageHeader title="Invoices" description="Created automatically from active subscriptions on each billing date."
        actions={drafts && selected.length > 0 && <Button icon={CheckCheck} loading={bulk.isPending} onClick={() => bulk.mutate()}>Confirm {selected.length} selected</Button>} />
      <Toolbar>
        <SearchInput value={t.params.search} onChange={(v) => t.setParam('search', v)} placeholder="Search number or customer" />
        <Tabs value={tab} onChange={changeTab} items={TABS} />
        <div className="flex items-end gap-2">
          <Input aria-label="From date" type="date" value={t.params.from} onChange={(e) => t.setParam('from', e.target.value)} />
          <span className="pb-2 text-muted">to</span>
          <Input aria-label="To date" type="date" value={t.params.to} onChange={(e) => t.setParam('to', e.target.value)} />
        </div>
      </Toolbar>
      <DataTable columns={columns} rows={t.rows} meta={t.meta} loading={t.isLoading} error={t.error}
        onPage={(p) => t.setParam('page', p)} onRowClick={(i) => nav(`/invoices/${i.id}`)}
        empty={{ icon: Receipt, title: tab === 'overdue' ? 'Nothing overdue' : 'No invoices here', description: tab === 'overdue' ? 'Every confirmed invoice is within its payment terms.' : undefined }} />
    </>
  );
}
