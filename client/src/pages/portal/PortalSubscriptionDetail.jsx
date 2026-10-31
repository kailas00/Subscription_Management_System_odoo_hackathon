import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { portalApi } from '../../api/endpoints.js';
import { useAction, useRecord } from '../../hooks/useApi.js';
import { BILLING_PERIODS } from '../../lib/constants.js';
import { date, money, relativeDays } from '../../lib/format.js';
import { serviceTitle, mainArt } from '../../lib/portal.js';
import { ServiceIcon } from '../../components/brand/ServiceArt.jsx';
import { Button, Card, ConfirmDialog, DescriptionList, EmptyState, LifecycleTrack, Spinner, StatusBadge } from '../../components/ui/index.js';

const LABEL = { confirm: 'Approve offer', pause: 'Pause', resume: 'Resume', close: 'End this plan' };
const MESSAGE = {
  confirm: 'You agree to the services and prices shown. Your first bill is created when the plan starts.',
  pause: 'Billing stops while paused. You can resume at any time.',
  resume: 'Billing restarts from the next period.',
  close: 'No new bills will be created. Bills you already have still need to be paid.',
};

export default function PortalSubscriptionDetail() {
  const { id } = useParams();
  const { record: s, isLoading, error } = useRecord(['portal', 'sub', id], () => portalApi.subscription(id));
  const [pending, setPending] = useState(null);
  const act = useAction((action) => portalApi.subscriptionAction(id, action), {
    success: (_r, a) => ({ confirm: 'Offer approved — thank you', pause: 'Plan paused', resume: 'Plan resumed', close: 'Plan ended' }[a]),
    invalidate: ['portal'], onSuccess: () => setPending(null),
  });

  if (isLoading) return <Spinner />;
  if (error) return <EmptyState title="We couldn't find this plan" description={error.message} />;
  const t = s.totals;
  const period = BILLING_PERIODS.find((b) => b.value === s.plan.billingPeriod);
  const expired = s.status === 'QUOTATION' && s.quotationValidUntil && new Date(s.quotationValidUntil) < new Date(new Date().toDateString());

  return (
    <>
      <Link to="/portal/subscriptions" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft className="size-4" />My plans</Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <ServiceIcon artKey={mainArt(s)} size={52} />
          <div>
            <h1 className="flex flex-wrap items-center gap-3 text-2xl font-semibold">{serviceTitle(s)}<StatusBadge status={s.status} customer /></h1>
            <p className="mt-1 text-sm text-muted">{s.plan.name} · billed every {period?.unit} · Ref <span className="doc-no">{s.number}</span></p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {s.actions.filter((a) => a !== 'confirm').map((a) => <Button key={a} variant={a === 'close' ? 'danger-ghost' : 'secondary'} onClick={() => setPending(a)}>{LABEL[a]}</Button>)}
          {s.actions.includes('confirm') && !expired && <Button onClick={() => setPending('confirm')}>Approve offer</Button>}
        </div>
      </div>
      {expired && <p className="mt-4 rounded-md bg-warn-soft px-3 py-2 text-sm text-warn">This offer expired on {date(s.quotationValidUntil)}. Ask your account manager for an updated one.</p>}
      {s.status === 'DRAFT' && <p className="mt-4 rounded-lg bg-info-soft px-4 py-3 text-base text-info">Thanks for your request. Your account manager is preparing an offer — you’ll be able to approve it here.</p>}
      {s.status === 'QUOTATION' && !expired && <p className="mt-4 rounded-lg bg-info-soft px-4 py-3 text-base text-info">Check the services and price below. If it looks right, choose <b>Approve offer</b>.</p>}

      <div className="card mt-6 p-5"><LifecycleTrack status={s.status} customer /></div>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_280px]">
        <Card title="What you get" description={`Price for each ${period?.unit}`} padded={false}>
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
            <div className="flex justify-between text-md font-semibold"><dt>You pay each {period?.unit}</dt><dd className="tabular">{money(t.total)}</dd></div>
          </dl>
        </Card>
        <div className="space-y-6">
          <Card title="Dates">
            <DescriptionList cols={1} items={[
              ['Starts', date(s.startDate)],
              ['Ends', s.expiryDate ? date(s.expiryDate) : 'Until cancelled'],
              s.status === 'ACTIVE' && ['Next bill', s.nextInvoiceDate ? `${date(s.nextInvoiceDate)} (${relativeDays(s.nextInvoiceDate)})` : '—'],
              s.status === 'QUOTATION' && ['Offer valid until', date(s.quotationValidUntil)],
              ['Time to pay each bill', `${s.paymentTermDays} days`],
            ]} />
          </Card>
          {s.invoices.length > 0 && (
            <Card title="Bills for this plan" padded={false}>
              <ul className="divide-y divide-line">{s.invoices.map((i) => (
                <li key={i.id}><Link to={`/portal/invoices/${i.id}`} className="flex items-center justify-between gap-2 px-5 py-2.5 text-sm hover:text-brand">
                  <span>{date(i.invoiceDate)} · <span className="tabular">{money(i.total)}</span></span><StatusBadge status={i.status} overdue={i.isOverdue} customer invoice /></Link></li>))}</ul>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog open={!!pending} onClose={() => setPending(null)} onConfirm={() => act.mutate(pending)} loading={act.isPending}
        danger={pending === 'close'} title={LABEL[pending]} message={MESSAGE[pending]} confirmLabel={LABEL[pending]} />
    </>
  );
}
