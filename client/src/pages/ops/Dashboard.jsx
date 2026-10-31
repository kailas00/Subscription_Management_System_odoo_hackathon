import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowRight, ArrowUpRight, CalendarClock, CheckCircle2, Clock, FileText, Inbox, Play } from 'lucide-react';
import { billingApi, invoicesApi, reportsApi, subscriptionsApi } from '../../api/endpoints.js';
import { useAction } from '../../hooks/useApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLE_GOAL, ROLES, STATUS } from '../../lib/constants.js';
import { date, daysFromToday, money, moneyCompact, relativeDays } from '../../lib/format.js';
import { Avatar, Button, Card, PageHeader, Spinner } from '../../components/ui/index.js';
import { RevenueTrend, Sparkline } from '../../components/ops/charts.jsx';

const STATUS_BAR = { ACTIVE: 'bg-brand', PAUSED: 'bg-warn', QUOTATION: 'bg-info', CONFIRMED: 'bg-accent', DRAFT: 'bg-faint/60', CLOSED: 'bg-ink/25', CANCELLED: 'bg-bad/60' };

function Figure({ label, value, foot, to, tone }) {
  return (
    <Link to={to} className="group flex flex-col justify-between gap-3 border-t border-line p-6 transition-colors duration-quick hover:bg-ground lg:border-l lg:border-t-0">
      <p className="flex items-center justify-between text-sm text-muted">{label}<ArrowUpRight className="size-4 text-faint opacity-0 transition-opacity duration-quick group-hover:opacity-100" aria-hidden /></p>
      <p className={`text-3xl font-semibold tabular ${tone === 'bad' ? 'text-bad' : 'text-ink'}`}>{value}</p>
      <p className="flex items-center gap-2 text-sm text-muted">{foot}</p>
    </Link>
  );
}

const Meter = ({ value, max }) => (
  <span className="inline-block h-1.5 w-12 shrink-0 overflow-hidden rounded-full bg-sunken" aria-hidden>
    <span className="block h-full rounded-full bg-brand" style={{ width: `${Math.min(100, (value / (max || 1)) * 100)}%` }} />
  </span>
);

function AttentionRow({ to, title, sub, right, tone }) {
  return (
    <li>
      <Link to={to} className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-ground">
        <Avatar name={title} />
        <span className="min-w-0 flex-1"><span className="block truncate text-base font-medium">{title}</span><span className={`block truncate text-sm ${tone === 'bad' ? 'text-bad' : 'text-muted'}`}>{sub}</span></span>
        <span className="tabular text-base font-medium">{right}</span>
      </Link>
    </li>
  );
}

/** One card per job that is waiting. Zero reads "All clear" so the list never nags. */
function TodayCard({ to, icon: Icon, count, title, action, tone }) {
  const clear = !count;
  return (
    <Link to={to} className={`card pressable group flex flex-col gap-3 p-5 transition-shadow hover:shadow-pop ${clear ? 'opacity-80' : ''}`}>
      <span className={`flex size-10 items-center justify-center rounded-xl ${clear ? 'bg-ok-soft text-ok' : { bad: 'bg-bad-soft text-bad', info: 'bg-info-soft text-info', accent: 'bg-accent-soft text-accent', brand: 'bg-brand-soft text-brand' }[tone]}`}>
        {clear ? <CheckCircle2 className="size-5" aria-hidden /> : <Icon className="size-5" aria-hidden />}
      </span>
      <span>
        <span className="block text-3xl font-semibold tabular">{count ?? '–'}</span>
        <span className="block text-base font-medium">{title}</span>
      </span>
      <span className={`mt-auto inline-flex items-center gap-1 text-sm font-semibold ${clear ? 'text-muted' : 'text-brand'}`}>
        {clear ? 'All clear' : action}{!clear && <ArrowRight className="size-4 transition-transform duration-quick group-hover:translate-x-0.5" aria-hidden />}
      </span>
    </Link>
  );
}

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const summary = useQuery({ queryKey: ['reports', 'summary'], queryFn: () => reportsApi.summary() });
  const trend = useQuery({ queryKey: ['reports', 'trend', 12], queryFn: () => reportsApi.revenueTrend({ months: 12 }) });
  const byStatus = useQuery({ queryKey: ['reports', 'status'], queryFn: reportsApi.subscriptionsByStatus });
  const overdue = useQuery({ queryKey: ['reports', 'overdue', 'top'], queryFn: () => reportsApi.overdue({ pageSize: 4 }) });
  const quotes = useQuery({ queryKey: ['subscriptions', 'quotes'], queryFn: () => subscriptionsApi.list({ status: 'QUOTATION', pageSize: 100, sort: 'quotationValidUntil', order: 'asc' }) });
  const upcoming = useQuery({ queryKey: ['subscriptions', 'upcoming'], queryFn: () => subscriptionsApi.list({ status: 'ACTIVE', pageSize: 6, sort: 'nextInvoiceDate', order: 'asc' }) });
  const drafts = useQuery({ queryKey: ['invoices', 'drafts'], queryFn: () => invoicesApi.list({ status: 'DRAFT', pageSize: 1 }) });
  const requests = useQuery({ queryKey: ['subscriptions', 'requests'], queryFn: () => subscriptionsApi.list({ status: 'DRAFT', requested: 'true', pageSize: 1 }) });
  const run = useAction(() => billingApi.run(), {
    success: (r) => `Billing run finished: ${r.data.invoicesCreated} new invoice(s), ${r.data.autoClosed} subscription(s) closed at expiry`,
    invalidate: ['reports', 'invoices', 'subscriptions'],
  });

  const s = summary.data?.data;
  const t = trend.data?.data ?? [];
  const statuses = (byStatus.data?.data ?? []).filter((x) => x.count > 0);
  const totalSubs = statuses.reduce((a, x) => a + x.count, 0);
  const expiring = (quotes.data?.data ?? []).filter((q) => q.quotationValidUntil && daysFromToday(q.quotationValidUntil) <= 7);
  const month = new Date().toLocaleDateString('en-IN', { month: 'long' });
  const yearInvoiced = t.reduce((a, x) => a + x.invoiced, 0);
  const yearCollected = t.reduce((a, x) => a + x.collected, 0);
  const hour = new Date().getHours();

  return (
    <>
      <PageHeader title={`Good ${hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'}, ${user.name.split(' ')[0]}`}
        description={<><span className="mr-2 rounded-full bg-sunken px-2.5 py-0.5 text-sm font-semibold text-ink">{ROLES[user.role]}</span>{ROLE_GOAL[user.role]}</>}
        actions={isAdmin && <Button variant="secondary" icon={Play} loading={run.isPending} onClick={() => run.mutate()}>Run billing now</Button>} />

      <section aria-labelledby="h-today" className="mb-8">
        <h2 id="h-today" className="mb-3 text-lg font-semibold">Waiting for you today</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <TodayCard to="/subscriptions?tab=REQUESTED" icon={Inbox} tone="brand" count={requests.data?.meta?.total} title="Customer requests" action="Price and send offers" />
          <TodayCard to="/invoices?tab=DRAFT" icon={FileText} tone="info" count={drafts.data?.meta?.total} title="Draft invoices" action="Check and confirm" />
          <TodayCard to="/invoices?tab=overdue" icon={AlertTriangle} tone="bad" count={s?.overdueCount} title="Overdue bills" action="Remind customers" />
          <TodayCard to="/subscriptions?tab=QUOTATION" icon={Clock} tone="accent" count={quotes.data ? expiring.length : undefined} title="Offers expiring this week" action="Follow up" />
        </div>
      </section>

      <h2 className="mb-3 text-lg font-semibold">How the business stands in {month}</h2>
      {summary.isLoading ? <Spinner /> : s && (
        // One ledger strip, not a wall of tiles: recurring revenue leads with its 12-month history, the rest read left to right.
        <section aria-label="Summary" className="card grid overflow-hidden lg:grid-cols-[1.35fr_1fr_1fr_1fr]">
          <Link to="/reports" className="group relative flex flex-col justify-between gap-4 overflow-hidden bg-rail p-6 text-rail-ink">
            <div className="relative flex items-baseline justify-between gap-3">
              <p className="text-sm text-rail-muted">Monthly recurring revenue</p>
              <span className="text-xs text-rail-muted"><b className="font-medium text-signal">{s.activeSubscriptions.toLocaleString('en-IN')}</b> active</span>
            </div>
            <p className="relative text-4xl font-bold text-white tabular">{money(Math.round(s.mrr)).replace(/\.00$/, '')}</p>
            <div className="relative">
              <Sparkline values={t.map((x) => x.collected)} height={44} />
              <div className="mt-1.5 flex justify-between text-xs text-rail-muted"><span>Collected, last 12 months</span><span className="tabular text-rail-ink">{moneyCompact(yearCollected)}</span></div>
            </div>
          </Link>
          <Figure to="/payments" label={`Collected in ${month}`} value={moneyCompact(s.revenue)}
            foot={s.invoiced ? <><Meter value={s.revenue} max={s.invoiced} /> {Math.round((s.revenue / s.invoiced) * 100)}% of {moneyCompact(s.invoiced)} invoiced</> : 'Nothing invoiced yet this month'} />
          <Figure to="/invoices" label="Outstanding" value={moneyCompact(s.outstanding)} foot={`${s.unpaidCount} unpaid invoice${s.unpaidCount === 1 ? '' : 's'}`} />
          <Figure to="/invoices" label="Overdue" tone={s.overdueCount ? 'bad' : undefined} value={moneyCompact(s.overdueAmount)}
            foot={s.overdueCount ? `${s.overdueCount} invoice${s.overdueCount === 1 ? '' : 's'} past due` : 'Nothing past due'} />
        </section>
      )}
      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-8" title={trend.data ? `${moneyCompact(yearCollected)} collected of ${moneyCompact(yearInvoiced)} invoiced` : 'Revenue'}
          description="Last 12 months"
          actions={<div className="flex gap-4 text-sm text-muted"><span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-line" />Invoiced</span><span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-brand" />Collected</span></div>}>
          {trend.data ? <RevenueTrend data={t} /> : <Spinner />}
        </Card>

        <Card className="lg:col-span-4" title="Subscriptions" description={`${totalSubs.toLocaleString('en-IN')} in total`}>
          <div className="flex h-2.5 overflow-hidden rounded-full bg-sunken" role="img" aria-label="Subscriptions by status">
            {statuses.map((x) => <span key={x.status} className={STATUS_BAR[x.status]} style={{ width: `${(x.count / totalSubs) * 100}%` }} />)}
          </div>
          <ul className="mt-5 space-y-1">
            {statuses.map((x) => (
              <li key={x.status}>
                <Link to="/subscriptions" className="flex items-center gap-3 rounded-md px-2 py-1.5 text-base transition-colors hover:bg-ground">
                  <span className={`size-2.5 rounded-sm ${STATUS_BAR[x.status]}`} />
                  <span className="flex-1">{STATUS[x.status].label}</span>
                  <span className="tabular font-medium">{x.count}</span>
                  <span className="w-10 text-right text-sm text-faint tabular">{Math.round((x.count / totalSubs) * 100)}%</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-7" title="Who to chase" description="Customers with the oldest unpaid bills" padded={false}>
          {(overdue.data?.data ?? []).length === 0 ? <p className="px-5 pb-5 text-sm text-muted">Nothing overdue.</p> : (
            <ul className="px-3 pb-3">{overdue.data.data.map((i) => <AttentionRow key={i.id} to={`/invoices/${i.id}`} title={i.customer.name} sub={`${i.daysOverdue} day${i.daysOverdue === 1 ? '' : 's'} overdue · ${i.number}`} right={moneyCompact(i.outstanding)} tone="bad" />)}</ul>
          )}
        </Card>

        <Card className="lg:col-span-5" title="Next to bill" description="Active subscriptions with the nearest billing date" padded={false}>
          <ul className="px-3 pb-3">
            {(upcoming.data?.data ?? []).map((x) => (
              <li key={x.id}>
                <Link to={`/subscriptions/${x.id}`} className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-ground">
                  <span className="flex size-10 shrink-0 flex-col items-center justify-center rounded-lg border border-line bg-ground leading-none">
                    <span className="text-[10px] font-medium uppercase text-muted">{new Date(x.nextInvoiceDate).toLocaleDateString('en-IN', { month: 'short' })}</span>
                    <span className="mt-0.5 text-md font-semibold tabular">{new Date(x.nextInvoiceDate).getDate()}</span>
                  </span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-base font-medium">{x.customer.name}</span><span className="block truncate text-sm text-muted">{x.plan.name} · <span className="doc-no">{x.number}</span></span></span>
                  <span className={`text-sm ${daysFromToday(x.nextInvoiceDate) <= 0 ? 'font-medium text-accent' : 'text-muted'}`}>{daysFromToday(x.nextInvoiceDate) <= 0 ? 'due now' : relativeDays(x.nextInvoiceDate)}</span>
                </Link>
              </li>
            ))}
            {upcoming.data && upcoming.data.data.length === 0 && <li className="flex items-center gap-2 px-2 py-6 text-sm text-muted"><CalendarClock className="size-4" />No active subscriptions yet.</li>}
          </ul>
        </Card>
      </div>
      {s && <p className="mt-6 text-xs text-muted">Figures as of {date(new Date())}. Recurring revenue counts active subscriptions only, before tax and discounts. New this month: {s.newSubscriptions} · closed: {s.churned}.</p>}
    </>
  );
}
