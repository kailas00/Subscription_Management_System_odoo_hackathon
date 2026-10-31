import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, FileSignature } from 'lucide-react';
import { portalApi } from '../../api/endpoints.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { date, money, relativeDays } from '../../lib/format.js';
import { Card, Spinner, StatusBadge } from '../../components/ui/index.js';

export default function PortalHome() {
  const { user } = useAuth();
  const summary = useQuery({ queryKey: ['portal', 'summary'], queryFn: portalApi.summary });
  const quotes = useQuery({ queryKey: ['portal', 'subs', 'QUOTATION'], queryFn: () => portalApi.subscriptions({ status: 'QUOTATION' }) });
  const unpaid = useQuery({ queryKey: ['portal', 'invoices', 'CONFIRMED'], queryFn: () => portalApi.invoices({ status: 'CONFIRMED', pageSize: 5 }) });
  const s = summary.data?.data;

  return (
    <>
      <h1 className="text-2xl font-semibold">Hello, {user.name.split(' ')[0]}</h1>
      <p className="mt-1 text-base text-muted">Your subscriptions and invoices with Brightloop Software.</p>

      {summary.isLoading ? <Spinner /> : s && (
        <dl className="card mt-6 grid gap-px overflow-hidden bg-line sm:grid-cols-3">
          <div className="bg-surface px-5 py-4"><dt className="text-sm text-muted">Amount due</dt>
            <dd className={`mt-1 text-2xl font-semibold tabular ${s.overdueCount ? 'text-bad' : ''}`}>{money(s.outstanding)}</dd>
            <dd className="text-xs text-muted">{s.overdueCount ? `${s.overdueCount} overdue` : `${s.unpaidCount} unpaid invoice${s.unpaidCount === 1 ? '' : 's'}`}</dd></div>
          <div className="bg-surface px-5 py-4"><dt className="text-sm text-muted">Next invoice</dt>
            <dd className="mt-1 text-2xl font-semibold">{s.nextInvoiceDate ? date(s.nextInvoiceDate) : '—'}</dd>
            <dd className="text-xs text-muted">{s.nextInvoiceDate ? relativeDays(s.nextInvoiceDate) : 'No active billing'}</dd></div>
          <div className="bg-surface px-5 py-4"><dt className="text-sm text-muted">Active subscriptions</dt>
            <dd className="mt-1 text-2xl font-semibold tabular">{s.activeSubscriptions}</dd>
            <dd className="text-xs"><Link to="/portal/subscriptions" className="text-brand hover:underline">View all</Link></dd></div>
        </dl>
      )}

      {(quotes.data?.data ?? []).map((q) => (
        <Link key={q.id} to={`/portal/subscriptions/${q.id}`} className="card mt-6 flex items-center gap-4 p-5 transition-colors hover:bg-brand-soft/40">
          <FileSignature className="size-6 shrink-0 text-brand" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-medium">A quotation is waiting for you — <span className="doc-no">{q.number}</span></p>
            <p className="text-sm text-muted">{q.plan.name}{q.quotationValidUntil ? ` · valid until ${date(q.quotationValidUntil)}` : ''}</p>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-brand">Review<ArrowRight className="size-4" /></span>
        </Link>
      ))}

      <Card className="mt-6" title="Unpaid invoices" actions={<Link to="/portal/invoices" className="text-sm text-brand hover:underline">All invoices</Link>}>
        {(unpaid.data?.data ?? []).length === 0 ? <p className="text-base text-muted">You're all paid up.</p> : (
          <ul className="divide-y divide-line">
            {unpaid.data.data.map((i) => (
              <li key={i.id}><Link to={`/portal/invoices/${i.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3 hover:text-brand">
                <span><span className="doc-no">{i.number}</span><span className="block text-sm text-muted">Due {date(i.dueDate)}</span></span>
                <span className="flex items-center gap-3"><StatusBadge status={i.status} overdue={i.isOverdue} /><span className="tabular font-medium">{money(i.outstanding)}</span>
                  <span className="text-sm font-medium text-brand">Pay now</span></span>
              </Link></li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
