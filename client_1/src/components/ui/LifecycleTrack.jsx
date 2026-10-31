// Signature element: where a subscription stands in its life, at a glance.
// Full size on detail pages, `compact` inside table rows.
import clsx from 'clsx';
import { Check, Pause, X } from 'lucide-react';
import { SUBSCRIPTION_FLOW, STATUS } from '../../lib/constants.js';

export function LifecycleTrack({ status, compact }) {
  const off = status === 'PAUSED' || status === 'CANCELLED';
  const at = SUBSCRIPTION_FLOW.indexOf(status === 'PAUSED' ? 'ACTIVE' : status);
  const reached = status === 'CANCELLED' ? -1 : at;

  if (compact) {
    return (
      <div className="flex items-center gap-0.5" aria-label={`Status: ${STATUS[status]?.label}`} role="img">
        {SUBSCRIPTION_FLOW.map((s, i) => (
          <span key={s} className={clsx('h-1.5 w-4 rounded-full',
            i <= reached ? (status === 'PAUSED' && i === at ? 'bg-warn' : status === 'CLOSED' ? 'bg-faint' : 'bg-brand') : 'bg-line')} />
        ))}
      </div>
    );
  }

  return (
    <ol className="flex w-full items-center" aria-label="Subscription lifecycle">
      {SUBSCRIPTION_FLOW.map((s, i) => {
        const done = i < reached || (i === reached && status === 'CLOSED');
        const current = i === reached && status !== 'CLOSED';
        return (
          <li key={s} className={clsx('flex items-center', i < SUBSCRIPTION_FLOW.length - 1 && 'flex-1')} aria-current={current ? 'step' : undefined}>
            <div className="flex flex-col items-center gap-1.5">
              <span className={clsx('flex size-7 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors',
                done && 'border-brand bg-brand text-white',
                current && !off && 'border-brand bg-brand-soft text-brand',
                current && status === 'PAUSED' && 'border-warn bg-warn-soft text-warn',
                !done && !current && 'border-line bg-surface text-faint')}>
                {done ? <Check className="size-3.5" /> : current && status === 'PAUSED' ? <Pause className="size-3.5" /> : i + 1}
              </span>
              <span className={clsx('text-xs font-medium', current || done ? 'text-ink' : 'text-faint')}>
                {current && status === 'PAUSED' ? 'Paused' : STATUS[s].label}
              </span>
            </div>
            {i < SUBSCRIPTION_FLOW.length - 1 && <span className={clsx('mx-2 mb-5 h-0.5 flex-1 rounded', i < reached ? 'bg-brand' : 'bg-line')} />}
          </li>
        );
      })}
      {status === 'CANCELLED' && (
        <li className="ml-4 flex items-center gap-1.5 text-sm font-medium text-bad"><X className="size-4" />Cancelled</li>
      )}
    </ol>
  );
}
