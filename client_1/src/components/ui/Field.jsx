import { useId } from 'react';
import clsx from 'clsx';

/** Label + control + hint/error, wired with aria. Every input in the app goes through Field. */
export function Field({ label, error, hint, required, className, children }) {
  const id = useId();
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  const control = typeof children === 'function' ? children({ id, 'aria-invalid': !!error || undefined, 'aria-describedby': describedBy }) : children;
  return (
    <div className={className}>
      {label && <label htmlFor={id} className="label">{label}{required && <span className="text-bad" aria-hidden> *</span>}</label>}
      {control}
      {error ? <p id={`${id}-err`} role="alert" className="mt-1 text-sm text-bad">{error}</p>
        : hint ? <p id={`${id}-hint`} className="mt-1 text-sm text-muted">{hint}</p> : null}
    </div>
  );
}

export const Input = ({ label, error, hint, required, className, ...props }) => (
  <Field label={label} error={error} hint={hint} required={required} className={className}>
    {(a) => <input className="input" required={required} {...a} {...props} />}
  </Field>
);

export const Select = ({ label, error, hint, required, className, options = [], placeholder, ...props }) => (
  <Field label={label} error={error} hint={hint} required={required} className={className}>
    {(a) => (
      <select className="input pr-8" required={required} {...a} {...props}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    )}
  </Field>
);

export const Textarea = ({ label, error, hint, className, ...props }) => (
  <Field label={label} error={error} hint={hint} className={className}>
    {(a) => <textarea className="input h-auto min-h-[80px] py-2" {...a} {...props} />}
  </Field>
);

export const Checkbox = ({ label, hint, className, ...props }) => (
  <label className={clsx('flex items-start gap-2.5 cursor-pointer select-none', className)}>
    <input type="checkbox" className="mt-0.5 size-4 rounded border-line accent-[rgb(var(--brand))]" {...props} />
    <span><span className="text-base text-ink">{label}</span>{hint && <span className="block text-sm text-muted">{hint}</span>}</span>
  </label>
);
