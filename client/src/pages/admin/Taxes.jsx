import { useState } from 'react';
import { Percent, Plus } from 'lucide-react';
import { taxesApi } from '../../api/endpoints.js';
import { fieldErrors } from '../../api/client.js';
import { useAction, useTable } from '../../hooks/useApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { money } from '../../lib/format.js';
import { Badge, Button, DataTable, Input, Modal, PageHeader, SearchInput, Select, Toolbar } from '../../components/ui/index.js';

const EMPTY = { name: '', type: 'PERCENT', rate: '' };
export const taxLabel = (t) => (t.type === 'PERCENT' ? `${Number(t.rate)}%` : `${money(t.rate)} per unit`);

export default function Taxes() {
  const { isAdmin } = useAuth();
  const t = useTable('taxes', taxesApi.list);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const save = useAction(({ id, ...body }) => (id ? taxesApi.update(id, body) : taxesApi.create(body)), {
    success: (_r, v) => (v.id ? 'Tax updated' : 'Tax added'), invalidate: ['taxes'], onSuccess: () => setForm(null),
  });
  const toggle = useAction((x) => (x.isActive ? taxesApi.archive(x.id) : taxesApi.update(x.id, { isActive: true })), { success: 'Tax updated', invalidate: ['taxes'] });

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (form.name.trim().length < 2) errs.name = 'Give the tax a name, e.g. GST 18%';
    if (form.rate === '' || Number(form.rate) < 0) errs.rate = 'Enter a rate of 0 or more';
    if (form.type === 'PERCENT' && Number(form.rate) > 100) errs.rate = 'A percentage cannot exceed 100';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    save.mutate({ id: form.id, name: form.name, type: form.type, rate: Number(form.rate) }, { onError: (err) => setErrors(fieldErrors(err)) });
  };

  const columns = [
    { key: 'name', header: 'Name', render: (x) => <span className="font-medium">{x.name}</span> },
    { key: 'type', header: 'Type', render: (x) => (x.type === 'PERCENT' ? 'Percentage of line' : 'Fixed per unit'), className: 'text-muted' },
    { key: 'rate', header: 'Rate', align: 'right', render: (x) => <span className="tabular">{taxLabel(x)}</span> },
    { key: 'status', header: 'Status', render: (x) => (x.isActive ? <Badge tone="ok">In use</Badge> : <Badge>Archived</Badge>) },
    isAdmin && { key: 'actions', header: '', align: 'right', render: (x) => (
      <div className="flex justify-end gap-1">
        <Button size="sm" variant="ghost" onClick={() => { setErrors({}); setForm({ ...x, rate: Number(x.rate) }); }}>Edit</Button>
        <Button size="sm" variant={x.isActive ? 'danger-ghost' : 'ghost'} onClick={() => toggle.mutate(x)}>{x.isActive ? 'Archive' : 'Restore'}</Button>
      </div>
    ) },
  ].filter(Boolean);

  return (
    <>
      <PageHeader title="Taxes" description="Tax rules applied automatically to every invoice line. Changes affect future invoices only."
        actions={isAdmin && <Button icon={Plus} onClick={() => { setErrors({}); setForm(EMPTY); }}>Add tax</Button>} />
      <Toolbar><SearchInput value={t.params.search} onChange={(v) => t.setParam('search', v)} placeholder="Search taxes" /></Toolbar>
      <DataTable columns={columns} rows={t.rows} meta={t.meta} loading={t.isLoading} error={t.error} onPage={(p) => t.setParam('page', p)}
        empty={{ icon: Percent, title: 'No taxes yet', description: 'Add the tax rules your products use, such as GST 18%.' }} />
      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? 'Edit tax' : 'Add tax'} size="sm"
        footer={<><Button variant="secondary" onClick={() => setForm(null)}>Cancel</Button><Button type="submit" form="tax-form" loading={save.isPending}>{form?.id ? 'Save tax' : 'Add tax'}</Button></>}>
        {form && (
          <form id="tax-form" onSubmit={submit} className="space-y-4" noValidate>
            <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} placeholder="GST 18%" />
            <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              options={[{ value: 'PERCENT', label: 'Percentage of the line amount' }, { value: 'FIXED', label: 'Fixed amount per unit' }]} />
            <Input label={form.type === 'PERCENT' ? 'Rate (%)' : 'Amount per unit'} type="number" min="0" step="0.01" required value={form.rate}
              onChange={(e) => setForm({ ...form, rate: e.target.value })} error={errors.rate} />
          </form>
        )}
      </Modal>
    </>
  );
}
