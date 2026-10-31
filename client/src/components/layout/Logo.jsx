import { useId } from 'react';

/**
 * Brightloop mark: an open loop (a billing cycle that renews) with an emerald "renewal" dot,
 * on a navy tile. Wordmark set in Michroma, uppercase, widely tracked.
 * size: sm (sidebar, compact headers) · md (default) · lg (auth / landing)
 */
const SIZES = { sm: { mark: 30, text: 'text-[13px]' }, md: { mark: 36, text: 'text-[15px]' }, lg: { mark: 46, text: 'text-[19px]' } };

export function LogoMark({ size = 36, onDark = false }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} role="img" aria-hidden className="shrink-0">
      <defs>
        <linearGradient id={`t${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={onDark ? '#2B4C78' : '#1E3A5F'} />
          <stop offset="1" stopColor={onDark ? '#14294A' : '#0B1A2E'} />
        </linearGradient>
        <linearGradient id={`r${id}`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.75" />
          <stop offset="1" stopColor="#FFFFFF" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill={`url(#t${id})`} />
      <rect x="0.5" y="0.5" width="39" height="39" rx="10.5" fill="none" stroke="#FFFFFF" strokeOpacity="0.14" />
      <path d="M27.6 13.4A10 10 0 1 0 30 20" fill="none" stroke={`url(#r${id})`} strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="29.2" cy="12.4" r="2.9" fill="#34D399" />
      <circle cx="29.2" cy="12.4" r="5.2" fill="#34D399" opacity="0.18" />
    </svg>
  );
}

export function Logo({ light = false, compact = false, size = 'md' }) {
  const s = SIZES[size] ?? SIZES.md;
  return (
    <span className="inline-flex items-center gap-3" aria-label="Brightloop">
      <LogoMark size={s.mark} onDark={light} />
      {!compact && <span className={`wordmark leading-none ${s.text} ${light ? 'text-white' : 'text-ink'}`}>Brightloop</span>}
    </span>
  );
}
