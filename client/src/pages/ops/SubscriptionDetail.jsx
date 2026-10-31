import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FilePlus2, Pencil } from 'lucide-react';
import { invoicesApi, subscriptionsApi } from '../../api/endpoints.js';
import { useAction, useRecord } from '../../hooks/useApi.js';
import { ACTION_LABEL, BILLING_PERIODS, DESTRUCTIVE_ACTIONS, STATUS } from '../../lib/constants.js';
import { date, money, relativeDays, toInputDate } from '../../lib/format.js';
import { Button, Card, ConfirmDialog, DataTable, DescriptionList, EmptyState, Input, LifecycleTrack, Modal, Money, PageHeader, Spinner, StatusBadge, Textarea } from '../../components/ui/index.js';

const PRIMARY = ['send', 'confirm', 'activate', 'resume', 'renew'];

export default function SubscriptionDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { record: s, isLoading, error } = useRecord(['subscription', id], () => subscriptionsApi.get(id));
  const [dialog, setDialog] = useState(null); // { action }
  const [note, setNote] = useState('');
  const [expiry, setExpiry] = useState('');

  const act = useAction(({ action, body }) => subscriptionsApi.action(id, action, body), {
    success: (_r, v) => `${ACTION_LABEL[v.action]} — done`, invalidate: ['subscription', 'subscriptions', 'invoices'],
    onSuccess: () => { setDialog(null); setNote(''); },
  });
  const generate = useAction(() => invoicesApi.generate(Number(id)), {
    success: (r) => (r.meta?.duplicate ? 'This period is already invoiced' : `Invoice ${r.data.number} created`), invalidate: ['subscription', 'invoices'],
  });

  if (isLoading) return <Spinner />;
  if (error) return <EmptyState title="Couldn't load this subscription" description={error.message} />;

  const run = (action) => {
    if (DESTRUCTIVE_ACTIONS.includes(action) || action === 'renew') {
      setExpiry(toInputDate(s.expiryDate ? new Date(new Date(s.expiryDate).setFullYear(new Date(s.expiryDate).getFullYear() + 1)) : null));
      return setDialog({ action });
    }
    act.mutate({ action });
  };
  const period = BILLING_PERIODS.find((b) => b.value === s.plan.billingPeriod);
  const t = s.totals;

  const lineCols = [
    { key: 'description', header: 'Product', render: (l) => l.description },
    { key: 'quantity', header: 'Qty', align: 'right', render: (l) => l.quantity },
    { key: 'unitPrice', header: 'Unit price', align: 'right', render: (l) => <Money value={l.unitPrice} /> },
    { key: 'discount', header: 'Discount', align: 'right', render: (l) => (Number(l.discountAmount) ? <Money className="text-ok" value={-l.discountAmount} /> : <span className="text-faint">—</span>) },
    { key: 'tax', header: 'Tax', align: 'right', render: (l) => (l.taxName ? <span title={l.taxName}><Money value={l.taxAmount} /></span> : <span className="text-faint">—</span>) },
    { key: 'total', header: 'Amount', align: 'right', render: (l) => <Money className="font-medium" value={l.total} /> },
  ];
  const invCols = [
    { key: 'number', header: 'Invoice', render: (i) => <span className="doc-no">{i.number}</span> },
    { key: 'period', header: 'Period', render: (i) => (i.periodStart ? `${date(i.periodStart)} – ${date(i.periodEnd)}` : '—'), className: 'text-muted' },
    { key: 'due', header: 'Due', render: (i) => date(i.dueDate) },
    { key: 'status', header: 'Status', render: (i) => <StatusBadge status={i.status} overdue={i.status === 'CONFIRMED' && new Date(i.dueDate) < new Date(new Date().toDateString())} /> },
    { key: 'total', header: 'Total', align: 'right', render: (i) => <Money value={i.total} /> },
  ];

  return (
    <>
      <PageHeader
        back={<Link to="/subscriptions" className="mb-2 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft className="size-4" />Subscriptions</Link>}
        title={<span className="flex flex-wrap items-center gap-3"><span className="doc-no text-2xl">{s.number}</span><StatusBadge status={s.status} /></span>}
        description={<>{s.customer.name} · {s.plan.name}</>}
        actions={<>
          {['DRAFT', 'QUOTATION'].includes(s.status) && <Button variant="secondary" icon={Pencil} onClick={() => nav(`/subscriptions/${id}/edit`)}>Edit</Button>}
          {s.actions.filter((a) => !PRIMARY.includes(a)).map((a) => (
            <Button key={a} variant={DESTRUCTIVE_ACTIONS.includes(a) ? 'danger-ghost' : 'secondary'} onClick={() => run(a)} loading={act.isPending && act.variables?.action === a}>{ACTION_LABEL[a]}</Button>
          ))}
          {s.actions.filter((a) => PRIMARY.includes(a)).map((a) => (
            <Button key={a} onClick={() => run(a)} loading={act.isPending && act.variables?.action === a}>{ACTION_LABEL[a]}</Button>
          ))}
        </>}
      />

      <div className="card mb-6 px-5 py-5"><LifecycleTrack status={s.status} /></div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          <section>
            <h2 className="mb-3 text-md font-semibold">Lines — billed {period?.label.toLowerCase()}{s.plan.intervalCount > 1 ? ` (every ${s.plan.intervalCount} ${period?.unit}s)` : ''}</h2>
            <DataTable dense columns={lineCols} rows={t.lines.map((l, i) => ({ ...l, id: i }))} empty={{ title: 'No product lines' }} />
            <dl className="ml-auto mt-3 w-full max-w-xs space-y-1.5 text-base">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="tabular">{money(t.subtotal)}</dd></div>
              {t.discountTotal > 0 && <div className="flex justify-between text-ok"><dt>Discount{s.discount ? ` · ${s.discount.name}` : ''}</dt><dd className="tabular">−{money(t.discountTotal)}</dd></div>}
              <div className="flex justify-between"><dt className="text-muted">Tax</dt><dd className="tabular">{money(t.taxTotal)}</dd></div>
              <div className="flex justify-between border-t border-line pt-1.5 text-md font-semibold"><dt>Total per period</dt><dd className="tabular">{money(t.total)}</dd></div>
            </dl>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-md font-semibold">Invoices</h2>
              {s.status === 'ACTIVE' && <Button size="sm" variant="secondary" icon={FilePlus2} loading={generate.isPending} onClick={() => generate.mutate()}>Generate next invoice</Button>}
            </div>
            <DataTable dense columns={invCols} rows={s.invoices} onRowClick={(i) => nav(`/invoices/${i.id}`)}
              empty={{ title: 'No invoices yet', description: s.status === 'ACTIVE' ? 'The next one is created automatically on the billing date.' : 'Invoices start once the subscription is active.' }} />
          </section>
        </div>

        <aside className="space-y-6">
          <Card title="Details">
            <DescriptionList cols={1} items={[
              ['Customer', <Link key="c" to="/customers" className="text-brand hover:underline">{s.customer.name}</Link>],
              ['Start date', date(s.startDate)],
              ['Expiry date', s.expiryDate ? date(s.expiryDate) : 'Open-ended'],
              s.status === 'ACTIVE' && ['Next invoice', s.nextInvoiceDate ? `${date(s.nextInvoiceDate)} (${relativeDays(s.nextInvoiceDate)})` : '—'],
              ['QUOTATION', 'DRAFT'].includes(s.status) && ['Quotation valid until', date(s.quotationValidUntil)],
              ['Payment terms', `${s.paymentTermDays} days`],
              ['Salesperson', s.salesperson?.name],
              s.template && ['From template', s.template.name],
              s.closeReason && ['Closed because', s.closeReason],
              s.notes && ['Notes', s.notes],
            ]} />
          </Card>
          <Card title="Plan rules">
            <ul className="space-y-1.5 text-base">
              {[['autoClose', 'Closes automatically at expiry'], ['closable', 'Can be closed early'], ['pausable', 'Can be paused'], ['renewable', 'Can be renewed']].map(([k, label]) => (
                <li key={k} className={s.plan[k] ? 'text-ink' : 'text-faint line-through'}>{label}</li>
              ))}
            </ul>
          </Card>
          <Card title="Timeline">
            <ol className="space-y-4">
              {s.events.map((e) => (
                <li key={e.id} className="relative pl-5">
                  <span className="absolute left-0 top-1.5 size-2 rounded-full bg-brand" aria-hidden />
                  <p className="text-base"><b className="font-medium">{STATUS[e.toStatus]?.label}</b>{e.fromStatus && <span className="text-muted"> from {STATUS[e.fromStatus]?.label.toLowerCase()}</span>}</p>
                  <p className="text-xs text-muted">{new Date(e.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}{e.user ? ` · ${e.user.name}` : ' · System'}</p>
                  {e.note && <p className="mt-0.5 text-sm text-muted">{e.note}</p>}
                </li>
              ))}
            </ol>
          </Card>
        </aside>
      </div>

      <ConfirmDialog open={!!dialog && DESTRUCTIVE_ACTIONS.includes(dialog.action)} onClose={() => setDialog(null)} danger loading={act.isPending}
        title={dialog?.action === 'cancel' ? `Cancel ${s.number}?` : `Close ${s.number}?`}
        confirmLabel={dialog?.action === 'cancel' ? 'Cancel subscription' : 'Close subscription'}
        message={<>{dialog?.action === 'cancel' ? 'The quotation will be withdrawn.' : 'No further invoices will be created. Existing invoices stay payable.'}
          <Textarea className="mt-4" label="Reason (optional)" value={note} onChange={(e) => setNote(e.target.value)} /></>}
        onConfirm={() => act.mutate({ action: dialog.action, body: { note: note || undefined } })} />

      <Modal open={dialog?.action === 'renew'} onClose={() => setDialog(null)} title={`Renew ${s.number}`} size="sm"
        description="Billing continues on the same plan until the new expiry date."
        footer={<><Button variant="secondary" onClick={() => setDialog(null)}>Cancel</Button>
          <Button loading={act.isPending} disabled={!expiry} onClick={() => act.mutate({ action: 'renew', body: { newExpiryDate: expiry } })}>Renew</Button></>}>
        <Input label="New expiry date" type="date" required value={expiry} onChange={(e) => setExpiry(e.target.value)} hint={s.expiryDate ? `Currently ${date(s.expiryDate)}` : undefined} />
      </Modal>
    </>
  );
}
