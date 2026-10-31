import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';
import { Button } from './Button.jsx';

const EXIT_MS = 160; // exits are faster than enters (emil-design-eng)

/**
 * Native <dialog>: focus trap, Esc, scrim click.
 * Default = centred dialog for short tasks. `sheet` = right-hand panel for long forms (slides in and back out the same way).
 */
export function Modal({ open, onClose, title, description, children, footer, size = 'md', sheet = false }) {
  const ref = useRef(null);
  const [closing, setClosing] = useState(false);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) { setClosing(false); d.showModal(); }
    if (!open && d.open) {
      setClosing(true);
      const t = setTimeout(() => { d.close(); setClosing(false); }, EXIT_MS);
      return () => clearTimeout(t);
    }
  }, [open]);

  const requestClose = useCallback((e) => { e?.preventDefault?.(); onClose(); }, [onClose]);

  return (
    <dialog ref={ref} onCancel={requestClose} onClick={(e) => e.target === ref.current && onClose()} aria-labelledby={titleId}
      className={clsx('bg-surface p-0 text-ink shadow-pop backdrop:bg-rail/45',
        'backdrop:transition-opacity backdrop:duration-quick',
        closing && 'pointer-events-none backdrop:opacity-0',
        sheet
          ? 'm-0 ml-auto h-dvh max-h-dvh w-full max-w-[min(42rem,100vw)] border-l border-line animate-sheet-in'
          : clsx('w-[calc(100%-2rem)] rounded-xl border border-line animate-dialog-in', { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' }[size]),
        closing && (sheet ? 'motion-move translate-x-full transition-transform duration-quick ease-out' : 'motion-move scale-[0.98] opacity-0 transition-[opacity,transform] duration-quick ease-out'))}>
      {(open || closing) && (
        <div className={clsx('flex flex-col', sheet ? 'h-full' : 'max-h-[85vh]')}>
          <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
              {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
            </div>
            <button onClick={onClose} aria-label="Close" className="pressable -mr-1.5 rounded-md p-1.5 text-muted hover:bg-sunken hover:text-ink"><X className="size-4" /></button>
          </header>
          <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
          {footer && <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-ground/70 px-6 py-3.5">{footer}</footer>}
        </div>
      )}
    </dialog>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger, loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={<><Button variant="secondary" onClick={onClose}>Keep as is</Button>
        <Button variant={danger ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>{confirmLabel}</Button></>}>
      <div className="text-base text-muted">{message}</div>
    </Modal>
  );
}
