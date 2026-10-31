// Ctrl/⌘+K quick jump to any page.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { CornerDownLeft, Search } from 'lucide-react';

export function useCommandMenu() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen((o) => !o); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return [open, setOpen];
}

export function CommandMenu({ open, onClose, items }) {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [i, setI] = useState(0);
  const input = useRef(null);
  const results = useMemo(() => items.filter((x) => `${x.label} ${x.group || ''} ${x.keywords || ''}`.toLowerCase().includes(q.toLowerCase())), [items, q]);
  useEffect(() => { if (open) { setQ(''); setI(0); setTimeout(() => input.current?.focus(), 0); } }, [open]);
  useEffect(() => setI(0), [q]);
  if (!open) return null;
  const go = (x) => { onClose(); nav(x.to); };
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-rail/45 px-4 pt-[14vh]" onClick={onClose}>
      <div role="dialog" aria-label="Jump to" className="w-full max-w-lg overflow-hidden rounded-xl border border-line bg-surface shadow-pop" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="size-4 text-faint" aria-hidden />
          <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Jump to a page…" aria-label="Jump to a page"
            className="h-12 flex-1 bg-transparent text-md outline-none placeholder:text-faint"
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setI((n) => Math.min(n + 1, results.length - 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setI((n) => Math.max(n - 1, 0)); }
              if (e.key === 'Enter' && results[i]) go(results[i]);
              if (e.key === 'Escape') onClose();
            }} />
          <kbd className="rounded border border-line px-1.5 py-0.5 font-mono text-[11px] text-muted">Esc</kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto p-2" role="listbox">
          {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">No page matches “{q}”</li>}
          {results.map((x, n) => (
            <li key={x.to} role="option" aria-selected={n === i}>
              <button onMouseEnter={() => setI(n)} onClick={() => go(x)}
                className={clsx('flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-base', n === i ? 'bg-sunken text-ink' : 'text-muted')}>
                <x.icon className="size-4" strokeWidth={1.8} aria-hidden /><span className="flex-1">{x.label}</span>
                {x.group && <span className="text-xs text-faint">{x.group}</span>}
                {n === i && <CornerDownLeft className="size-3.5 text-faint" aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
