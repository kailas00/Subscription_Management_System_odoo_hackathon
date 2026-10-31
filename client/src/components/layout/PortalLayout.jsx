import { NavLink, Outlet } from 'react-router-dom';
import clsx from 'clsx';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Avatar } from '../ui/index.js';
import { Logo } from './Logo.jsx';

const links = [
  { to: '/portal', label: 'Home', end: true },
  { to: '/portal/subscriptions', label: 'My plans' },
  { to: '/portal/add', label: 'Add a service' },
  { to: '/portal/invoices', label: 'Bills & payments' },
  { to: '/portal/account', label: 'Account & help' },
];

export function PortalLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen">
      <div className="app-backdrop" aria-hidden />
      <a href="#main" className="skip-link">Skip to content</a>
      <header className="glass no-print sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3 sm:px-6">
          <Logo />
          <nav aria-label="Portal" className="order-3 -mx-1 flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => clsx('pressable rounded-md px-3 py-1.5 text-base whitespace-nowrap',
                isActive ? 'bg-brand font-semibold text-white' : 'text-muted hover:bg-sunken hover:text-ink')}>{l.label}</NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <Avatar name={user?.name} />
            <span className="hidden text-sm font-medium sm:inline">{user?.name}</span>
            <button onClick={logout} aria-label="Log out" title="Log out" className="rounded-md p-1.5 text-muted hover:bg-sunken hover:text-ink"><LogOut className="size-4" /></button>
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto max-w-5xl px-4 py-10 outline-none sm:px-6"><Outlet /></main>
    </div>
  );
}
