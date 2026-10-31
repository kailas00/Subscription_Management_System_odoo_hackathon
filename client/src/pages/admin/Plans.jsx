import { useState } from 'react';
import { CalendarClock, Plus } from 'lucide-react';
import { plansApi } from '../../api/endpoints.js';
import { fieldErrors } from '../../api/client.js';
import { useAction, useTable } from '../../hooks/useApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { BILLING_PERIODS } from '../../lib/constants.js';
import { date, money, toInputDate } from '../../lib/format.js';
import { Badge, Button, Checkbox, DataTable, Input, Modal, PageHeader, SearchInput, Select, Toolbar } from '../../components/ui/index.js';

const EMPTY = { name: '', price: 0, billingPeriod: 'MONTHLY', intervalCount: 1, minQuantity: 1, startDate: '', endDate: '', autoClose: false, closable: true, pausable: false, renewable: true };
const RULES = [
  ['autoClose', 'Close automatically when it expires', 'No invoices after the expiry date; status becomes Closed.'],
  ['closable', 'Can be closed early', 'Staff or the customer can end it before expiry.'],
  ['pausable', 'Can be paused', 'Billing stops while paused and resumes from the next period.'],
  ['renewable', 'Can be renewed', 'The expiry date can be extended.'],
];
export const cadence = (p) => {
  const b = BILLING_PERIODS.find((x) => x.value === p.billingPeriod);
  return p.intervalCount > 1 ? `Every ${p.intervalCount} ${b.unit}s` : b.label;
};

export default function Plans() {
  const { isAdmin } = useAuth();
  const t = useTable('plans', plansApi.list);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const save = useAction(({ id, ...body }) => (id ? plansApi.update(id, body) : plansApi.create(body)), {
    success: (_r, v) => (v.id ? 'Plan updated' : 'Plan created'), invalidate: ['plans'], onSuccess: () => setForm(null),
  });
  const archive = useAction((id) => plansApi.archive(id), { success: 'Plan archived — existing subscriptions continue', invalidate: ['plans'] });

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (form.name.trim().length < 2) errs.name = 'Enter a plan name';
    if (form.startDate && form.endDate && form.endDate <= form.startDate) errs.endDate = 'Must be after the start date';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const { id, name, price, billingPeriod, intervalCount, minQuantity, startDate, endDate, autoClose, closable, pausable, renewable } = form;
    save.mutate({ id, name, price: Number(price || 0), billingPeriod, intervalCount: Number(intervalCount), minQuantity: Number(minQuantity),
      startDate: startDate || null, endDate: endDate || null, autoClose, closable, pausable, renewable }, { onError: (err) => setErrors(fieldErrors(err)) });
  };

  const columns = [
    { key: 'name', header: 'Plan', render: (p) => <span className="font-medium">{p.name}</span> },
    { key: 'cadence', header: 'Billing', render: cadence },
    { key: 'price', header: 'Plan fee', align: 'right', render: (p) => (Number(p.price) ? money(p.price) : <span className="text-faint">Products only</span>) },
    { key: 'min', header: 'Min qty', align: 'right', render: (p) => p.minQuantity },
    { key: 'window', header: 'Available', render: (p) => (p.startDate || p.endDate ? `${p.startDate ? date(p.startDate) : 'Now'} – ${p.endDate ? date(p.endDate) : 'open'}` : 'Always'), className: 'text-muted' },
    { key: 'rules', header: 'Rules', render: (p) => (
      <div className="flex flex-wrap gap-1">
        {p.autoClose && <Badge tone="info">Auto-close</Badge>}{p.pausable && <Badge tone="warn">Pausable</Badge>}
        {p.renewable && <Badge tone="ok">Renewable</Badge>}{!p.closable && <Badge>No early close</Badge>}
      </div>) },
    { key: 'active', header: 'Active subs', align: 'right', render: (p) => p._count?.subscriptions ?? 0 },
    isAdmin && { key: 'actions', header: '', align: 'right', render: (p) => (
      <div className="flex justify-end gap-1">
        <Button size="sm" variant="ghost" onClick={() => { setErrors({}); setForm({ ...p, price: Number(p.price), startDate: toInputDate(p.startDate), endDate: toInputDate(p.endDate) }); }}>Edit</Button>
        <Button size="sm" variant="danger-ghost" onClick={() => archive.mutate(p.id)}>Archive</Button>
      </div>) },
  ].filter(Boolean);

  return (
    <>
      <PageHeader title="Plans" description="How often subscriptions bill, and what customers and staff may do with them."
        actions={isAdmin && <Button icon={Plus} onClick={() => { setErrors({}); setForm(EMPTY); }}>Create plan</Button>} />
      <Toolbar><SearchInput value={t.params.search} onChange={(v) => t.setParam('search', v)} placeholder="Search plans" /></Toolbar>
      <DataTable columns={columns} rows={t.rows} meta={t.meta} loading={t.isLoading} error={t.error} onPage={(p) => t.setParam('page', p)}
        empty={{ icon: CalendarClock, title: 'No plans yet', description: 'A plan sets the billing period, for example Monthly or Yearly.' }} />

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? `Edit ${form.name}` : 'Create plan'} sheet
        footer={<><Button variant="secondary" onClick={() => setForm(null)}>Cancel</Button><Button type="submit" form="plan-form" loading={save.isPending}>{form?.id ? 'Save plan' : 'Create plan'}</Button></>}>
        {form && (
          <form id="plan-form" onSubmit={submit} noValidate className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input className="sm:col-span-2" label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} placeholder="Monthly Standard" />
              <Input label="Plan fee per period" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} hint="0 = charge products only" />
              <Select label="Billing period" value={form.billingPeriod} onChange={(e) => setForm({ ...form, billingPeriod: e.target.value })} options={BILLING_PERIODS} />
              <Input label="Bill every" type="number" min="1" max="36" value={form.intervalCount} onChange={(e) => setForm({ ...form, intervalCount: e.target.value })}
                hint={`${BILLING_PERIODS.find((b) => b.value === form.billingPeriod).unit}(s)`} />
              <Input label="Minimum quantity" type="number" min="1" value={form.minQuantity} onChange={(e) => setForm({ ...form, minQuantity: e.target.value })} />
              <Input label="Available from" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              <Input label="Available until" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} error={errors.endDate} />
            </div>
            <fieldset className="grid gap-3 rounded-lg border border-line p-4 sm:grid-cols-2">
              <legend className="px-1 text-sm font-semibold">Rules for subscriptions on this plan</legend>
              {RULES.map(([k, label, hint]) => <Checkbox key={k} label={label} hint={hint} checked={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.checked })} />)}
            </fieldset>
          </form>
        )}
      </Modal>
    </>
  );
}
