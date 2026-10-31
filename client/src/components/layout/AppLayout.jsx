// Staff shell: navy rail with an emerald signal, glass top bar with quick jump.
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { LayoutDashboard, Repeat, Users, Receipt, Wallet, BarChart3, Package, CalendarClock, Percent, BadgePercent, UserCog, LogOut, Menu, X, ScrollText, Search, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLES } from '../../lib/constants.js';
import { Logo } from './Logo.jsx';
import { preload } from '../../lib/preload.js';
import { CommandMenu, useCommandMenu } from './CommandMenu.jsx';
import { Avatar } from '../ui/index.js';

// Daily work first. Admin-only setup (what we sell, tax rules, who can sign in) sits in its own group,
// so billing staff see seven links, not twelve.
const NAV = [
  { group: null, items: [{ to: '/dashboard', label: 'Today', icon: LayoutDashboard }] },
  { group: 'Sell', items: [
    { to: '/subscriptions', label: 'Subscriptions', icon: Repeat },
    { to: '/customers', label: 'Customers', icon: Users },
    { to: '/templates', label: 'Quotation templates', icon: ScrollText },
  ] },
  { group: 'Get paid', items: [
    { to: '/invoices', label: 'Invoices', icon: Receipt },
    { to: '/payments', label: 'Payments', icon: Wallet },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
  ] },
  { group: 'Setup', adminOnly: true, items: [
    { to: '/products', label: 'Products', icon: Package },
    { to: '/plans', label: 'Plans', icon: CalendarClock },
    { to: '/taxes', label: 'Taxes', icon: Percent },
    { to: '/discounts', label: 'Discounts', icon: BadgePercent },
    { to: '/users', label: 'Staff & access', icon: UserCog },
  ] },
];

function Rail({ onNavigate }) {
  const { user, isAdmin, logout } = useAuth();
  return (
    <nav aria-label="Main" className="relative flex h-full flex-col overflow-hidden bg-rail text-rail-ink">
      <div aria-hidden className="pointer-events-none absolute -left-24 bottom-0 size-80 rounded-full bg-signal/10 blur-3xl" />
      <div className="relative px-5 pb-7 pt-6"><Logo light /></div>
      <div className="relative flex-1 space-y-6 overflow-y-auto px-3 pb-4">
        {NAV.filter((g) => !g.adminOnly || isAdmin).map((g) => (
          <div key={g.group || 'root'}>
            {g.group && <p className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-[0.08em] text-rail-muted/80">{g.group}</p>}
            <ul className="space-y-0.5">
              {g.items.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink to={to} onClick={onNavigate} onMouseEnter={() => preload(to)} onFocus={() => preload(to)}
                    className={({ isActive }) => clsx('relative flex h-10 items-center gap-3 rounded-md px-3 text-base transition-colors duration-quick ease-out',
                      isActive ? 'bg-white/[0.08] font-semibold text-white ring-1 ring-inset ring-white/10 before:absolute before:-left-3 before:top-2.5 before:h-5 before:w-1 before:rounded-r-full before:bg-signal'
                        : 'text-rail-ink/70 hover:bg-rail-2/60 hover:text-white')}>
                    {({ isActive }) => <><Icon className={clsx('size-[17px] shrink-0', isActive ? 'text-signal' : '')} strokeWidth={1.8} aria-hidden />{label}</>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="relative m-3 flex items-center gap-3 rounded-xl bg-white/[0.06] px-3 py-2.5 ring-1 ring-inset ring-white/10">
        <Avatar name={user?.name} />
        <NavLink to="/profile" className="min-w-0 flex-1" onClick={onNavigate}>
          <p className="truncate text-sm font-medium text-white">{user?.name}</p>
          <p className="truncate text-xs text-rail-muted">{ROLES[user?.role]}</p>
        </NavLink>
        <button onClick={logout} aria-label="Log out" title="Log out" className="rounded-md p-1.5 text-rail-muted transition-colors hover:bg-white/10 hover:text-white">
          <LogOut className="size-4" />
        </button>
      </div>
    </nav>
  );
}

export function AppLayout() {
  const [open, setOpen] = useState(false);
  const [cmd, setCmd] = useCommandMenu();
  const { pathname } = useLocation();
  const { isAdmin } = useAuth();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  const items = NAV.filter((g) => !g.adminOnly || isAdmin).flatMap((g) => g.items.map((x) => ({ ...x, group: g.group })))
    .concat([{ to: '/subscriptions/new', label: 'New subscription', icon: Plus, group: 'Action' }, { to: '/profile', label: 'Your account', icon: UserCog, group: 'Account' }]);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[256px_1fr]">
      <div className="app-backdrop" aria-hidden />
      <a href="#main" className="skip-link">Skip to content</a>
      <aside className="sticky top-0 hidden h-screen lg:block"><Rail /></aside>

      {/* Phone / tablet header */}
      <header className="no-print sticky top-0 z-30 flex items-center gap-2 bg-rail px-4 py-3 lg:hidden">
        <Logo light />
        <button onClick={() => setCmd(true)} aria-label="Jump to a page" className="pressable ml-auto rounded-md p-2 text-rail-ink hover:bg-white/10"><Search className="size-5" /></button>
        <button onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open} className="pressable rounded-md p-2 text-rail-ink hover:bg-white/10"><Menu className="size-5" /></button>
      </header>

      {/* Drawer: slides in from the left and back out the same way; scrim fades */}
      <div className={clsx('fixed inset-0 z-40 lg:hidden', !open && 'pointer-events-none')} aria-hidden={!open} inert={open ? undefined : ''}>
        <div className={clsx('absolute inset-0 bg-rail/60 transition-opacity duration-enter ease-out', open ? 'opacity-100' : 'opacity-0')} onClick={() => setOpen(false)} />
        <div className={clsx('motion-move absolute inset-y-0 left-0 w-72 shadow-pop transition-transform ease-drawer', open ? 'translate-x-0 duration-sheet' : '-translate-x-full duration-enter')}>
          <button onClick={() => setOpen(false)} aria-label="Close menu" className="pressable absolute right-3 top-5 z-10 rounded p-1 text-rail-ink"><X className="size-5" /></button>
          <Rail onNavigate={() => setOpen(false)} />
        </div>
      </div>

      <div className="min-w-0">
        <div className="glass no-print sticky top-0 z-20 hidden h-16 items-center justify-between gap-4 border-b border-line/70 bg-ground/70 px-8 backdrop-blur-md lg:flex">
          <button onClick={() => setCmd(true)} className="pressable flex h-10 w-full max-w-md items-center gap-2.5 rounded-full border border-line bg-surface px-4 text-sm text-faint shadow-card hover:border-faint/40">
            <Search className="size-4" aria-hidden /><span className="flex-1 text-left">Jump to a page…</span>
            <kbd className="rounded border border-line bg-ground px-1.5 font-mono text-[11px] text-muted">Ctrl K</kbd>
          </button>
          <span className="text-sm text-muted">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
        <main id="main" tabIndex={-1} className="px-4 py-6 outline-none sm:px-8 lg:py-8">
          <div className="mx-auto max-w-[1320px]"><Outlet /></div>
        </main>
      </div>
      <CommandMenu open={cmd} onClose={() => setCmd(false)} items={items} />
    </div>
  );
}
