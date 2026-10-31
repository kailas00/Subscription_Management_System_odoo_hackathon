import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { authApi } from '../../api/endpoints.js';
import { Button, Input } from '../../components/ui/index.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('');
    try { await authApi.forgotPassword(email); setSent(true); } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  if (sent) return (
    <div>
      <MailCheck className="size-8 text-brand" aria-hidden />
      <h1 className="mt-4 text-2xl font-semibold">Check your email</h1>
      <p className="mt-2 text-base text-muted">If <b className="text-ink">{email}</b> has an account, a reset link is on its way. It expires in 30 minutes.</p>
      <Link to="/login" className="mt-6 inline-block text-base font-medium text-brand hover:underline">Back to log in</Link>
    </div>
  );

  return (
    <form onSubmit={submit}>
      <h1 className="text-2xl font-semibold">Reset your password</h1>
      <p className="mt-1 text-base text-muted">Enter your registered email and we'll send you a reset link.</p>
      {error && <p role="alert" className="mt-5 rounded-md bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p>}
      <Input className="mt-6" label="Email" type="email" autoComplete="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
      <Button type="submit" size="lg" className="mt-6 w-full" loading={busy}>Send reset link</Button>
      <Link to="/login" className="mt-6 block text-center text-base text-muted hover:text-ink">Back to log in</Link>
    </form>
  );
}
