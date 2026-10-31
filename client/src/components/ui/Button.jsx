import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-brand text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.12),0_1px_2px_rgb(8_96_75/0.3)] hover:bg-brand-strong',
  secondary: 'bg-surface text-ink border border-line shadow-card hover:border-faint/40 hover:bg-ground',
  ghost: 'text-muted hover:text-ink hover:bg-sunken',
  danger: 'bg-bad text-white hover:bg-bad/90',
  'danger-ghost': 'text-bad hover:bg-bad-soft',
  dark: 'bg-ink text-white hover:bg-ink/90',
};
const sizes = { sm: 'h-9 px-3.5 text-sm gap-1.5', md: 'h-11 px-5 text-base gap-2', lg: 'h-12 px-6 text-md gap-2' };

/** Name the action: "Record payment", never "Submit". */
export function Button({ variant = 'primary', size = 'md', icon: Icon, loading, disabled, className, children, type = 'button', ...rest }) {
  return (
    <button type={type} disabled={disabled || loading} aria-busy={loading || undefined}
      className={clsx('pressable inline-flex items-center justify-center rounded font-semibold whitespace-nowrap select-none',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100', variants[variant], sizes[size], className)} {...rest}>
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : Icon && <Icon className="size-4 shrink-0" strokeWidth={1.9} aria-hidden />}
      {children}
    </button>
  );
}

export function IconButton({ icon: Icon, label, className, ...rest }) {
  return (
    <button type="button" aria-label={label} title={label}
      className={clsx('pressable inline-flex size-8 items-center justify-center rounded text-muted hover:bg-sunken hover:text-ink', className)} {...rest}>
      <Icon className="size-4" strokeWidth={1.9} aria-hidden />
    </button>
  );
}
