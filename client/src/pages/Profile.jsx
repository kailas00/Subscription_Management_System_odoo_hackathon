import { useState } from 'react';
import { authApi } from '../api/endpoints.js';
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

  return (
    <>
      <PageHeader title="Your account" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Profile">
          <DescriptionList items={[['Email', user.email], ['Role', ROLES[user.role]]]} />
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
