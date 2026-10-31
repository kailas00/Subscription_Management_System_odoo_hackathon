import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Repeat } from 'lucide-react';
import { subscriptionsApi, reportsApi } from '../../api/endpoints.js';
import { useTable } from '../../hooks/useApi.js';
import { BILLING_PERIODS } from '../../lib/constants.js';
import { date, relativeDays, daysFromToday } from '../../lib/format.js';
import { Badge, Button, DataTable, PageHeader, Person, SearchInput, StatusBadge, Tabs, Toolbar } from '../../components/ui/index.js';

const TABS = [
  { value: '', label: 'All' }, { value: 'REQUESTED', label: 'Customer requests' }, { value: 'ACTIVE', label: 'Active' }, { value: 'QUOTATION', label: 'Quotations' },
  { value: 'DRAFT', label: 'Drafts' }, { value: 'CONFIRMED', label: 'Confirmed' }, { value: 'PAUSED', label: 'Paused' }, { value: 'CLOSED,CANCELLED', label: 'Closed' },
];

export default function Subscriptions() {
  const nav = useNavigate();
  const [search] = useSearchParams();
  const initialTab = search.get('tab') || '';
  const t = useTable('subscriptions', subscriptionsApi.list, initialTab === 'REQUESTED' ? { status: 'DRAFT', requested: 'true' } : { status: initialTab, requested: '' });
  const tab = t.params.requested ? 'REQUESTED' : t.params.status;
  const changeTab = (v) => { t.setParam('requested', v === 'REQUESTED' ? 'true' : ''); t.setParam('status', v === 'REQUESTED' ? 'DRAFT' : v); };
  const requests = useQuery({ queryKey: ['subscriptions', 'requests'], queryFn: () => subscriptionsApi.list({ status: 'DRAFT', requested: 'true', pageSize: 1 }) });
  const counts = useQuery({ queryKey: ['subscriptions', 'counts'], queryFn: reportsApi.subscriptionsByStatus, retry: false });
  const countOf = (v) => {
    const rows = counts.data?.data;
    if (!rows) return undefined;
    if (v === 'REQUESTED') return requests.data?.meta?.total;
    if (!v) return rows.reduce((a, r) => a + r.count, 0);
    return rows.filter((r) => v.split(',').includes(r.status)).reduce((a, r) => a + r.count, 0);
  };

  const columns = [
    { key: 'number', header: 'Number', render: (s) => <span className="doc-no font-medium text-ink">{s.number}</span> },
    { key: 'customer', header: 'Customer', render: (s) => <span className="flex flex-wrap items-center gap-2"><Person name={s.customer.name} />{s.requestedByCustomer && s.status === 'DRAFT' && <Badge tone="brand">Customer request</Badge>}</span> },
    { key: 'plan', header: 'Plan', render: (s) => <span>{s.plan.name}<span className="block text-xs text-muted">{BILLING_PERIODS.find((b) => b.value === s.plan.billingPeriod)?.label}</span></span> },
    { key: 'status', header: 'Status', render: (s) => <StatusBadge status={s.status} /> },
    { key: 'next', header: 'Next invoice', render: (s) => (s.status === 'ACTIVE' && s.nextInvoiceDate
      ? <span title={date(s.nextInvoiceDate)} className={daysFromToday(s.nextInvoiceDate) <= 0 ? 'font-medium text-accent' : ''}>{relativeDays(s.nextInvoiceDate)}</span>
      : s.status === 'QUOTATION' && s.quotationValidUntil
        ? <span className={daysFromToday(s.quotationValidUntil) < 0 ? 'text-bad' : 'text-muted'}>Quote {daysFromToday(s.quotationValidUntil) < 0 ? 'expired' : `valid ${relativeDays(s.quotationValidUntil)}`}</span>
        : <span className="text-faint">—</span>) },
    { key: 'start', header: 'Start', render: (s) => date(s.startDate), className: 'text-muted' },
    { key: 'expiry', header: 'Expiry', render: (s) => date(s.expiryDate), className: 'text-muted' },
  ];

  return (
    <>
      <PageHeader title="Subscriptions" description="Every customer contract, from first quotation to renewal."
        actions={<Button icon={Plus} onClick={() => nav('/subscriptions/new')}>New subscription</Button>} />
      <Toolbar>
        <SearchInput value={t.params.search} onChange={(v) => t.setParam('search', v)} placeholder="Search number or customer" />
        <Tabs value={tab} onChange={changeTab} items={TABS.map((x) => ({ ...x, count: countOf(x.value) }))} />
      </Toolbar>
      <DataTable columns={columns} rows={t.rows} meta={t.meta} loading={t.isLoading} error={t.error}
        onPage={(p) => t.setParam('page', p)} onRowClick={(s) => nav(`/subscriptions/${s.id}`)}
        empty={{ icon: Repeat, title: 'No subscriptions here', description: 'Create one from a plan or a quotation template.',
          action: <Button icon={Plus} onClick={() => nav('/subscriptions/new')}>New subscription</Button> }} />
    </>
  );
}
