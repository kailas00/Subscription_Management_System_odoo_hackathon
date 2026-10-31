import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-brand text-white hover:bg-brand-strong shadow-sm',
  secondary: 'bg-surface text-ink border border-line hover:bg-sunken',
  ghost: 'text-muted hover:text-ink hover:bg-sunken',
  danger: 'bg-bad text-white hover:bg-bad/90',
  'danger-ghost': 'text-bad hover:bg-bad-soft',
};
const sizes = { sm: 'h-8 px-2.5 text-sm gap-1.5', md: 'h-9 px-3.5 text-base gap-2', lg: 'h-11 px-5 text-md gap-2' };

/** <Button icon={Plus} loading={m.isPending}>New subscription</Button> — always name the action. */
export function Button({ variant = 'primary', size = 'md', icon: Icon, loading, disabled, className, children, type = 'button', ...rest }) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={clsx('inline-flex items-center justify-center rounded font-medium whitespace-nowrap transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed', variants[variant], sizes[size], className)}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : Icon && <Icon className="size-4" aria-hidden />}
      {children}
    </button>
  );
}

export function IconButton({ icon: Icon, label, className, ...rest }) {
  return (
    <button type="button" aria-label={label} title={label}
      className={clsx('inline-flex size-8 items-center justify-center rounded text-muted hover:bg-sunken hover:text-ink', className)} {...rest}>
      <Icon className="size-4" aria-hidden />
    </button>
  );
}
