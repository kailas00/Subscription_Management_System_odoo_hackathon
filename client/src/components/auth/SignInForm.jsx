// The one sign-in for every role. Where you land depends on who you are:
// admins and billing staff → dashboard, customers → their portal.
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useAuth, homeFor } from '../../context/AuthContext.jsx';
import { Input } from '../ui/index.js';

export function SignInForm({ autoFocus = false }) {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!form.email || !form.password) return setError('Enter your email and password.');
    setBusy(true); setError('');
    try {
      const user = await login(form.email.trim(), form.password);
      nav(loc.state?.from && user.role !== 'CUSTOMER' ? loc.state.from : homeFor(user), { replace: true });
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {error && <p role="alert" className="rounded-lg bg-bad-soft px-3.5 py-2.5 text-sm font-medium text-bad">{error}</p>}
      <Input label="Email" type="email" autoComplete="email" required autoFocus={autoFocus} value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <div>
        <Input label="Password" type="password" autoComplete="current-password" required value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <Link to="/forgot-password" className="mt-2 inline-block text-sm font-medium text-brand hover:underline">Forgot password?</Link>
      </div>
      <button type="submit" disabled={busy}
        className="pressable flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0F1F33] text-[15px] font-semibold text-white shadow-[0_8px_24px_-8px_rgb(15_31_51/0.45)] hover:bg-[#1E3A5F] disabled:opacity-60">
        {busy ? <Loader2 className="animate-spin" aria-hidden /> : <>Sign in<ArrowRight className="icon-sm" aria-hidden /></>}
      </button>
    </form>
  );
}
