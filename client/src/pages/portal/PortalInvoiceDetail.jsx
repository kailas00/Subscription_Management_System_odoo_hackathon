import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, CircleAlert, CreditCard, Printer, Receipt } from 'lucide-react';
import { portalApi } from '../../api/endpoints.js';
import { useAction, useRecord } from '../../hooks/useApi.js';
import { date, money } from '../../lib/format.js';
import { Button, EmptyState, Modal, Spinner } from '../../components/ui/index.js';
import { InvoiceDocument } from '../../components/ops/InvoiceDocument.jsx';

const METHODS = [{ value: 'CARD', label: 'Card' }, { value: 'UPI', label: 'UPI' }, { value: 'BANK_TRANSFER', label: 'Bank transfer' }];

/** One plain sentence above the formal invoice: what this bill is and whether anything is left to pay. */
function Summary({ inv, onPay }) {
  const paid = inv.status === 'PAID';
  const lastPay = inv.payments?.[0];
  const Icon = paid ? CheckCircle2 : inv.isOverdue ? CircleAlert : Receipt;
  const tone = paid ? 'border-ok/20 bg-ok-soft text-ok' : inv.isOverdue ? 'border-bad/25 bg-bad-soft text-bad' : 'border-info/20 bg-info-soft text-info';
  const what = inv.periodStart ? `for ${date(inv.periodStart)} – ${date(inv.periodEnd)}` : `dated ${date(inv.invoiceDate)}`;
  return (
    <section className={`no-print mx-auto mb-6 flex max-w-[860px] flex-wrap items-center gap-4 rounded-[20px] border p-5 ${tone}`}>
      <Icon className="size-7 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1 text-ink">
        <p className="text-lg font-semibold">
          {paid ? `Paid in full${lastPay ? ` on ${date(lastPay.paymentDate)}` : ''}` : `${money(inv.outstanding)} to pay ${inv.isOverdue ? `— it was due ${date(inv.dueDate)}` : `by ${date(inv.dueDate)}`}`}
        </p>
        <p className="text-sm text-muted">Your bill {what}{inv.subscription?.plan ? ` · ${inv.subscription.plan.name}` : ''}. Total {money(inv.total)} including tax{Number(inv.amountPaid) > 0 && !paid ? `, ${money(inv.amountPaid)} already paid` : ''}.</p>
      </div>
      {!paid && inv.outstanding > 0 && <Button icon={CreditCard} onClick={onPay}>Pay now</Button>}
    </section>
  );
}

export default function PortalInvoiceDetail() {
  const { id } = useParams();
  const { record: inv, isLoading, error } = useRecord(['portal', 'invoice', id], () => portalApi.invoice(id));
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState('CARD');
  const pay = useAction(() => portalApi.pay(id, method), { success: 'Payment received — thank you', invalidate: ['portal'], onSuccess: () => setOpen(false) });

  if (isLoading) return <Spinner />;
  if (error) return <EmptyState title="We couldn't find this invoice" description={error.message} />;
  return (
    <>
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link to="/portal/invoices" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft className="size-4" />Bills & payments</Link>
        <div className="flex gap-2">
          <Button variant="secondary" icon={Printer} onClick={() => window.print()}>Print or save PDF</Button>
          {inv.status === 'CONFIRMED' && inv.outstanding > 0 && <Button icon={CreditCard} onClick={() => setOpen(true)}>Pay {money(inv.outstanding)}</Button>}
        </div>
      </div>
      <Summary inv={inv} onPay={() => setOpen(true)} />
      <InvoiceDocument invoice={inv} />
      <Modal open={open} onClose={() => setOpen(false)} title={`Pay ${money(inv.outstanding)}`} description={`Bill ${inv.number} · due ${date(inv.dueDate)}`} size="sm"
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Not now</Button><Button loading={pay.isPending} onClick={() => pay.mutate()}>Pay {money(inv.outstanding)}</Button></>}>
        <fieldset>
          <legend className="label">How would you like to pay?</legend>
          <div className="grid gap-2">
            {METHODS.map((m) => (
              <label key={m.value} className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 ${method === m.value ? 'border-brand bg-brand-soft' : 'border-line'}`}>
                <input type="radio" name="method" value={m.value} checked={method === m.value} onChange={() => setMethod(m.value)} className="accent-[rgb(var(--brand))]" />{m.label}
              </label>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">Demo checkout — no real money is charged.</p>
        </fieldset>
      </Modal>
    </>
  );
}
