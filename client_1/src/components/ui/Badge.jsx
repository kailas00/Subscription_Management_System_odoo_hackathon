import clsx from 'clsx';
import { STATUS } from '../../lib/constants.js';

const tones = {
  neutral: 'bg-sunken text-muted', ok: 'bg-ok-soft text-ok', warn: 'bg-warn-soft text-warn',
  bad: 'bg-bad-soft text-bad', info: 'bg-info-soft text-info', accent: 'bg-accent-soft text-accent', brand: 'bg-brand-soft text-brand',
};

export function Badge({ tone = 'neutral', children, className }) {
  return (
    <span className={clsx('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap', tones[tone], className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />{children}
    </span>
  );
}

/** <StatusBadge status="ACTIVE" />  — pass overdue to override an invoice's CONFIRMED status. */
export function StatusBadge({ status, overdue }) {
  const s = overdue ? STATUS.OVERDUE : STATUS[status] || { label: status, tone: 'neutral' };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}
