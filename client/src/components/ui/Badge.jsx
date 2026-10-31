import clsx from 'clsx';
import { STATUS, CUSTOMER_STATUS } from '../../lib/constants.js';

const tones = {
  neutral: 'bg-sunken text-muted ring-line', ok: 'bg-ok-soft text-ok ring-ok/15', warn: 'bg-warn-soft text-warn ring-warn/15',
  bad: 'bg-bad-soft text-bad ring-bad/15', info: 'bg-info-soft text-info ring-info/15', accent: 'bg-accent-soft text-accent ring-accent/15',
  brand: 'bg-brand-soft text-brand ring-brand/15',
};

export function Badge({ tone = 'neutral', children, className, dot = true }) {
  return (
    <span className={clsx('inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset', tones[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}{children}
    </span>
  );
}

/** customer: plain-language labels for the portal; invoice: an open (CONFIRMED) invoice reads "To pay". */
export function StatusBadge({ status, overdue, customer, invoice }) {
  const map = customer ? CUSTOMER_STATUS : STATUS;
  const key = overdue ? 'OVERDUE' : customer && invoice && status === 'CONFIRMED' ? 'INVOICE_OPEN' : status;
  const s = map[key] || STATUS[key] || { label: status, tone: 'neutral' };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}
