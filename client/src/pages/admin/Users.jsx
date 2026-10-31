import { useState } from 'react';
import { Plus, UserCog } from 'lucide-react';
import { usersApi } from '../../api/endpoints.js';
import { fieldErrors } from '../../api/client.js';
import { useTable, useAction } from '../../hooks/useApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLES } from '../../lib/constants.js';
import { date } from '../../lib/format.js';
import { Badge, Button, DataTable, Input, Modal, PageHeader, Person, SearchInput, Select, Tabs, Toolbar } from '../../components/ui/index.js';
import { PasswordRules } from '../auth/PasswordRules.jsx';

const EMPTY = { name: '', email: '', password: '', role: 'INTERNAL' };

export default function Users() {
  const { user: me } = useAuth();
  const t = useTable('users', usersApi.list, { role: '' });
  const [form, setForm] = useState(null); // null = closed
  const [errors, setErrors] = useState({});

  const save = useAction((body) => usersApi.create(body), {
    success: 'Staff member added', invalidate: ['users'],
    onSuccess: () => setForm(null),
  });
  const toggle = useAction(({ id, isActive }) => usersApi.update(id, { isActive }), { success: 'Access updated', invalidate: ['users'] });

  const submit = (e) => {
    e.preventDefault();
    setErrors({});
    save.mutate(form, { onError: (err) => setErrors(fieldErrors(err)) });
  };

  const columns = [
    { key: 'name', header: 'Name', render: (u) => <Person name={u.name} sub={u.id === me.id ? 'You' : undefined} /> },
    { key: 'email', header: 'Email', className: 'text-muted' },
    { key: 'role', header: 'Role', render: (u) => <Badge tone={u.role === 'ADMIN' ? 'brand' : u.role === 'INTERNAL' ? 'info' : 'neutral'}>{ROLES[u.role]}</Badge> },
    { key: 'isActive', header: 'Access', render: (u) => (u.isActive ? <Badge tone="ok">Active</Badge> : <Badge>Disabled</Badge>) },
    { key: 'createdAt', header: 'Added', render: (u) => date(u.createdAt), className: 'text-muted' },
    { key: 'actions', header: '', align: 'right', render: (u) => u.id !== me.id && u.role !== 'CUSTOMER' && (
      <Button size="sm" variant={u.isActive ? 'danger-ghost' : 'ghost'} onClick={() => toggle.mutate({ id: u.id, isActive: !u.isActive })}>
        {u.isActive ? 'Disable' : 'Enable'}
      </Button>
    ) },
  ];

  return (
    <>
      <PageHeader title="Staff & access" description="Only admins can add staff. Internal staff handle day-to-day work; customers sign up themselves."
        actions={<Button icon={Plus} onClick={() => { setErrors({}); setForm(EMPTY); }}>Add staff member</Button>} />
      <Toolbar>
        <SearchInput value={t.params.search} onChange={(v) => t.setParam('search', v)} placeholder="Search name or email" />
        <Tabs value={t.params.role} onChange={(v) => t.setParam('role', v)}
          items={[{ value: '', label: 'Everyone' }, { value: 'ADMIN', label: 'Admins' }, { value: 'INTERNAL', label: 'Internal' }, { value: 'CUSTOMER', label: 'Customers' }]} />
      </Toolbar>
      <DataTable columns={columns} rows={t.rows} meta={t.meta} loading={t.isLoading} error={t.error} onPage={(p) => t.setParam('page', p)}
        empty={{ icon: UserCog, title: 'No people match', description: 'Try a different search or role.' }} />

      <Modal open={!!form} onClose={() => setForm(null)} title="Add staff member" description="They can log in immediately with this password."
        footer={<><Button variant="secondary" onClick={() => setForm(null)}>Cancel</Button><Button type="submit" form="user-form" loading={save.isPending}>Add staff member</Button></>}>
        {form && (
          <form id="user-form" onSubmit={submit} className="space-y-4" noValidate>
            <Input label="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
            <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} />
            <div>
              <Input label="Temporary password" type="password" autoComplete="new-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password} />
              <PasswordRules value={form.password} />
            </div>
            <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
              options={[{ value: 'INTERNAL', label: 'Internal staff — day-to-day work' }, { value: 'ADMIN', label: 'Admin — full control' }]} />
          </form>
        )}
      </Modal>
    </>
  );
}
