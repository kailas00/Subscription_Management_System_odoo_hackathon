import clsx from 'clsx';
import { Check, Circle } from 'lucide-react';
import { PASSWORD_RULES } from '../../lib/constants.js';

export const passwordOk = (p) => PASSWORD_RULES.every((r) => r.test(p));

export function PasswordRules({ value }) {
  return (
    <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1" aria-label="Password requirements">
      {PASSWORD_RULES.map((r) => {
        const ok = r.test(value);
        return (
          <li key={r.label} className={clsx('flex items-center gap-1.5 text-xs', ok ? 'text-ok' : 'text-muted')}>
            {ok ? <Check className="size-3.5" aria-hidden /> : <Circle className="size-3" aria-hidden />}{r.label}
            <span className="sr-only">{ok ? '(met)' : '(not met)'}</span>
          </li>
        );
      })}
    </ul>
  );
}
