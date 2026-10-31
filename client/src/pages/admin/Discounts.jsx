import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BadgePercent, Plus } from 'lucide-react';
import { discountsApi, productsApi } from '../../api/endpoints.js';
import { fieldErrors } from '../../api/client.js';
import { useAction, useTable } from '../../hooks/useApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { date, money, toInputDate } from '../../lib/format.js';
import { Badge, Button, Checkbox, DataTable, Input, Modal, PageHeader, SearchInput, Select, Tabs, Toolbar } from '../../components/ui/index.js';

const EMPTY = { name: '', code: '', type: 'PERCENT', value: '', scope: 'SUBSCRIPTION', minPurchase: '', minQuantity: '', startDate: '', endDate: '', usageLimit: '', productIds: [] };
const STATUS_TONE = { ACTIVE: 'ok', SCHEDULED: 'info', EXPIRED: 'neutral', EXHAUSTED: 'warn', INACTIVE: 'neutral' };
const STATUS_LABEL = { ACTIVE: 'Active', SCHEDULED: 'Scheduled', EXPIRED: 'Expired', EXHAUSTED: 'Used up', INACTIVE: 'Archived' };

export default function Discounts() {
  const { isAdmin } = useAuth();
  const t = useTable('discounts', discountsApi.list, { scope: '' });
  const products = useQuery({ queryKey: ['products', 'all'], queryFn: () => productsApi.list({ pageSize: 100 }) });
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [productSearch, setProductSearch] = useState('');
  const save = useAction(({ id, ...body }) => (id ? discountsApi.update(id, body) : discountsApi.create(body)), {
    success: (_r, v) => (v.id ? 'Discount updated' : 'Discount created'), invalidate: ['discounts'], onSuccess: () => setForm(null),
  });
  const archive = useAction((id) => discountsApi.archive(id), { success: 'Discount archived — it stops applying on the next invoice', invalidate: ['discounts'] });

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (form.name.trim().length < 2) errs.name = 'Enter a name';
    if (!(Number(form.value) > 0)) errs.value = 'Enter a value greater than 0';
    if (form.type === 'PERCENT' && Number(form.value) > 100) errs.value = 'A percentage cannot exceed 100';
    if (form.startDate && form.endDate && form.endDate < form.startDate) errs.endDate = 'Must be on or after the start date';
    if (form.scope === 'PRODUCT' && !form.productIds.length) errs.productIds = 'Choose at least one product';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const n = (v) => (v === '' || v === null ? null : Number(v));
    save.mutate({ id: form.id, name: form.name, code: form.code || null, type: form.type, value: Number(form.value), scope: form.scope,
      minPurchase: n(form.minPurchase), minQuantity: n(form.minQuantity), startDate: form.startDate || null, endDate: form.endDate || null,
      usageLimit: n(form.usageLimit), productIds: form.scope === 'PRODUCT' ? form.productIds : [] }, { onError: (err) => setErrors(fieldErrors(err)) });
  };
  const toggleProduct = (id) => setForm((f) => ({ ...f, productIds: f.productIds.includes(id) ? f.productIds.filter((x) => x !== id) : [...f.productIds, id] }));

  const columns = [
    { key: 'name', header: 'Discount', render: (d) => <span><span className="font-medium">{d.name}</span>{d.code && <span className="ml-2 font-mono text-xs text-muted">{d.code}</span>}</span> },
    { key: 'value', header: 'Value', align: 'right', render: (d) => <span className="tabular font-medium">{d.type === 'PERCENT' ? `${Number(d.value)}%` : money(d.value)}</span> },
    { key: 'scope', header: 'Applies to', render: (d) => (d.scope === 'SUBSCRIPTION' ? 'Whole subscription' : d.products.map((p) => p.name).join(', ')), className: 'max-w-[220px] truncate' },
    { key: 'conditions', header: 'Conditions', render: (d) => [d.minQuantity && `${d.minQuantity}+ units`, d.minPurchase && `over ${money(d.minPurchase)}`].filter(Boolean).join(' · ') || <span className="text-faint">None</span>, className: 'text-muted' },
    { key: 'window', header: 'Valid', render: (d) => (d.startDate || d.endDate ? `${d.startDate ? date(d.startDate) : 'Now'} – ${d.endDate ? date(d.endDate) : 'no end'}` : 'Always'), className: 'text-muted' },
    { key: 'usage', header: 'Used', render: (d) => (
      <div className="w-24">
        <span className="tabular text-sm">{d.usedCount}{d.usageLimit ? ` / ${d.usageLimit}` : ''}</span>
        {d.usageLimit && <div className="mt-1 h-1 rounded-full bg-line"><div className="h-1 rounded-full bg-brand" style={{ width: `${Math.min(100, (d.usedCount / d.usageLimit) * 100)}%` }} /></div>}
      </div>) },
    { key: 'status', header: 'Status', render: (d) => <Badge tone={STATUS_TONE[d.status]}>{STATUS_LABEL[d.status]}</Badge> },
    isAdmin && { key: 'actions', header: '', align: 'right', render: (d) => (
      <div className="flex justify-end gap-1">
        <Button size="sm" variant="ghost" onClick={() => { setErrors({}); setForm({ ...d, code: d.code ?? '', value: Number(d.value), minPurchase: d.minPurchase ?? '', minQuantity: d.minQuantity ?? '',
          usageLimit: d.usageLimit ?? '', startDate: toInputDate(d.startDate), endDate: toInputDate(d.endDate), productIds: d.products.map((p) => p.id) }); }}>Edit</Button>
        {d.isActive && <Button size="sm" variant="danger-ghost" onClick={() => archive.mutate(d.id)}>Archive</Button>}
      </div>) },
  ].filter(Boolean);

  const productOptions = (products.data?.data ?? []).filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()));
  return (
    <>
      <PageHeader title="Discounts" description="Applied automatically on the next invoice while valid, and stop on their own when they expire or run out."
        actions={isAdmin && <Button icon={Plus} onClick={() => { setErrors({}); setForm(EMPTY); }}>Create discount</Button>} />
      {!isAdmin && <p className="mb-4 rounded-md bg-info-soft px-3 py-2 text-sm text-info">Only admins can create or change discounts.</p>}
      <Toolbar>
        <SearchInput value={t.params.search} onChange={(v) => t.setParam('search', v)} placeholder="Search name or code" />
        <Tabs value={t.params.scope} onChange={(v) => t.setParam('scope', v)} items={[{ value: '', label: 'All' }, { value: 'SUBSCRIPTION', label: 'Subscription' }, { value: 'PRODUCT', label: 'Product' }]} />
      </Toolbar>
      <DataTable columns={columns} rows={t.rows} meta={t.meta} loading={t.isLoading} error={t.error} onPage={(p) => t.setParam('page', p)}
        empty={{ icon: BadgePercent, title: 'No discounts yet', description: 'Reward larger orders, e.g. 10% off 10 or more seats.' }} />

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? `Edit ${form.name}` : 'Create discount'} sheet
        footer={<><Button variant="secondary" onClick={() => setForm(null)}>Cancel</Button><Button type="submit" form="discount-form" loading={save.isPending}>{form?.id ? 'Save discount' : 'Create discount'}</Button></>}>
        {form && (
          <form id="discount-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
            <Input className="sm:col-span-2" label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} placeholder="10% off 10+ seats" />
            <Input label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} hint="Optional" />
            <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} options={[{ value: 'PERCENT', label: 'Percentage' }, { value: 'FIXED', label: 'Fixed amount' }]} />
            <Input label={form.type === 'PERCENT' ? 'Percent off' : 'Amount off'} type="number" min="0" step="0.01" required value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} error={errors.value} />
            <Select label="Applies to" value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })}
              options={[{ value: 'SUBSCRIPTION', label: 'Whole subscription' }, { value: 'PRODUCT', label: 'Specific products' }]}
              hint={form.scope === 'PRODUCT' ? 'Applies automatically to matching lines' : 'Attach it to a subscription'} />
            <Input label="Minimum purchase" type="number" min="0" value={form.minPurchase} onChange={(e) => setForm({ ...form, minPurchase: e.target.value })} hint="Optional" />
            <Input label="Minimum quantity" type="number" min="1" value={form.minQuantity} onChange={(e) => setForm({ ...form, minQuantity: e.target.value })} hint="Optional" />
            <Input label="Usage limit" type="number" min="1" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} hint="Invoices it may apply to; empty = unlimited" />
            <Input label="Starts" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <Input label="Ends" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} error={errors.endDate} />
            {form.scope === 'PRODUCT' && (
              <fieldset className="rounded-lg border border-line p-4 sm:col-span-2">
                <legend className="px-1 text-sm font-semibold">Products ({form.productIds.length} selected)</legend>
                <Input aria-label="Filter products" placeholder="Filter products" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} />
                <div className="mt-3 grid max-h-48 gap-2 overflow-y-auto sm:grid-cols-2">
                  {productOptions.map((p) => <Checkbox key={p.id} label={p.name} checked={form.productIds.includes(p.id)} onChange={() => toggleProduct(p.id)} />)}
                </div>
                {errors.productIds && <p role="alert" className="mt-2 text-sm text-bad">{errors.productIds}</p>}
              </fieldset>
            )}
          </form>
        )}
      </Modal>
    </>
  );
}
