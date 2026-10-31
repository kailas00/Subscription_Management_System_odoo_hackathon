// Staff shell: deep-green rail + content.
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { LayoutDashboard, Repeat, Users, FileText, Receipt, Wallet, BarChart3, Package, CalendarClock, Percent, BadgePercent, UserCog, LogOut, Menu, X, ScrollText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLES } from '../../lib/constants.js';
import { Logo } from './Logo.jsx';

const NAV = [
  { group: null, items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  { group: 'Sales', items: [
    { to: '/subscriptions', label: 'Subscriptions', icon: Repeat },
    { to: '/customers', label: 'Customers', icon: Users },
    { to: '/templates', label: 'Quotation templates', icon: ScrollText },
  ] },
  { group: 'Billing', items: [
    { to: '/invoices', label: 'Invoices', icon: Receipt },
    { to: '/payments', label: 'Payments', icon: Wallet },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
  ] },
  { group: 'Catalog', items: [
    { to: '/products', label: 'Products', icon: Package },
    { to: '/plans', label: 'Plans', icon: CalendarClock },
    { to: '/taxes', label: 'Taxes', icon: Percent },
    { to: '/discounts', label: 'Discounts', icon: BadgePercent },
  ] },
  { group: 'Admin', adminOnly: true, items: [{ to: '/users', label: 'Staff & access', icon: UserCog }] },
];

function Rail({ onNavigate }) {
  const { user, isAdmin, logout } = useAuth();
  return (
    <nav aria-label="Main" className="flex h-full flex-col bg-rail text-rail-ink">
      <div className="px-5 py-5"><Logo light /></div>
      <div className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {NAV.filter((g) => !g.adminOnly || isAdmin).map((g) => (
          <div key={g.group || 'root'}>
            {g.group && <p className="mb-1 px-2 text-xs font-medium text-rail-muted">{g.group}</p>}
            <ul className="space-y-0.5">
              {g.items.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink to={to} onClick={onNavigate}
                    className={({ isActive }) => clsx('flex items-center gap-2.5 rounded-md px-2 py-1.5 text-base transition-colors',
                      isActive ? 'bg-white/10 font-medium text-white' : 'text-rail-ink/80 hover:bg-white/5 hover:text-white')}>
                    <Icon className="size-4 shrink-0" aria-hidden />{label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 border-t border-white/10 px-4 py-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold">
          {user?.name?.split(' ').map((p) => p[0]).slice(0, 2).join('')}
        </div>
        <NavLink to="/profile" className="min-w-0 flex-1 hover:underline" onClick={onNavigate}>
          <p className="truncate text-sm font-medium">{user?.name}</p>
          <p className="truncate text-xs text-rail-muted">{ROLES[user?.role]}</p>
        </NavLink>
        <button onClick={logout} aria-label="Log out" title="Log out" className="rounded p-1.5 text-rail-muted hover:bg-white/10 hover:text-white">
          <LogOut className="size-4" />
        </button>
      </div>
    </nav>
  );
}

export function AppLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-screen lg:block"><Rail /></aside>
      {/* mobile */}
      <header className="no-print sticky top-0 z-30 flex items-center justify-between bg-rail px-4 py-3 lg:hidden">
        <Logo light />
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded p-1.5 text-rail-ink"><Menu className="size-5" /></button>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 shadow-pop">
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="absolute right-3 top-4 z-10 rounded p-1 text-rail-ink"><X className="size-5" /></button>
            <Rail onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
      <main className="min-w-0 px-4 py-6 sm:px-8 lg:py-8">
        <div className="mx-auto max-w-[1280px]"><Outlet /></div>
      </main>
    </div>
  );
}
