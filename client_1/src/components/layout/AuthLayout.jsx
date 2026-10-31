import { Outlet } from 'react-router-dom';
import { Logo } from './Logo.jsx';

export function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_480px]">
      <section className="relative hidden overflow-hidden bg-rail p-12 text-rail-ink lg:flex lg:flex-col lg:justify-between">
        <Logo light />
        <div className="max-w-md">
          <h1 className="text-2xl font-semibold text-white">Plans, subscriptions and recurring billing in one place.</h1>
          <p className="mt-3 text-md text-rail-muted">Every renewal on schedule, every invoice right the first time, and a clear view of what the business earns each month.</p>
        </div>
        <p className="text-sm text-rail-muted">Brightloop Software</p>
        {/* the "loop": geometry, not illustration */}
        <svg aria-hidden viewBox="0 0 400 400" className="pointer-events-none absolute -right-24 top-1/2 size-[420px] -translate-y-1/2 opacity-[0.12]">
          <circle cx="200" cy="200" r="150" fill="none" stroke="#67c2ae" strokeWidth="28" strokeDasharray="720 222" strokeLinecap="round" />
          <circle cx="200" cy="200" r="95" fill="none" stroke="#67c2ae" strokeWidth="10" strokeDasharray="6 14" />
        </svg>
      </section>
      <section className="flex items-center justify-center px-4 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <Outlet />
        </div>
      </section>
    </div>
  );
}
