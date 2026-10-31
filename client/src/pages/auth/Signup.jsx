import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { fieldErrors } from '../../api/client.js';
import { Button, Input } from '../../components/ui/index.js';
import { PasswordRules, passwordOk } from './PasswordRules.jsx';

export default function Signup() {
  const { signup } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', company: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    const errs = {};
    if (f.name.trim().length < 2) errs.name = 'Enter your name';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) errs.email = 'Enter a valid email';
    if (!passwordOk(f.password)) errs.password = 'Password does not meet the requirements below';
    if (f.confirm !== f.password) errs.confirm = 'Passwords do not match';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await signup({ name: f.name, company: f.company || undefined, email: f.email, password: f.password });
      nav('/portal', { replace: true });
    } catch (err) {
      setErrors({ ...fieldErrors(err), form: err.code === 'CONFLICT' ? undefined : err.message, ...(err.code === 'CONFLICT' && { email: err.message }) });
    } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} noValidate>
      <h1 className="text-2xl font-semibold">Create your account</h1>
      <p className="mt-1 text-base text-muted">See and manage your subscriptions and invoices in one place.</p>
      {errors.form && <p role="alert" className="mt-5 rounded-md bg-bad-soft px-3 py-2 text-sm text-bad">{errors.form}</p>}
      <div className="mt-6 space-y-4">
        <Input label="Full name" autoComplete="name" required value={f.name} onChange={set('name')} error={errors.name} />
        <Input label="Company" autoComplete="organization" value={f.company} onChange={set('company')} hint="Optional" />
        <Input label="Work email" type="email" autoComplete="email" required value={f.email} onChange={set('email')} error={errors.email} />
        <div>
          <Input label="Password" type="password" autoComplete="new-password" required value={f.password} onChange={set('password')} error={errors.password} />
          <PasswordRules value={f.password} />
        </div>
        <Input label="Confirm password" type="password" autoComplete="new-password" required value={f.confirm} onChange={set('confirm')} error={errors.confirm} />
      </div>
      <Button type="submit" size="lg" className="mt-6 w-full" loading={busy}>Create account</Button>
      <p className="mt-6 text-center text-base text-muted">Already have an account? <Link to="/login" className="font-medium text-brand hover:underline">Log in</Link></p>
    </form>
  );
}
