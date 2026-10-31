import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, Plus, Trash2 } from 'lucide-react';
import { productsApi, taxesApi } from '../../api/endpoints.js';
import { fieldErrors } from '../../api/client.js';
import { useAction, useTable } from '../../hooks/useApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { PRODUCT_TYPES } from '../../lib/constants.js';
import { money } from '../../lib/format.js';
import { Badge, Button, DataTable, IconButton, Input, Modal, Money, PageHeader, SearchInput, Select, Tabs, Textarea, Toolbar } from '../../components/ui/index.js';

const EMPTY = { name: '', type: 'SOFTWARE', salesPrice: '', costPrice: '', taxId: '', notes: '', variants: [] };

export default function Products() {
  const { isAdmin } = useAuth();
  const t = useTable('products', productsApi.list, { type: '' });
  const taxes = useQuery({ queryKey: ['taxes', 'all'], queryFn: () => taxesApi.list({ pageSize: 100 }) });
  const [form, setForm] = useState(null);
  const [variant, setVariant] = useState({ attribute: 'Brand', value: '', extraPrice: '' });
  const [errors, setErrors] = useState({});

  const save = useAction(async ({ id, variants, ...body }) => {
    if (id) return productsApi.update(id, body);
    const created = await productsApi.create(body);
    for (const v of variants) await productsApi.addVariant(created.data.id, v); // variants added while creating
    return created;
  }, { success: (_r, v) => (v.id ? 'Product updated' : 'Product added'), invalidate: ['products'], onSuccess: () => setForm(null) });
  const archive = useAction((id) => productsApi.archive(id), { success: 'Product archived', invalidate: ['products'] });

  // Variants on an existing product are saved immediately; on a new product they are queued until "Add product".
  async function addVariant() {
    if (!variant.attribute.trim() || !variant.value.trim()) return setErrors({ variant: 'Enter both an attribute and a value' });
    const v = { attribute: variant.attribute.trim(), value: variant.value.trim(), extraPrice: Number(variant.extraPrice || 0) };
    if (form.variants.some((x) => x.attribute === v.attribute && x.value === v.value)) return setErrors({ variant: 'This variant already exists' });
    try {
      const saved = form.id ? (await productsApi.addVariant(form.id, v)).data : { ...v, id: `new-${Date.now()}` };
      setForm((f) => ({ ...f, variants: [...f.variants, saved] }));
      setVariant({ ...variant, value: '', extraPrice: '' }); setErrors({});
      if (form.id) t.refetch();
    } catch (err) { setErrors({ variant: err.message }); }
  }
  async function removeVariant(v) {
    try {
      if (form.id) { await productsApi.removeVariant(form.id, v.id); t.refetch(); }
      setForm((f) => ({ ...f, variants: f.variants.filter((x) => x.id !== v.id) }));
    } catch (err) { setErrors({ variant: err.message }); }
  }

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (form.name.trim().length < 2) errs.name = 'Enter a product name';
    if (form.salesPrice === '' || Number(form.salesPrice) < 0) errs.salesPrice = 'Enter a sales price';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    save.mutate({
      id: form.id, name: form.name, type: form.type, salesPrice: Number(form.salesPrice), costPrice: Number(form.costPrice || 0),
      taxId: form.taxId ? Number(form.taxId) : null, notes: form.notes || null,
      variants: form.id ? [] : form.variants.map(({ attribute, value, extraPrice }) => ({ attribute, value, extraPrice })),
    }, { onError: (err) => setErrors(fieldErrors(err)) });
  };

  const columns = [
    { key: 'name', header: 'Product', render: (p) => (
      <div>
        <span className="font-medium">{p.name}</span>
        {p.variants.length > 0 && <div className="mt-1 flex flex-wrap gap-1">{p.variants.map((v) => <span key={v.id} className="rounded bg-sunken px-1.5 py-0.5 text-xs text-muted">{v.value} · +{money(v.extraPrice)}</span>)}</div>}
      </div>) },
    { key: 'type', header: 'Type', render: (p) => <Badge tone="neutral">{PRODUCT_TYPES.find((x) => x.value === p.type)?.label}</Badge> },
    { key: 'sales', header: 'Sales price', align: 'right', render: (p) => <Money className="font-medium" value={p.salesPrice} /> },
    { key: 'cost', header: 'Cost', align: 'right', render: (p) => <span><Money muted value={p.costPrice} /><span className="block text-xs text-ok">{money(p.salesPrice - p.costPrice)} margin</span></span> },
    { key: 'tax', header: 'Tax', render: (p) => p.tax?.name ?? <span className="text-faint">None</span> },
    { key: 'used', header: 'In subscriptions', align: 'right', render: (p) => p._count?.subscriptionLines ?? 0, className: 'text-muted' },
    isAdmin && { key: 'actions', header: '', align: 'right', render: (p) => (
      <div className="flex justify-end gap-1">
        <Button size="sm" variant="ghost" onClick={() => { setErrors({}); setForm({ ...p, salesPrice: Number(p.salesPrice), costPrice: Number(p.costPrice), taxId: p.taxId ?? '', notes: p.notes ?? '' }); }}>Edit</Button>
        <Button size="sm" variant="danger-ghost" onClick={() => archive.mutate(p.id)}>Archive</Button>
      </div>) },
  ].filter(Boolean);

  return (
    <>
      <PageHeader title="Products" description="What Brightloop sells. Prices here are the starting point for every subscription line."
        actions={isAdmin && <Button icon={Plus} onClick={() => { setErrors({}); setForm(EMPTY); }}>Add product</Button>} />
      <Toolbar>
        <SearchInput value={t.params.search} onChange={(v) => t.setParam('search', v)} placeholder="Search products" />
        <Tabs value={t.params.type} onChange={(v) => t.setParam('type', v)} items={[{ value: '', label: 'All' }, ...PRODUCT_TYPES]} />
      </Toolbar>
      <DataTable columns={columns} rows={t.rows} meta={t.meta} loading={t.isLoading} error={t.error} onPage={(p) => t.setParam('page', p)}
        empty={{ icon: Package, title: 'No products yet', description: isAdmin ? 'Add your first product to start building plans and quotations.' : 'An admin has not added products yet.' }} />

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? `Edit ${form.name}` : 'Add product'} size="lg"
        footer={<><Button variant="secondary" onClick={() => setForm(null)}>Cancel</Button><Button type="submit" form="product-form" loading={save.isPending}>{form?.id ? 'Save product' : 'Add product'}</Button></>}>
        {form && (
          <form id="product-form" onSubmit={submit} noValidate className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input className="sm:col-span-2" label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
              <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} options={PRODUCT_TYPES} />
              <Select label="Default tax" value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} placeholder="No tax"
                options={(taxes.data?.data ?? []).filter((x) => x.isActive).map((x) => ({ value: x.id, label: x.name }))} />
              <Input label="Sales price" type="number" min="0" step="0.01" required value={form.salesPrice} onChange={(e) => setForm({ ...form, salesPrice: e.target.value })} error={errors.salesPrice} />
              <Input label="Cost price" type="number" min="0" step="0.01" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                hint={form.salesPrice !== '' ? `Margin ${money(Number(form.salesPrice) - Number(form.costPrice || 0))}` : undefined} />
              <Textarea className="sm:col-span-2" label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <fieldset className="rounded-lg border border-line p-4">
              <legend className="px-1 text-sm font-semibold">Variants</legend>
              <p className="mb-3 text-sm text-muted">Options that change the price, e.g. Brand: Odoo adds ₹560.</p>
              {form.variants.length > 0 && (
                <ul className="mb-3 divide-y divide-line rounded-md border border-line">
                  {form.variants.map((v) => (
                    <li key={v.id} className="flex items-center justify-between px-3 py-2 text-base">
                      <span><span className="text-muted">{v.attribute}:</span> {v.value}</span>
                      <span className="flex items-center gap-3"><span className="tabular">+{money(v.extraPrice)}</span><IconButton icon={Trash2} label={`Remove ${v.value}`} onClick={() => removeVariant(v)} /></span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="grid grid-cols-[1fr_1fr_120px_auto] items-end gap-2">
                <Input label="Attribute" value={variant.attribute} onChange={(e) => setVariant({ ...variant, attribute: e.target.value })} />
                <Input label="Value" value={variant.value} placeholder="Odoo" onChange={(e) => setVariant({ ...variant, value: e.target.value })} />
                <Input label="Extra price" type="number" min="0" value={variant.extraPrice} placeholder="560" onChange={(e) => setVariant({ ...variant, extraPrice: e.target.value })} />
                <Button variant="secondary" onClick={addVariant}>Add</Button>
              </div>
              {errors.variant && <p role="alert" className="mt-2 text-sm text-bad">{errors.variant}</p>}
            </fieldset>
          </form>
        )}
      </Modal>
    </>
  );
}
