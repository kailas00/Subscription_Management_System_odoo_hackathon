import clsx from 'clsx';
import { Search, Inbox, Loader2 } from 'lucide-react';
import { money } from '../../lib/format.js';

export function PageHeader({ title, description, actions, back }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {back}
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        {description && <p className="mt-1.5 max-w-[68ch] text-md text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, description, actions, children, className, padded = true }) {
  return (
    <section className={clsx('card', className)}>
      {title && (
        <header className="flex items-start justify-between gap-3 px-5 pb-1 pt-4">
          <div><h2 className="text-md font-semibold">{title}</h2>{description && <p className="mt-0.5 text-sm text-muted">{description}</p>}</div>
          {actions}
        </header>
      )}
      <div className={padded ? 'p-5' : undefined}>{children}</div>
    </section>
  );
}

export function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', description, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <span className="mb-4 flex size-11 items-center justify-center rounded-full bg-sunken ring-8 ring-ground"><Icon className="size-5 text-muted" strokeWidth={1.8} aria-hidden /></span>
      <p className="text-md font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-base text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export const Spinner = ({ label = 'Loading' }) => (
  <div role="status" className="flex items-center justify-center gap-2 py-16 text-muted">
    <Loader2 className="size-5 animate-spin" aria-hidden /><span className="text-base">{label}…</span>
  </div>
);

export function SearchInput({ value, onChange, placeholder = 'Search', className }) {
  return (
    <div className={clsx('relative w-full max-w-xs', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden />
      <input type="search" aria-label={placeholder} className="input pl-9" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function Tabs({ items, value, onChange }) {
  return (
    <div role="tablist" className="-mx-4 flex max-w-[100vw] overflow-x-auto px-4 sm:mx-0 sm:max-w-none sm:overflow-visible [scrollbar-width:none]">
      <div className="inline-flex shrink-0 gap-0.5 rounded-lg border border-line bg-surface p-1 shadow-card">
      {items.map((it) => (
        <button key={it.value} role="tab" aria-selected={value === it.value} onClick={() => onChange(it.value)}
          className={clsx('inline-flex h-8 items-center whitespace-nowrap rounded-md px-3 text-sm font-medium transition-colors duration-quick ease-out',
            value === it.value ? 'bg-ink text-white' : 'text-muted hover:bg-sunken hover:text-ink')}>
          {it.label}
          {it.count !== undefined && <span className={clsx('ml-1.5 rounded px-1 text-xs tabular', value === it.value ? 'bg-white/15 text-white' : 'bg-sunken text-muted')}>{it.count}</span>}
        </button>
      ))}
      </div>
    </div>
  );
}

export const Toolbar = ({ children }) => <div className="mb-4 flex flex-wrap items-center gap-3">{children}</div>;

export const Money = ({ value, className, muted }) => (
  <span className={clsx('tabular whitespace-nowrap', muted && 'text-muted', className)}>{money(value)}</span>
);

export function DescriptionList({ items, cols = 2 }) {
  return (
    <dl className={clsx('grid gap-x-6 gap-y-4', cols === 3 ? 'sm:grid-cols-3' : cols === 1 ? '' : 'sm:grid-cols-2')}>
      {items.filter(Boolean).map(([k, v]) => (
        <div key={k}><dt className="text-sm text-muted">{k}</dt><dd className="mt-0.5 text-base text-ink">{v ?? '—'}</dd></div>
      ))}
    </dl>
  );
}

const AVATAR_TONES = ['bg-brand-soft text-brand', 'bg-info-soft text-info', 'bg-accent-soft text-accent', 'bg-ok-soft text-ok', 'bg-bad-soft text-bad', 'bg-sunken text-ink'];
/** Initials avatar — stable colour per name */
export function Avatar({ name = '', size = 'md' }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  const tone = AVATAR_TONES[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_TONES.length];
  return <span aria-hidden className={clsx('inline-flex shrink-0 items-center justify-center rounded-full font-semibold', tone, size === 'sm' ? 'size-6 text-[10px]' : 'size-8 text-xs')}>{initials}</span>;
}

export const Person = ({ name, sub }) => (
  <span className="flex items-center gap-2.5 min-w-0">
    <Avatar name={name} />
    <span className="min-w-0"><span className="block truncate font-medium text-ink">{name}</span>{sub && <span className="block truncate text-xs text-muted">{sub}</span>}</span>
  </span>
);
