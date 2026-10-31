import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ImagePlus, Package, Plus, Trash2 } from 'lucide-react';
import { productsApi, taxesApi } from '../../api/endpoints.js';
import { fieldErrors } from '../../api/client.js';
import { useAction, useTable } from '../../hooks/useApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { PRODUCT_TYPES } from '../../lib/constants.js';
import { money } from '../../lib/format.js';
import { Badge, Button, Checkbox, DataTable, IconButton, Input, Modal, Money, PageHeader, SearchInput, Select, Tabs, Textarea, Toolbar } from '../../components/ui/index.js';
import { ServiceArt, ServiceIcon, SERVICE_KINDS } from '../../components/brand/ServiceArt.jsx';

/** Resize any picked photo to a 16:10 JPEG (960×600, ~100 KB) in the browser, so uploads stay small and safe. */
async function photoToDataUrl(file) {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) throw new Error('Choose a PNG, JPEG or WebP photo');
  if (file.size > 15 * 1024 * 1024) throw new Error('Choose a photo under 15 MB');
  const bmp = await createImageBitmap(file);
  const W = 960, H = 600, scale = Math.max(W / bmp.width, H / bmp.height);
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
  ctx.drawImage(bmp, (W - bmp.width * scale) / 2, (H - bmp.height * scale) / 2, bmp.width * scale, bmp.height * scale);
  return c.toDataURL('image/jpeg', 0.82);
}

const ART_OPTIONS = Object.entries(SERVICE_KINDS).map(([value, k]) => ({ value, label: k.label }));

const EMPTY = { name: '', type: 'SOFTWARE', salesPrice: '', costPrice: '', taxId: '', notes: '', variants: [], tagline: '', featuresText: '', artKey: '', imageUrl: '', inCatalog: true };

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
      tagline: form.tagline.trim() || null, artKey: form.artKey || null, imageUrl: form.imageUrl.trim() || null, inCatalog: !!form.inCatalog,
      features: form.featuresText.split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 6),
      variants: form.id ? [] : form.variants.map(({ attribute, value, extraPrice }) => ({ attribute, value, extraPrice })),
    }, { onError: (err) => setErrors(fieldErrors(err)) });
  };

  const columns = [
    { key: 'name', header: 'Product', render: (p) => (
      <div>
        <span className="flex items-center gap-3">{p.imageUrl ? <img src={p.imageUrl} alt="" className="h-9 w-14 shrink-0 rounded-md object-cover" /> : <span className="w-14 shrink-0"><ServiceArt artKey={p.artKey} rounded="rounded-md" /></span>}<span><span className="font-medium">{p.name}</span>{p.inCatalog && <span className="ml-2 rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">In customer catalog</span>}{p.tagline && <span className="block text-sm text-muted">{p.tagline}</span>}</span></span>
        {p.variants.length > 0 && <div className="mt-1 flex flex-wrap gap-1">{p.variants.map((v) => <span key={v.id} className="rounded bg-sunken px-1.5 py-0.5 text-xs text-muted">{v.value} · +{money(v.extraPrice)}</span>)}</div>}
      </div>) },
    { key: 'type', header: 'Type', render: (p) => <Badge tone="neutral">{PRODUCT_TYPES.find((x) => x.value === p.type)?.label}</Badge> },
    { key: 'sales', header: 'Sales price', align: 'right', render: (p) => <Money className="font-medium" value={p.salesPrice} /> },
    { key: 'cost', header: 'Cost', align: 'right', render: (p) => <span><Money muted value={p.costPrice} /><span className="block text-xs text-ok">{money(p.salesPrice - p.costPrice)} margin</span></span> },
    { key: 'tax', header: 'Tax', render: (p) => p.tax?.name ?? <span className="text-faint">None</span> },
    { key: 'used', header: 'In subscriptions', align: 'right', render: (p) => p._count?.subscriptionLines ?? 0, className: 'text-muted' },
    isAdmin && { key: 'actions', header: '', align: 'right', render: (p) => (
      <div className="flex justify-end gap-1">
        <Button size="sm" variant="ghost" onClick={() => { setErrors({}); setForm({ ...p, salesPrice: Number(p.salesPrice), costPrice: Number(p.costPrice), taxId: p.taxId ?? '', notes: p.notes ?? '', tagline: p.tagline ?? '', featuresText: (p.features ?? []).join('\n'), artKey: p.artKey ?? '', imageUrl: p.imageUrl ?? '' }); }}>Edit</Button>
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

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? `Edit ${form.name}` : 'Add product'} sheet
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
              <Textarea className="sm:col-span-2" label="Notes" hint="Start with “Per user”, “Per device”… and customers see the price per user or device." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <fieldset className="rounded-lg border border-line p-4">
              <legend className="px-1 text-sm font-semibold">Customer catalog</legend>
              <Checkbox label="Show in “Add a service” for customers" hint="Customers can request it; you then send them an offer." checked={!!form.inCatalog} onChange={(e) => setForm({ ...form, inCatalog: e.target.checked })} />
              <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_240px]">
                <div className="space-y-4">
                  <Input label="One-line description" maxLength={140} placeholder="Protection for your team’s phones and laptops." value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
                  <Textarea label="What the customer gets (one per line, up to 6)" value={form.featuresText} onChange={(e) => setForm({ ...form, featuresText: e.target.value })} />
                  <Select label="Drawing (used when there is no photo)" value={form.artKey} onChange={(e) => setForm({ ...form, artKey: e.target.value })} placeholder="Plain icon" options={ART_OPTIONS} />
                </div>
                <div>
                  <p className="label">Product photo</p>
                  <ServiceArt artKey={form.artKey} imageUrl={/^(https:\/\/|data:image\/)/.test(form.imageUrl) ? form.imageUrl : null} />
                  <div className="mt-2 flex flex-wrap gap-2">
                    <label className="pressable inline-flex h-9 cursor-pointer items-center gap-1.5 rounded border border-line bg-surface px-3 text-sm font-semibold hover:bg-ground">
                      <ImagePlus className="size-4" aria-hidden />{form.imageUrl ? 'Change photo' : 'Upload photo'}
                      <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={async (e) => {
                        const f = e.target.files?.[0]; e.target.value = '';
                        if (!f) return;
                        try { const url = await photoToDataUrl(f); setForm((x) => ({ ...x, imageUrl: url })); setErrors((er) => ({ ...er, imageUrl: undefined })); }
                        catch (err) { setErrors((er) => ({ ...er, imageUrl: err.message })); }
                      }} />
                    </label>
                    {form.imageUrl && <Button size="sm" variant="ghost" onClick={() => setForm({ ...form, imageUrl: '' })}>Remove photo</Button>}
                  </div>
                  {errors.imageUrl ? <p role="alert" className="mt-1 text-sm text-bad">{errors.imageUrl}</p>
                    : <p className="mt-1 text-sm text-muted">Shown to customers in “Add a service”. Without a photo, the drawing is used.</p>}
                </div>
              </div>
            </fieldset>
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
              <div className="grid grid-cols-2 items-end gap-2 sm:grid-cols-[1fr_1fr_120px_auto]">
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
