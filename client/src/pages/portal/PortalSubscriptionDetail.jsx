import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { portalApi } from '../../api/endpoints.js';
import { useAction, useRecord } from '../../hooks/useApi.js';
import { BILLING_PERIODS } from '../../lib/constants.js';
import { date, money, relativeDays } from '../../lib/format.js';
import { Button, Card, ConfirmDialog, DescriptionList, EmptyState, LifecycleTrack, Spinner, StatusBadge } from '../../components/ui/index.js';

const LABEL = { confirm: 'Accept quotation', pause: 'Pause subscription', resume: 'Resume subscription', close: 'Cancel subscription' };
const MESSAGE = {
  confirm: 'By accepting, you agree to the plan, products and prices shown. Billing starts once Brightloop activates it.',
  pause: 'Billing stops while paused. You can resume at any time.',
  resume: 'Billing restarts from the next period.',
  close: 'No further invoices will be created. Any unpaid invoices remain due.',
};

export default function PortalSubscriptionDetail() {
  const { id } = useParams();
  const { record: s, isLoading, error } = useRecord(['portal', 'sub', id], () => portalApi.subscription(id));
  const [pending, setPending] = useState(null);
  const act = useAction((action) => portalApi.subscriptionAction(id, action), {
    success: (_r, a) => ({ confirm: 'Quotation accepted — thank you', pause: 'Subscription paused', resume: 'Subscription resumed', close: 'Subscription cancelled' }[a]),
    invalidate: ['portal'], onSuccess: () => setPending(null),
  });

  if (isLoading) return <Spinner />;
  if (error) return <EmptyState title="We couldn't find this subscription" description={error.message} />;
  const t = s.totals;
  const period = BILLING_PERIODS.find((b) => b.value === s.plan.billingPeriod);
  const expired = s.status === 'QUOTATION' && s.quotationValidUntil && new Date(s.quotationValidUntil) < new Date(new Date().toDateString());

  return (
    <>
      <Link to="/portal/subscriptions" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft className="size-4" />Your subscriptions</Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-semibold">{s.plan.name}<StatusBadge status={s.status} /></h1>
          <p className="doc-no mt-1 text-muted">{s.number}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {s.actions.filter((a) => a !== 'confirm').map((a) => <Button key={a} variant={a === 'close' ? 'danger-ghost' : 'secondary'} onClick={() => setPending(a)}>{LABEL[a]}</Button>)}
          {s.actions.includes('confirm') && !expired && <Button onClick={() => setPending('confirm')}>Accept quotation</Button>}
        </div>
      </div>
      {expired && <p className="mt-4 rounded-md bg-warn-soft px-3 py-2 text-sm text-warn">This quotation expired on {date(s.quotationValidUntil)}. Contact us for an updated offer.</p>}

      <div className="card mt-6 p-5"><LifecycleTrack status={s.status} /></div>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_280px]">
        <Card title={`What you get — billed ${period?.label.toLowerCase()}`} padded={false}>
          <ul className="divide-y divide-line">
            {t.lines.map((l, i) => (
              <li key={i} className="flex items-start justify-between gap-4 px-5 py-3">
                <span><span className="text-base">{l.description}</span><span className="block text-sm text-muted">{l.quantity} × {money(l.unitPrice)}{l.taxName ? ` · ${l.taxName}` : ''}</span></span>
                <span className="tabular font-medium">{money(l.total)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-1.5 border-t border-line px-5 py-4 text-base">
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="tabular">{money(t.subtotal)}</dd></div>
            {t.discountTotal > 0 && <div className="flex justify-between text-ok"><dt>Discount</dt><dd className="tabular">−{money(t.discountTotal)}</dd></div>}
            <div className="flex justify-between"><dt className="text-muted">Tax</dt><dd className="tabular">{money(t.taxTotal)}</dd></div>
            <div className="flex justify-between text-md font-semibold"><dt>Total per {period?.unit}</dt><dd className="tabular">{money(t.total)}</dd></div>
          </dl>
        </Card>
        <div className="space-y-6">
          <Card title="Dates">
            <DescriptionList cols={1} items={[
              ['Starts', date(s.startDate)],
              ['Ends', s.expiryDate ? date(s.expiryDate) : 'Until cancelled'],
              s.status === 'ACTIVE' && ['Next invoice', s.nextInvoiceDate ? `${date(s.nextInvoiceDate)} (${relativeDays(s.nextInvoiceDate)})` : '—'],
              s.status === 'QUOTATION' && ['Offer valid until', date(s.quotationValidUntil)],
              ['Payment terms', `${s.paymentTermDays} days`],
            ]} />
          </Card>
          {s.invoices.length > 0 && (
            <Card title="Invoices" padded={false}>
              <ul className="divide-y divide-line">{s.invoices.map((i) => (
                <li key={i.id}><Link to={`/portal/invoices/${i.id}`} className="flex items-center justify-between gap-2 px-5 py-2.5 text-sm hover:text-brand">
                  <span className="doc-no">{i.number}</span><StatusBadge status={i.status} overdue={i.isOverdue} /></Link></li>))}</ul>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog open={!!pending} onClose={() => setPending(null)} onConfirm={() => act.mutate(pending)} loading={act.isPending}
        danger={pending === 'close'} title={LABEL[pending]} message={MESSAGE[pending]} confirmLabel={LABEL[pending]} />
    </>
  );
}
