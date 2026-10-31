import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, homeFor } from '../../context/AuthContext.jsx';
import { Button, Input } from '../../components/ui/index.js';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const user = await login(form.email, form.password);
      nav(loc.state?.from && user.role !== 'CUSTOMER' ? loc.state.from : homeFor(user), { replace: true });
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} noValidate>
      <h1 className="text-2xl font-semibold">Log in</h1>
      <p className="mt-1 text-base text-muted">Welcome back. Use the email you registered with.</p>
      {error && <p role="alert" className="mt-5 rounded-md bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p>}
      <div className="mt-6 space-y-4">
        <Input label="Email" type="email" autoComplete="email" required autoFocus value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <div>
          <Input label="Password" type="password" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <Link to="/forgot-password" className="mt-1.5 inline-block text-sm text-brand hover:underline">Forgot your password?</Link>
        </div>
      </div>
      <Button type="submit" size="lg" className="mt-6 w-full" loading={busy}>Log in</Button>
      <p className="mt-6 text-center text-base text-muted">New to Brightloop? <Link to="/signup" className="font-medium text-brand hover:underline">Create an account</Link></p>
    </form>
  );
}
