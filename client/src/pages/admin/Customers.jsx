import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Users } from 'lucide-react';
import { customersApi } from '../../api/endpoints.js';
import { fieldErrors } from '../../api/client.js';
import { useAction, useTable } from '../../hooks/useApi.js';
import { date, money } from '../../lib/format.js';
import { Badge, Button, DataTable, Input, Modal, PageHeader, Person, SearchInput, Spinner, StatusBadge, Textarea, Toolbar } from '../../components/ui/index.js';

const EMPTY = { name: '', email: '', phone: '', company: '', address: '', city: '', country: 'India', gstin: '' };
const FIELDS = ['name', 'email', 'phone', 'company', 'address', 'city', 'country', 'gstin'];

function CustomerPanel({ id, onEdit }) {
  const q = useQuery({ queryKey: ['customer', id], queryFn: () => customersApi.get(id) });
  if (q.isLoading) return <Spinner />;
  const c = q.data?.data;
  if (!c) return <p className="text-bad">{q.error?.message}</p>;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md bg-sunken px-3 py-2"><p className="text-xs text-muted">Outstanding</p><p className="text-lg font-semibold tabular">{money(c.stats.outstanding)}</p></div>
        <div className="rounded-md bg-sunken px-3 py-2"><p className="text-xs text-muted">Overdue invoices</p><p className={`text-lg font-semibold tabular ${c.stats.overdueCount ? 'text-bad' : ''}`}>{c.stats.overdueCount}</p></div>
      </div>
      <p className="text-sm text-muted">{[c.email, c.phone, c.address, c.city, c.country, c.gstin && `GSTIN ${c.gstin}`].filter(Boolean).join(' · ')}</p>
      <section>
        <h3 className="mb-2 text-sm font-semibold">Subscriptions</h3>
        {c.subscriptions.length === 0 ? <p className="text-sm text-muted">None yet.</p> : (
          <ul className="divide-y divide-line">{c.subscriptions.map((s) => (
            <li key={s.id}><Link to={`/subscriptions/${s.id}`} className="flex items-center justify-between py-2 text-sm hover:text-brand">
              <span><span className="doc-no">{s.number}</span> · {s.plan.name}</span><StatusBadge status={s.status} /></Link></li>))}</ul>
        )}
      </section>
      <section>
        <h3 className="mb-2 text-sm font-semibold">Recent invoices</h3>
        {c.invoices.length === 0 ? <p className="text-sm text-muted">None yet.</p> : (
          <ul className="divide-y divide-line">{c.invoices.map((i) => (
            <li key={i.id}><Link to={`/invoices/${i.id}`} className="flex items-center justify-between gap-3 py-2 text-sm hover:text-brand">
              <span><span className="doc-no">{i.number}</span> · due {date(i.dueDate)}</span><span className="tabular">{money(i.total)}</span></Link></li>))}</ul>
        )}
      </section>
      <Button variant="secondary" onClick={() => onEdit(c)}>Edit details</Button>
    </div>
  );
}

export default function Customers() {
  const t = useTable('customers', customersApi.list);
  const [form, setForm] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [errors, setErrors] = useState({});
  const save = useAction(({ id, ...body }) => (id ? customersApi.update(id, body) : customersApi.create(body)), {
    success: (_r, v) => (v.id ? 'Customer updated' : 'Customer added'), invalidate: ['customers', 'customer'], onSuccess: () => setForm(null),
  });

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (form.name.trim().length < 2) errs.name = 'Enter the customer name';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid billing email';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const body = Object.fromEntries(FIELDS.map((k) => [k, form[k]?.trim?.() ? form[k].trim() : k === 'name' || k === 'email' ? form[k] : null]));
    save.mutate({ id: form.id, ...body }, { onError: (err) => setErrors(fieldErrors(err)) });
  };
  const edit = (c) => { setViewing(null); setErrors({}); setForm(Object.fromEntries([['id', c.id], ...FIELDS.map((k) => [k, c[k] ?? ''])])); };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const columns = [
    { key: 'name', header: 'Customer', render: (c) => <Person name={c.name} sub={c.company && c.company !== c.name ? c.company : c.city} /> },
    { key: 'email', header: 'Billing email', className: 'text-muted' },
    { key: 'city', header: 'City', render: (c) => c.city ?? '—', className: 'text-muted' },
    { key: 'subs', header: 'Subscriptions', align: 'right', render: (c) => c._count.subscriptions },
    { key: 'portal', header: 'Portal', render: (c) => (c.hasLogin ? <Badge tone="ok">Has login</Badge> : <Badge>No login</Badge>) },
  ];

  return (
    <>
      <PageHeader title="Customers" description="Billing contacts. Customers who sign up get a portal login linked to their record."
        actions={<Button icon={Plus} onClick={() => { setErrors({}); setForm(EMPTY); }}>Add customer</Button>} />
      <Toolbar><SearchInput value={t.params.search} onChange={(v) => t.setParam('search', v)} placeholder="Search name, company or email" /></Toolbar>
      <DataTable columns={columns} rows={t.rows} meta={t.meta} loading={t.isLoading} error={t.error} onPage={(p) => t.setParam('page', p)} onRowClick={setViewing}
        empty={{ icon: Users, title: 'No customers yet', description: 'Add a customer, or let them sign up through the portal.' }} />

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing?.name} description={viewing?.company !== viewing?.name ? viewing?.company : undefined}>
        {viewing && <CustomerPanel id={viewing.id} onEdit={edit} />}
      </Modal>

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? `Edit ${form.name}` : 'Add customer'}
        footer={<><Button variant="secondary" onClick={() => setForm(null)}>Cancel</Button><Button type="submit" form="customer-form" loading={save.isPending}>{form?.id ? 'Save customer' : 'Add customer'}</Button></>}>
        {form && (
          <form id="customer-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
            <Input label="Name" required value={form.name} onChange={set('name')} error={errors.name} />
            <Input label="Company" value={form.company} onChange={set('company')} />
            <Input label="Billing email" type="email" required value={form.email} onChange={set('email')} error={errors.email} hint="Invoices and quotations are sent here" />
            <Input label="Phone" type="tel" value={form.phone} onChange={set('phone')} />
            <Textarea className="sm:col-span-2" label="Address" value={form.address} onChange={set('address')} />
            <Input label="City" value={form.city} onChange={set('city')} />
            <Input label="Country" value={form.country} onChange={set('country')} />
            <Input label="GSTIN" value={form.gstin} onChange={set('gstin')} hint="Optional" />
          </form>
        )}
      </Modal>
    </>
  );
}
