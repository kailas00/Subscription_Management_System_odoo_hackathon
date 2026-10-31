import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Mail } from 'lucide-react';
import { authApi, portalApi } from '../api/endpoints.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useAction } from '../hooks/useApi.js';
import { ROLES } from '../lib/constants.js';
import { Button, Card, Input, PageHeader, DescriptionList } from '../components/ui/index.js';
import { PasswordRules, passwordOk } from './auth/PasswordRules.jsx';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const saveName = useAction(() => authApi.updateMe({ name }), { success: 'Name updated', onSuccess: (r) => setUser(r.data) });
  const savePw = useAction(() => authApi.changePassword(pw), { success: 'Password changed', onSuccess: () => setPw({ currentPassword: '', newPassword: '' }) });

  const isCustomer = user.role === 'CUSTOMER';
  const overview = useQuery({ queryKey: ['portal', 'overview'], queryFn: portalApi.overview, enabled: isCustomer });
  const o = overview.data?.data;

  return (
    <>
      <PageHeader title={isCustomer ? 'Account & help' : 'Your account'} description={isCustomer ? 'Who we bill, who to contact, and your sign-in details.' : undefined} />
      {isCustomer && o && (
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <Card title="Billing details" description="Shown on every bill. To change them, email your account manager.">
            <DescriptionList cols={1} items={[
              ['Billed to', o.customer.company || o.customer.name],
              ['Bills are emailed to', o.customer.email],
              (o.customer.address || o.customer.city) && ['Address', [o.customer.address, o.customer.city, o.customer.country].filter(Boolean).join(', ')],
              o.customer.gstin && ['GSTIN', o.customer.gstin],
              o.customer.phone && ['Phone', o.customer.phone],
            ]} />
          </Card>
          <Card title="Need help?">
            {o.accountManager ? (
              <>
                <p className="text-base text-muted">Your account manager can change your plans, update billing details and answer questions about a bill.</p>
                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-ground p-4">
                  <span className="min-w-0 flex-1"><span className="block font-semibold">{o.accountManager.name}</span><span className="block break-all text-sm text-muted">{o.accountManager.email}</span></span>
                  <a href={`mailto:${o.accountManager.email}`} className="pressable inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-strong"><Mail className="icon-sm" aria-hidden />Email</a>
                </div>
              </>
            ) : <p className="text-base text-muted">Email billing@brightloop.dev and we’ll reply within one working day.</p>}
          </Card>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={isCustomer ? 'Sign-in details' : 'Profile'}>
          <DescriptionList items={[['Email', user.email], !isCustomer && ['Role', ROLES[user.role]]]} />
          <form className="mt-5 flex items-end gap-3" onSubmit={(e) => { e.preventDefault(); saveName.mutate(); }}>
            <Input className="flex-1" label="Display name" value={name} onChange={(e) => setName(e.target.value)} />
            <Button type="submit" variant="secondary" loading={saveName.isPending} disabled={name.trim().length < 2 || name === user.name}>Save</Button>
          </form>
        </Card>
        <Card title="Change password">
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); savePw.mutate(); }}>
            <Input label="Current password" type="password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
            <div><Input label="New password" type="password" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /><PasswordRules value={pw.newPassword} /></div>
            <Button type="submit" loading={savePw.isPending} disabled={!pw.currentPassword || !passwordOk(pw.newPassword)}>Change password</Button>
          </form>
        </Card>
      </div>
    </>
  );
}
