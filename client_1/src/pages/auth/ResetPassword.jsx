import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../../api/endpoints.js';
import { Button, Input } from '../../components/ui/index.js';
import { PasswordRules, passwordOk } from './PasswordRules.jsx';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const nav = useNavigate();
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!passwordOk(pw)) return setError('Password does not meet the requirements');
    if (pw !== confirm) return setError('Passwords do not match');
    setBusy(true); setError('');
    try { await authApi.resetPassword(token, pw); toast.success('Password updated — log in with your new password'); nav('/login'); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  if (!token) return (
    <div><h1 className="text-2xl font-semibold">Link is incomplete</h1>
      <p className="mt-2 text-base text-muted">Open the link from your email again, or request a new one.</p>
      <Link to="/forgot-password" className="mt-6 inline-block font-medium text-brand hover:underline">Request a new link</Link></div>
  );

  return (
    <form onSubmit={submit} noValidate>
      <h1 className="text-2xl font-semibold">Choose a new password</h1>
      {error && <p role="alert" className="mt-5 rounded-md bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p>}
      <div className="mt-6 space-y-4">
        <div><Input label="New password" type="password" autoComplete="new-password" required value={pw} onChange={(e) => setPw(e.target.value)} /><PasswordRules value={pw} /></div>
        <Input label="Confirm new password" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>
      <Button type="submit" size="lg" className="mt-6 w-full" loading={busy}>Update password</Button>
    </form>
  );
}
