import { Link, Outlet } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Logo } from './Logo.jsx';
import { StatusBadge } from '../ui/index.js';

// A real slice of the product (example data, labelled): what the team sees on billing day.
function ProductPreview() {
  const rows = [
    ['Saffron Hotels', 'INV/2026/00218', '₹24,780', 'PAID'],
    ['Pixel Forge', 'INV/2026/00219', '₹8,496', 'CONFIRMED'],
    ['Kaveri Foods', 'INV/2026/00220', '₹14,160', 'OVERDUE'],
  ];
  return (
    <div className="relative w-full max-w-md">
      <p className="mb-3 text-xs text-rail-muted">Example of a billing day</p>
      <div className="rounded-xl border border-white/10 bg-white/[0.06] p-5 shadow-pop backdrop-blur-md">
        <p className="text-sm text-rail-muted">Monthly recurring revenue</p>
        <div className="mt-1 flex items-end justify-between gap-4">
          <p className="text-3xl font-bold tracking-tight text-white tabular">₹4.82L</p>
          <span className="mb-1 rounded-full bg-signal/15 px-2.5 py-1 text-xs font-semibold text-signal">+6.4% this month</span>
        </div>
        <svg viewBox="0 0 300 64" className="mt-4 h-16 w-full" aria-hidden>
          <defs><linearGradient id="auth-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#34D399" stopOpacity=".35" /><stop offset="1" stopColor="#34D399" stopOpacity="0" /></linearGradient></defs>
          <path d="M0 52 L30 48 L60 50 L90 40 L120 42 L150 33 L180 35 L210 24 L240 26 L270 14 L300 10 L300 64 L0 64Z" fill="url(#auth-area)" />
          <path d="M0 52 L30 48 L60 50 L90 40 L120 42 L150 33 L180 35 L210 24 L240 26 L270 14 L300 10" fill="none" stroke="#34D399" strokeWidth="2.25" />
        </svg>
      </div>
      <div className="relative -mt-3 ml-8 rounded-xl border border-line bg-surface p-2 shadow-pop">
        {rows.map(([c, n, a, s]) => (
          <div key={n} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm">
            <span className="min-w-0 flex-1"><span className="block truncate font-semibold text-ink">{c}</span><span className="doc-no text-xs text-muted">{n}</span></span>
            <span className="tabular font-semibold text-ink">{a}</span>
            <StatusBadge status={s === 'OVERDUE' ? 'CONFIRMED' : s} overdue={s === 'OVERDUE'} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.1fr)_minmax(460px,0.9fr)]">
      <section className="relative hidden overflow-hidden bg-rail p-12 text-rail-ink lg:flex lg:flex-col">
        <Link to="/" className="relative self-start" aria-label="Brightloop home"><Logo light size="lg" /></Link>
        <div className="relative flex flex-1 flex-col justify-center gap-12 py-12">
          <div className="max-w-lg">
            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-white">Every renewal on time.<br /><span className="text-signal">Every invoice right.</span></h1>
            <p className="mt-4 text-lg text-rail-ink">Plans, subscriptions, invoices and payments in one place, with the numbers that matter one glance away.</p>
          </div>
          <ProductPreview />
        </div>
        <p className="relative text-sm text-rail-muted">© Brightloop Software</p>
      </section>
      <section className="relative flex items-center justify-center overflow-hidden px-5 py-12 sm:px-12">
        <div className="app-backdrop" aria-hidden />
        <div className="w-full max-w-sm">
          <div className="mb-10 flex items-center justify-between lg:hidden"><Link to="/" aria-label="Brightloop home"><Logo /></Link></div>
          <Link to="/" className="mb-8 hidden items-center gap-1.5 text-sm font-medium text-muted hover:text-ink lg:inline-flex"><ArrowLeft className="icon-sm" aria-hidden />Back to home</Link>
          <div className="rounded-2xl border border-line bg-surface/90 p-7 shadow-card backdrop-blur sm:p-8"><Outlet /></div>
        </div>
      </section>
    </div>
  );
}
