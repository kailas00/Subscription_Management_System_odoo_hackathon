import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, ScrollText } from 'lucide-react';
import { plansApi, productsApi, templatesApi } from '../../api/endpoints.js';
import { fieldErrors } from '../../api/client.js';
import { useAction, useTable } from '../../hooks/useApi.js';
import { money } from '../../lib/format.js';
import { Button, DataTable, Input, Modal, PageHeader, SearchInput, Select, Textarea, Toolbar } from '../../components/ui/index.js';
import { LinesEditor, newLine, toApiLines } from '../../components/ops/LinesEditor.jsx';
import { cadence } from './Plans.jsx';

const EMPTY = { name: '', validityDays: 30, planId: '', notes: '' };

export default function Templates() {
  const nav = useNavigate();
  const t = useTable('templates', templatesApi.list);
  const plans = useQuery({ queryKey: ['plans', 'all'], queryFn: () => plansApi.list({ pageSize: 100 }) });
  const products = useQuery({ queryKey: ['products', 'all'], queryFn: () => productsApi.list({ pageSize: 100 }) });
  const [form, setForm] = useState(null);
  const [lines, setLines] = useState([]);
  const [errors, setErrors] = useState({});
  const plan = (plans.data?.data ?? []).find((p) => String(p.id) === String(form?.planId));

  const save = useAction(({ id, ...body }) => (id ? templatesApi.update(id, body) : templatesApi.create(body)), {
    success: (_r, v) => (v.id ? 'Template saved' : 'Template created'), invalidate: ['templates'], onSuccess: () => setForm(null),
  });
  const archive = useAction((id) => templatesApi.archive(id), { success: 'Template archived', invalidate: ['templates'] });

  async function openEdit(row) {
    setErrors({});
    const { data } = await templatesApi.get(row.id);
    setForm({ id: data.id, name: data.name, validityDays: data.validityDays, planId: data.planId, notes: data.notes ?? '' });
    setLines(data.lines.map((l) => newLine({ productId: l.productId, variantId: l.variantId ?? '', quantity: l.quantity })));
  }

  const productList = useMemo(() => products.data?.data ?? [], [products.data]);
  const byId = useMemo(() => new Map(productList.map((p) => [String(p.id), p])), [productList]);
  const estimate = lines.reduce((a, l) => {
    const p = byId.get(String(l.productId));
    const v = p?.variants.find((x) => String(x.id) === String(l.variantId));
    return a + Number(l.quantity || 0) * (Number(p?.salesPrice || 0) + Number(v?.extraPrice || 0));
  }, Number(plan?.price || 0));

  const submit = (e) => {
    e.preventDefault();
    const apiLines = toApiLines(lines, { simple: true });
    const errs = {};
    if (form.name.trim().length < 2) errs.name = 'Enter a template name';
    if (!form.planId) errs.planId = 'Choose a plan';
    if (!apiLines.length) errs.lines = 'Add at least one product line';
    if (plan && apiLines.some((l) => l.quantity < plan.minQuantity)) errs.lines = `Each line needs at least ${plan.minQuantity} units on this plan`;
    setErrors(errs);
    if (Object.keys(errs).length) return;
    save.mutate({ id: form.id, name: form.name, validityDays: Number(form.validityDays), planId: Number(form.planId), notes: form.notes || null, lines: apiLines },
      { onError: (err) => setErrors(fieldErrors(err)) });
  };

  const columns = [
    { key: 'name', header: 'Template', render: (x) => <span className="font-medium">{x.name}</span> },
    { key: 'plan', header: 'Plan', render: (x) => <span>{x.plan.name}<span className="block text-xs text-muted">{cadence(x.plan)}</span></span> },
    { key: 'lines', header: 'Product lines', align: 'right', render: (x) => x._count.lines },
    { key: 'valid', header: 'Quotation valid for', render: (x) => `${x.validityDays} days`, className: 'text-muted' },
    { key: 'actions', header: '', align: 'right', render: (x) => (
      <div className="flex justify-end gap-1">
        <Button size="sm" variant="secondary" onClick={() => nav(`/subscriptions/new?templateId=${x.id}`)}>Use template</Button>
        <Button size="sm" variant="ghost" onClick={() => openEdit(x)}>Edit</Button>
        <Button size="sm" variant="danger-ghost" onClick={() => archive.mutate(x.id)}>Archive</Button>
      </div>) },
  ];

  return (
    <>
      <PageHeader title="Quotation templates" description="Ready-made offers with the right plan and product lines, so quotes take seconds."
        actions={<Button icon={Plus} onClick={() => { setErrors({}); setForm(EMPTY); setLines([newLine()]); }}>Create template</Button>} />
      <Toolbar><SearchInput value={t.params.search} onChange={(v) => t.setParam('search', v)} placeholder="Search templates" /></Toolbar>
      <DataTable columns={columns} rows={t.rows} meta={t.meta} loading={t.isLoading} error={t.error} onPage={(p) => t.setParam('page', p)}
        empty={{ icon: ScrollText, title: 'No templates yet', description: 'Save your most common offer once and reuse it for every customer.' }} />

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? `Edit ${form.name}` : 'Create template'} sheet
        footer={<><span className="mr-auto self-center text-sm text-muted">List value per period: <b className="tabular text-ink">{money(estimate)}</b> before tax</span>
          <Button variant="secondary" onClick={() => setForm(null)}>Cancel</Button><Button type="submit" form="template-form" loading={save.isPending}>Save template</Button></>}>
        {form && (
          <form id="template-form" onSubmit={submit} noValidate className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <Input className="sm:col-span-3" label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} placeholder="Enterprise starter pack" />
              <Select className="sm:col-span-2" label="Plan" required value={form.planId} onChange={(e) => setForm({ ...form, planId: e.target.value })} error={errors.planId} placeholder="Choose a plan…"
                options={(plans.data?.data ?? []).map((p) => ({ value: p.id, label: `${p.name} · ${cadence(p)}` }))} hint={plan ? `Minimum quantity ${plan.minQuantity}` : undefined} />
              <Input label="Valid for (days)" type="number" min="1" max="365" value={form.validityDays} onChange={(e) => setForm({ ...form, validityDays: e.target.value })} />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">Product lines</h3>
              {errors.lines && <p role="alert" className="mb-2 text-sm text-bad">{errors.lines}</p>}
              <LinesEditor simple lines={lines} onChange={setLines} products={productList} minQuantity={plan?.minQuantity || 1} />
            </div>
            <Textarea label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </form>
        )}
      </Modal>
    </>
  );
}
