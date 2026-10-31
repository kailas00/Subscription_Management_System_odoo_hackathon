// Customer portal shell: simple top bar, no internal navigation.
import { NavLink, Outlet } from 'react-router-dom';
import clsx from 'clsx';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Logo } from './Logo.jsx';

const links = [
  { to: '/portal', label: 'Overview', end: true },
  { to: '/portal/subscriptions', label: 'Subscriptions' },
  { to: '/portal/invoices', label: 'Invoices' },
  { to: '/portal/account', label: 'Account' },
];

export function PortalLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen">
      <header className="no-print border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3 sm:px-6">
          <Logo />
          <nav aria-label="Portal" className="order-3 -mx-2 flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => clsx('rounded-md px-2.5 py-1.5 text-base whitespace-nowrap',
                isActive ? 'bg-brand-soft font-medium text-brand' : 'text-muted hover:text-ink')}>{l.label}</NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-muted sm:inline">{user?.name}</span>
            <button onClick={logout} className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-sm text-muted hover:bg-sunken hover:text-ink">
              <LogOut className="size-4" />Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6"><Outlet /></main>
    </div>
  );
}
