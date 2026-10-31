// Printable invoice. Used by staff (InvoiceDetail) and customers (portal). Prints cleanly with window.print().
import { date, money } from '../../lib/format.js';
import { StatusBadge } from '../ui/index.js';
import { Logo } from '../layout/Logo.jsx';

export function InvoiceDocument({ invoice: inv }) {
  const c = inv.customer;
  return (
    <article className="card mx-auto max-w-[860px] p-6 sm:p-10 print:max-w-none print:p-0">
      <header className="flex flex-wrap items-start justify-between gap-6 border-b border-line pb-6">
        <div>
          <Logo size="sm" />
          <p className="mt-3 text-sm text-muted">Brightloop Software<br />billing@brightloop.dev</p>
        </div>
        <div className="text-right">
          <h1 className="text-xl font-semibold">Invoice</h1>
          <p className="doc-no mt-1 text-md">{inv.number}</p>
          <div key={`${inv.status}-${inv.isOverdue}`} className="mt-2 animate-swap-in"><StatusBadge status={inv.status} overdue={inv.isOverdue} /></div>
        </div>
      </header>

      <section className="grid gap-6 py-6 sm:grid-cols-3">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Bill to</h2>
          <p className="mt-1.5 font-medium">{c.name}</p>
          <p className="text-sm text-muted">{[c.company !== c.name && c.company, c.address, c.city, c.country].filter(Boolean).join(', ')}</p>
          <p className="text-sm text-muted">{c.email}</p>
          {c.gstin && <p className="text-sm text-muted">GSTIN {c.gstin}</p>}
        </div>
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between gap-4"><dt className="text-muted">Invoice date</dt><dd>{date(inv.invoiceDate)}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted">Due date</dt><dd className={inv.isOverdue ? 'font-medium text-bad' : ''}>{date(inv.dueDate)}</dd></div>
          {inv.subscription && <div className="flex justify-between gap-4"><dt className="text-muted">Subscription</dt><dd className="doc-no">{inv.subscription.number}</dd></div>}
        </dl>
        {inv.periodStart && (
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-muted">Service period</dt><dd>{date(inv.periodStart)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">to</dt><dd>{date(inv.periodEnd)}</dd></div>
            {inv.subscription?.plan && <div className="flex justify-between gap-4"><dt className="text-muted">Plan</dt><dd>{inv.subscription.plan.name}</dd></div>}
          </dl>
        )}
      </section>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left">
          <thead>
            <tr className="border-y border-line text-xs font-semibold uppercase tracking-wide text-muted">
              <th className="py-2 pr-3">Description</th><th className="py-2 px-3 text-right">Qty</th><th className="py-2 px-3 text-right">Unit price</th>
              <th className="py-2 px-3 text-right">Discount</th><th className="py-2 px-3 text-right">Tax</th><th className="py-2 pl-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {inv.lines.map((l) => (
              <tr key={l.id} className="border-b border-line">
                <td className="py-2.5 pr-3">{l.description}</td>
                <td className="py-2.5 px-3 text-right">{l.quantity}</td>
                <td className="py-2.5 px-3 text-right">{money(l.unitPrice)}</td>
                <td className="py-2.5 px-3 text-right">{Number(l.discountAmount) ? `−${money(l.discountAmount)}` : '—'}</td>
                <td className="py-2.5 px-3 text-right">{l.taxName ? <>{money(l.taxAmount)}<span className="block text-xs text-muted">{l.taxName}</span></> : '—'}</td>
                <td className="py-2.5 pl-3 text-right font-medium">{money(l.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="ml-auto mt-5 w-full max-w-xs space-y-1.5 text-base">
        <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="tabular">{money(inv.subtotal)}</dd></div>
        {Number(inv.discountTotal) > 0 && <div className="flex justify-between"><dt className="text-muted">Discount</dt><dd className="tabular">−{money(inv.discountTotal)}</dd></div>}
        <div className="flex justify-between"><dt className="text-muted">Tax</dt><dd className="tabular">{money(inv.taxTotal)}</dd></div>
        <div className="flex justify-between border-t border-line pt-1.5 font-semibold"><dt>Total</dt><dd className="tabular">{money(inv.total)}</dd></div>
        {Number(inv.amountPaid) > 0 && <div className="flex justify-between"><dt className="text-muted">Paid</dt><dd className="tabular">−{money(inv.amountPaid)}</dd></div>}
        <div className="flex justify-between rounded-md bg-sunken px-3 py-2 text-md font-semibold"><dt>Balance due</dt><dd className="tabular">{money(inv.outstanding)}</dd></div>
      </dl>
      {inv.notes && <p className="mt-6 whitespace-pre-line text-sm text-muted">{inv.notes}</p>}
      <p className="mt-10 text-center text-xs text-faint">Thank you for your business.</p>
    </article>
  );
}
