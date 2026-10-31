import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Printer, Send, Wallet, XCircle } from 'lucide-react';
import { invoicesApi, paymentsApi } from '../../api/endpoints.js';
import { fieldErrors } from '../../api/client.js';
import { useAction, useRecord } from '../../hooks/useApi.js';
import { PAYMENT_METHODS } from '../../lib/constants.js';
import { date, money, toInputDate } from '../../lib/format.js';
import { Button, Card, ConfirmDialog, EmptyState, Input, Modal, Money, Select, Spinner, Textarea } from '../../components/ui/index.js';
import { InvoiceDocument } from '../../components/ops/InvoiceDocument.jsx';

export default function InvoiceDetail() {
  const { id } = useParams();
  const { record: inv, isLoading, error } = useRecord(['invoice', id], () => invoicesApi.get(id));
  const [payOpen, setPayOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [pay, setPay] = useState({});
  const [errors, setErrors] = useState({});
  const inval = ['invoice', 'invoices', 'payments', 'subscription'];

  const confirm = useAction(() => invoicesApi.confirm(id), { success: 'Invoice confirmed', invalidate: inval });
  const send = useAction(() => invoicesApi.send(id), { success: (r) => (r.meta?.email?.delivered === false ? 'Marked as sent (email printed in the server console)' : `Sent to ${inv.customer.email}`), invalidate: inval });
  const cancel = useAction(() => invoicesApi.cancel(id, reason || undefined), { success: 'Invoice cancelled', invalidate: inval, onSuccess: () => setCancelOpen(false) });
  const record = useAction((body) => paymentsApi.create(body), {
    success: (r) => (r.data.invoice.status === 'PAID' ? 'Payment recorded — invoice fully paid' : 'Payment recorded'), invalidate: inval, onSuccess: () => setPayOpen(false),
  });

  if (isLoading) return <Spinner />;
  if (error) return <EmptyState title="Couldn't load this invoice" description={error.message} />;

  const openPay = () => { setErrors({}); setPay({ method: 'BANK_TRANSFER', amount: inv.outstanding, paymentDate: toInputDate(new Date()), note: '' }); setPayOpen(true); };
  const submitPay = (e) => {
    e.preventDefault();
    if (!(Number(pay.amount) > 0)) return setErrors({ amount: 'Enter an amount greater than 0' });
    if (Number(pay.amount) > inv.outstanding) return setErrors({ amount: `Amount exceeds the outstanding balance of ${money(inv.outstanding)}` });
    record.mutate({ invoiceId: inv.id, method: pay.method, amount: Number(pay.amount), paymentDate: pay.paymentDate, note: pay.note || null },
      { onError: (err) => setErrors(fieldErrors(err)) });
  };

  return (
    <>
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link to="/invoices" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft className="size-4" />Invoices</Link>
        <div className="flex flex-wrap gap-2">
          {inv.status === 'DRAFT' && <Button variant="secondary" icon={CheckCircle2} loading={confirm.isPending} onClick={() => confirm.mutate()}>Confirm</Button>}
          {['DRAFT', 'CONFIRMED', 'PAID'].includes(inv.status) && <Button variant="secondary" icon={Send} loading={send.isPending} onClick={() => send.mutate()}>{inv.sentAt ? 'Send again' : 'Send to customer'}</Button>}
          <Button variant="secondary" icon={Printer} onClick={() => window.print()}>Print</Button>
          {['DRAFT', 'CONFIRMED'].includes(inv.status) && Number(inv.amountPaid) === 0 && <Button variant="danger-ghost" icon={XCircle} onClick={() => setCancelOpen(true)}>Cancel invoice</Button>}
          {inv.status === 'CONFIRMED' && <Button icon={Wallet} onClick={openPay}>Record payment</Button>}
        </div>
      </div>

      {inv.sentAt && <p className="no-print mb-3 text-center text-sm text-muted">Sent {date(inv.sentAt)}</p>}
      <InvoiceDocument invoice={inv} />

      <Card className="no-print mx-auto mt-6 max-w-[860px]" title="Payments">
        {inv.payments.length === 0 ? <p className="text-base text-muted">No payments recorded yet.</p> : (
          <ul className="divide-y divide-line">
            {inv.payments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div>
                  <p className="text-base"><span className="doc-no">{p.number}</span> · {PAYMENT_METHODS.find((m) => m.value === p.method)?.label}</p>
                  <p className="text-sm text-muted">{date(p.paymentDate)}{p.recordedBy ? ` · recorded by ${p.recordedBy.name}` : ''}{p.note ? ` · ${p.note}` : ''}</p>
                </div>
                <Money className="font-medium" value={p.amount} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={payOpen} onClose={() => setPayOpen(false)} title={`Record payment · ${inv.number}`} description={`Outstanding balance ${money(inv.outstanding)}`} size="sm"
        footer={<><Button variant="secondary" onClick={() => setPayOpen(false)}>Cancel</Button><Button type="submit" form="pay-form" loading={record.isPending}>Record payment</Button></>}>
        <form id="pay-form" onSubmit={submitPay} className="space-y-4" noValidate>
          <Select label="Method" value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })} options={PAYMENT_METHODS} />
          <Input label="Amount" type="number" min="0.01" step="0.01" required value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} error={errors.amount}
            hint="Enter less than the balance for a partial payment" />
          <Input label="Payment date" type="date" required max={toInputDate(new Date())} value={pay.paymentDate} onChange={(e) => setPay({ ...pay, paymentDate: e.target.value })} error={errors.paymentDate} />
          <Textarea label="Note" value={pay.note} onChange={(e) => setPay({ ...pay, note: e.target.value })} placeholder="e.g. UTR / cheque number" />
        </form>
      </Modal>

      <ConfirmDialog open={cancelOpen} onClose={() => setCancelOpen(false)} danger loading={cancel.isPending} title={`Cancel ${inv.number}?`} confirmLabel="Cancel invoice"
        message={<>The customer will no longer be asked to pay it. This cannot be undone.<Textarea className="mt-4" label="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} /></>}
        onConfirm={() => cancel.mutate()} />
    </>
  );
}
