// ─────────────────────────────────────────────────────────────────────────────
// ROUTER —
// ─────────────────────────────────────────────────────────────────────────────
import { lazy, Suspense } from 'react';
import { pages } from './lib/preload.js';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth, homeFor } from './context/AuthContext.jsx';
import { AppLayout } from './components/layout/AppLayout.jsx';
import { PortalLayout } from './components/layout/PortalLayout.jsx';
import { AuthLayout } from './components/layout/AuthLayout.jsx';
import { RequireRole, GuestOnly } from './components/layout/Guards.jsx';
import { Spinner } from './components/ui/index.js';

import Login from './pages/auth/Login.jsx';
import Signup from './pages/auth/Signup.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';
import ResetPassword from './pages/auth/ResetPassword.jsx';
import Profile from './pages/Profile.jsx';
import Landing from './pages/Landing.jsx';
import NotFound from './pages/NotFound.jsx';
// admin & catalog
import Users from './pages/admin/Users.jsx';
import Customers from './pages/admin/Customers.jsx';
import Products from './pages/admin/Products.jsx';
import Plans from './pages/admin/Plans.jsx';
import Taxes from './pages/admin/Taxes.jsx';
import Discounts from './pages/admin/Discounts.jsx';
import Templates from './pages/admin/Templates.jsx';
// operations & finance
// Chart-heavy pages load on first visit only (keeps the chart library out of every other page)
const Dashboard = lazy(pages['/dashboard']);
import Subscriptions from './pages/ops/Subscriptions.jsx';
import SubscriptionForm from './pages/ops/SubscriptionForm.jsx';
import SubscriptionDetail from './pages/ops/SubscriptionDetail.jsx';
import Invoices from './pages/ops/Invoices.jsx';
import InvoiceDetail from './pages/ops/InvoiceDetail.jsx';
import Payments from './pages/ops/Payments.jsx';
const Reports = lazy(pages['/reports']);
// customer portal
import PortalHome from './pages/portal/PortalHome.jsx';
import PortalSubscriptions from './pages/portal/PortalSubscriptions.jsx';
import PortalSubscriptionDetail from './pages/portal/PortalSubscriptionDetail.jsx';
import PortalInvoices from './pages/portal/PortalInvoices.jsx';
import PortalInvoiceDetail from './pages/portal/PortalInvoiceDetail.jsx';
import PortalCatalog from './pages/portal/PortalCatalog.jsx';

function Home() {
  const { user, ready } = useAuth();
  if (!ready) return <Spinner />;
  return <Navigate to={user ? homeFor(user) : '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/home" element={<Home />} />

      <Route element={<GuestOnly><AuthLayout /></GuestOnly>}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>
      <Route element={<AuthLayout />}>
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      {/* Staff (ADMIN + INTERNAL) */}
      <Route element={<RequireRole roles={['ADMIN', 'INTERNAL']}><AppLayout /></RequireRole>}>
        <Route path="/dashboard" element={<Suspense fallback={<Spinner />}><Dashboard /></Suspense>} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/subscriptions/new" element={<SubscriptionForm />} />
        <Route path="/subscriptions/:id" element={<SubscriptionDetail />} />
        <Route path="/subscriptions/:id/edit" element={<SubscriptionForm />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/invoices/:id" element={<InvoiceDetail />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/reports" element={<Suspense fallback={<Spinner />}><Reports /></Suspense>} />
        <Route path="/products" element={<Products />} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/taxes" element={<Taxes />} />
        <Route path="/discounts" element={<Discounts />} />
        <Route path="/users" element={<RequireRole roles={['ADMIN']}><Users /></RequireRole>} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Customer portal */}
      <Route element={<RequireRole roles={['CUSTOMER']}><PortalLayout /></RequireRole>}>
        <Route path="/portal" element={<PortalHome />} />
        <Route path="/portal/subscriptions" element={<PortalSubscriptions />} />
        <Route path="/portal/subscriptions/:id" element={<PortalSubscriptionDetail />} />
        <Route path="/portal/add" element={<PortalCatalog />} />
        <Route path="/portal/invoices" element={<PortalInvoices />} />
        <Route path="/portal/invoices/:id" element={<PortalInvoiceDetail />} />
        <Route path="/portal/account" element={<Profile />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
