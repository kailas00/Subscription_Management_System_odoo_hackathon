import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';
import { Button } from './Button.jsx';

/** Native <dialog>: focus trap, Esc to close, backdrop click to close. Use for short forms only. */
export function Modal({ open, onClose, title, description, children, footer, size = 'md' }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} onClose={onClose} onClick={(e) => e.target === ref.current && onClose()}
      className={clsx('w-[calc(100%-2rem)] rounded-lg bg-surface p-0 text-ink shadow-pop backdrop:bg-ink/40',
        { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' }[size])}>
      {open && (
        <div className="flex max-h-[85vh] flex-col">
          <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold">{title}</h2>
              {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
            </div>
            <button onClick={onClose} aria-label="Close" className="rounded p-1 text-muted hover:bg-sunken hover:text-ink"><X className="size-4" /></button>
          </header>
          <div className="overflow-y-auto px-5 py-4">{children}</div>
          {footer && <footer className="flex justify-end gap-2 border-t border-line bg-ground/60 px-5 py-3">{footer}</footer>}
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
