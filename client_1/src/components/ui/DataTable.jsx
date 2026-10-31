import clsx from 'clsx';
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { EmptyState } from './Page.jsx';
import { Button } from './Button.jsx';

/**
 * <DataTable
 *   columns={[{ key: 'number', header: 'Number', render: (r) => r.number, align: 'right', className }]}
 *   rows={t.rows} meta={t.meta} loading={t.isLoading} error={t.error}
 *   onPage={(p) => t.setParam('page', p)} onRowClick={(r) => navigate(...)}
 *   empty={{ title: 'No subscriptions yet', action: <Button/> }} />
 */
export function DataTable({ columns, rows, meta, loading, error, onPage, onRowClick, empty, rowKey = 'id', dense }) {
  const cell = dense ? 'px-3 py-2' : 'px-4 py-3';
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line bg-ground/70">
              {columns.map((c) => (
                <th key={c.key} scope="col" className={clsx(cell, 'text-xs font-semibold uppercase tracking-wide text-muted', c.align === 'right' && 'text-right', c.headerClassName)}>
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
                <tr key={r[rowKey]}
                  onClick={onRowClick ? () => onRowClick(r) : undefined}
                  onKeyDown={onRowClick ? (e) => e.key === 'Enter' && onRowClick(r) : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  className={clsx('border-b border-line last:border-0 transition-colors', onRowClick && 'cursor-pointer hover:bg-brand-soft/40 focus-visible:bg-brand-soft/40')}>
                  {columns.map((c) => (
                    <td key={c.key} className={clsx(cell, 'text-base align-middle', c.align === 'right' && 'text-right', c.className)}>
                      {c.render ? c.render(r) : r[c.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {error && <EmptyState icon={AlertTriangle} title="Couldn't load this list" description={error.message} />}
      {!loading && !error && rows?.length === 0 && <EmptyState {...empty} />}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-line px-4 py-2.5 text-sm text-muted">
          <span className="tabular">{(meta.page - 1) * meta.pageSize + 1}–{Math.min(meta.page * meta.pageSize, meta.total)} of {meta.total.toLocaleString('en-IN')}</span>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" icon={ChevronLeft} disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>Previous</Button>
            <Button size="sm" variant="ghost" disabled={meta.page >= meta.totalPages} onClick={() => onPage(meta.page + 1)}>Next<ChevronRight className="size-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}
