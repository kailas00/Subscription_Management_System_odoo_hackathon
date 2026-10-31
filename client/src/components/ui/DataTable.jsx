import clsx from 'clsx';
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { EmptyState } from './Page.jsx';
import { Button } from './Button.jsx';

/**
 * columns=[{ key, header, render?, align?, className?, width? }]
 * ≥640px: a real table. <640px: each row becomes a card — first column is the title, the rest are label/value pairs,
 * columns without a header (row actions) sit at the bottom. No sideways scrolling on phones.
 */
export function DataTable({ columns, rows, meta, loading, error, onPage, onRowClick, empty, rowKey = 'id', dense }) {
  const cell = dense ? 'px-4 py-2.5' : 'px-4 py-3.5';
  const value = (c, r) => (c.render ? c.render(r) : r[c.key] ?? '—');
  const select = columns.find((c) => c.key === 'select');
  const visible = columns.filter((c) => c.key !== 'select');
  const [title, ...rest] = visible;
  const fields = rest.filter((c) => c.header);
  const actions = rest.filter((c) => !c.header);
  const rowProps = (r) => (onRowClick ? {
    onClick: () => onRowClick(r), onKeyDown: (e) => e.key === 'Enter' && onRowClick(r), tabIndex: 0,
  } : {});

  return (
    <div className="card overflow-hidden">
      {/* Desktop / tablet */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-line bg-ground/60">
              {columns.map((c) => (
                <th key={c.key} scope="col" style={c.width ? { width: c.width } : undefined}
                  className={clsx(dense ? 'px-4 py-2' : 'px-4 py-2.5', 'whitespace-nowrap text-xs font-medium text-muted', c.align === 'right' && 'text-right', c.headerClassName)}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && !rows?.length
              ? Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-line last:border-0">
                  {columns.map((c) => <td key={c.key} className={cell}><div className="h-3.5 w-3/4 animate-pulse rounded bg-sunken" /></td>)}
                </tr>
              ))
              : rows?.map((r) => (
                <tr key={r[rowKey]} {...rowProps(r)}
                  className={clsx('border-b border-line last:border-0 transition-colors duration-quick', onRowClick && 'cursor-pointer hover:bg-ground focus-visible:bg-ground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand')}>
                  {columns.map((c) => (
                    <td key={c.key} className={clsx(cell, 'text-base align-middle', c.align === 'right' && 'text-right', c.className)}>{value(c, r)}</td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Phone */}
      <ul className="divide-y divide-line sm:hidden">
        {loading && !rows?.length && Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="space-y-2 p-4"><div className="h-4 w-1/2 animate-pulse rounded bg-sunken" /><div className="h-3 w-3/4 animate-pulse rounded bg-sunken" /></li>
        ))}
        {rows?.map((r) => (
          <li key={r[rowKey]} {...rowProps(r)}
            className={clsx('flex gap-3 p-4', onRowClick && 'cursor-pointer active:bg-ground focus-visible:bg-ground focus-visible:outline-none')}>
            {select && <div className="pt-0.5">{value(select, r)}</div>}
            <div className="min-w-0 flex-1">
              {title && <div className="text-base font-medium">{value(title, r)}</div>}
              {fields.length > 0 && (
                <dl className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2">
                  {fields.map((c) => (
                    <div key={c.key} className="min-w-0">
                      <dt className="text-xs text-muted">{c.header}</dt>
                      <dd className="truncate text-sm">{value(c, r)}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {actions.length > 0 && <div className="mt-3 flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>{actions.map((c) => <span key={c.key}>{value(c, r)}</span>)}</div>}
            </div>
          </li>
        ))}
      </ul>

      {error && <EmptyState icon={AlertTriangle} title="Couldn't load this list" description={error.message} />}
      {!loading && !error && rows?.length === 0 && <EmptyState {...empty} />}
      {meta && meta.totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2.5 text-sm text-muted">
          <span className="tabular">Showing <b className="font-medium text-ink">{(meta.page - 1) * meta.pageSize + 1}–{Math.min(meta.page * meta.pageSize, meta.total)}</b> of {meta.total.toLocaleString('en-IN')}</span>
          <div className="flex gap-1">
            <Button size="sm" variant="secondary" icon={ChevronLeft} disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>Previous</Button>
            <Button size="sm" variant="secondary" disabled={meta.page >= meta.totalPages} onClick={() => onPage(meta.page + 1)}>Next<ChevronRight className="size-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}
