import clsx from 'clsx';
import { Search, Inbox, Loader2 } from 'lucide-react';
import { money } from '../../lib/format.js';

/** Page title row. No eyebrow labels — the title carries the page. */
export function PageHeader({ title, description, actions, back }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {back}
        <h1 className="text-2xl font-semibold text-ink">{title}</h1>
        {description && <p className="mt-1 max-w-[65ch] text-base text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, actions, children, className, padded = true }) {
  return (
    <section className={clsx('card', className)}>
      {title && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h2 className="text-md font-semibold">{title}</h2>{actions}
        </header>
      )}
      <div className={padded ? 'p-5' : undefined}>{children}</div>
    </section>
  );
}

export function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', description, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <Icon className="mb-3 size-8 text-faint" aria-hidden />
      <p className="text-md font-medium text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-base text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export const Spinner = ({ label = 'Loading' }) => (
  <div role="status" className="flex items-center justify-center gap-2 py-16 text-muted">
    <Loader2 className="size-5 animate-spin" aria-hidden /><span className="text-base">{label}…</span>
  </div>
);

/** Debounce-free search box (server is fast; pages pass value/onChange from useTable) */
export function SearchInput({ value, onChange, placeholder = 'Search', className }) {
  return (
    <div className={clsx('relative w-full max-w-xs', className)}>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden />
      <input type="search" aria-label={placeholder} className="input pl-8" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/** Segmented filter: <Tabs value={s} onChange={setS} items={[{ value: '', label: 'All', count }]} /> */
export function Tabs({ items, value, onChange }) {
  return (
    <div role="tablist" className="inline-flex flex-wrap gap-1 rounded-lg bg-sunken p-1">
      {items.map((it) => (
        <button key={it.value} role="tab" aria-selected={value === it.value} onClick={() => onChange(it.value)}
          className={clsx('rounded-md px-3 py-1 text-sm font-medium transition-colors',
            value === it.value ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink')}>
          {it.label}{it.count !== undefined && <span className="ml-1.5 tabular text-faint">{it.count}</span>}
        </button>
      ))}
    </div>
  );
}

export const Toolbar = ({ children }) => <div className="mb-4 flex flex-wrap items-center gap-3">{children}</div>;

export const Money = ({ value, className, muted }) => (
  <span className={clsx('tabular whitespace-nowrap', muted && 'text-muted', className)}>{money(value)}</span>
);

/** Label/value list for detail pages */
export function DescriptionList({ items, cols = 2 }) {
  return (
    <dl className={clsx('grid gap-x-6 gap-y-4', cols === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
      {items.filter(Boolean).map(([k, v]) => (
        <div key={k}><dt className="text-sm text-muted">{k}</dt><dd className="mt-0.5 text-base text-ink">{v ?? '—'}</dd></div>
      ))}
    </dl>
  );
}
