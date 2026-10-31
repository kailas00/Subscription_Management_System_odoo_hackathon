export function Logo({ light }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
        <rect width="32" height="32" rx="8" fill={light ? '#e2eeea' : '#10302c'} />
        <circle cx="16" cy="16" r="8" fill="none" stroke="#67c2ae" strokeWidth="3.5" strokeDasharray="38 12.3" strokeLinecap="round" transform="rotate(-50 16 16)" />
      </svg>
      <span className={light ? 'text-md font-semibold text-rail-ink' : 'text-md font-semibold text-ink'}>Brightloop</span>
    </span>
  );
}
