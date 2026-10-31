import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { customersApi, discountsApi, plansApi, productsApi, subscriptionsApi, taxesApi, templatesApi } from '../../api/endpoints.js';
import { fieldErrors } from '../../api/client.js';
import { useAction } from '../../hooks/useApi.js';
import { BILLING_PERIODS } from '../../lib/constants.js';
import { money, toInputDate } from '../../lib/format.js';
import { Button, Card, EmptyState, Input, PageHeader, Select, Spinner, Textarea } from '../../components/ui/index.js';
import { LinesEditor, estimateTotals, newLine, toApiLines } from '../../components/ops/LinesEditor.jsx';

const all = (api, params = {}) => () => api.list({ pageSize: 100, ...params });
const today = () => toInputDate(new Date());
const plusDays = (n) => toInputDate(new Date(Date.now() + n * 86400000));

export default function SubscriptionForm() {
  const { id } = useParams();
  const editing = !!id;
  const [params] = useSearchParams();
  const nav = useNavigate();

  const customers = useQuery({ queryKey: ['customers', 'all'], queryFn: all(customersApi) });
  const plans = useQuery({ queryKey: ['plans', 'all'], queryFn: all(plansApi) });
  const products = useQuery({ queryKey: ['products', 'all'], queryFn: all(productsApi) });
  const taxes = useQuery({ queryKey: ['taxes', 'all'], queryFn: all(taxesApi) });
  const templates = useQuery({ queryKey: ['templates', 'all'], queryFn: all(templatesApi) });
  const discounts = useQuery({ queryKey: ['discounts', 'valid-sub'], queryFn: all(discountsApi, { valid: 'true', scope: 'SUBSCRIPTION' }) });
  const existing = useQuery({ queryKey: ['subscription', id], queryFn: () => subscriptionsApi.get(id), enabled: editing });

  const [f, setF] = useState({ templateId: '', customerId: '', planId: '', startDate: today(), expiryDate: '', paymentTermDays: 15, quotationValidUntil: plusDays(30), discountId: '', notes: '' });
  const [lines, setLines] = useState([newLine()]);
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const productList = products.data?.data ?? [];
  const taxList = (taxes.data?.data ?? []).filter((t) => t.isActive);
  const plan = (plans.data?.data ?? []).find((p) => String(p.id) === String(f.planId));

  // Edit mode: load the record into the form
  useEffect(() => {
    const s = existing.data?.data;
    if (!s) return;
    setF({ templateId: s.templateId || '', customerId: s.customerId, planId: s.planId, startDate: toInputDate(s.startDate), expiryDate: toInputDate(s.expiryDate),
      paymentTermDays: s.paymentTermDays, quotationValidUntil: toInputDate(s.quotationValidUntil), discountId: s.discountId || '', notes: s.notes || '' });
    setLines(s.lines.map((l) => newLine({ productId: l.productId, variantId: l.variantId || '', quantity: l.quantity, unitPrice: Number(l.unitPrice), taxId: l.taxId || '' })));
  }, [existing.data]);

  async function applyTemplate(templateId) {
    setF((x) => ({ ...x, templateId }));
    if (!templateId) return;
    const { data: t } = await templatesApi.get(templateId);
    setF((x) => ({ ...x, templateId, planId: t.planId, quotationValidUntil: plusDays(t.validityDays), notes: x.notes || t.notes || '' }));
    setLines(t.lines.map((l) => {
      const p = productList.find((x) => x.id === l.productId) || l.product;
      return newLine({ productId: l.productId, variantId: l.variantId || '', quantity: l.quantity,
        unitPrice: Number(p?.salesPrice || 0) + Number(l.variant?.extraPrice || 0), taxId: p?.taxId ?? '' });
    }));
  }

  // ?templateId=… from the Templates page
  useEffect(() => {
    const t = params.get('templateId');
    if (t && !editing && products.isSuccess) applyTemplate(t);
  }, [products.isSuccess]);

  const est = useMemo(() => estimateTotals(lines, taxList), [lines, taxList]);
  const save = useAction((body) => (editing ? subscriptionsApi.update(id, body) : subscriptionsApi.create(body)), {
    success: editing ? 'Subscription updated' : 'Subscription created as draft', invalidate: ['subscriptions', 'subscription'],
    onSuccess: (r) => nav(`/subscriptions/${r.data.id}`),
  });

  function submit(e) {
    e.preventDefault();
    const errs = {};
    if (!f.customerId) errs.customerId = 'Choose a customer';
    if (!f.planId) errs.planId = 'Choose a plan';
    if (f.expiryDate && f.expiryDate <= f.startDate) errs.expiryDate = 'Expiry must be after the start date';
    const apiLines = toApiLines(lines);
    if (!apiLines.length && !Number(plan?.price)) errs.lines = 'Add at least one product line';
    if (plan && apiLines.some((l) => l.quantity < plan.minQuantity)) errs.lines = `Each line needs at least ${plan.minQuantity} units on the ${plan.name} plan`;
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const body = {
      customerId: Number(f.customerId), planId: Number(f.planId), startDate: f.startDate, expiryDate: f.expiryDate || null,
      paymentTermDays: Number(f.paymentTermDays), quotationValidUntil: f.quotationValidUntil || null,
      discountId: f.discountId ? Number(f.discountId) : null, notes: f.notes || null, lines: apiLines,
      ...(!editing && f.templateId && { templateId: Number(f.templateId) }),
    };
    save.mutate(body, { onError: (err) => setErrors(fieldErrors(err)) });
  }

  if (editing && existing.isLoading) return <Spinner />;
  const s = existing.data?.data;
  if (editing && s && !['DRAFT', 'QUOTATION'].includes(s.status)) {
    return <EmptyState title="This subscription can no longer be edited" description="Only drafts and quotations can be changed. Use the actions on the subscription page instead."
      action={<Link className="text-brand hover:underline" to={`/subscriptions/${id}`}>Back to {s.number}</Link>} />;
  }

  const back = <Link to={editing ? `/subscriptions/${id}` : '/subscriptions'} className="mb-2 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft className="size-4" />{editing ? s?.number : 'Subscriptions'}</Link>;
  return (
    <form onSubmit={submit} noValidate>
      <PageHeader back={back} title={editing ? `Edit ${s?.number}` : 'New subscription'}
        description={editing ? 'Changes apply before the customer confirms.' : 'Saved as a draft. Send it as a quotation when it is ready.'} />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card title="Customer & plan">
            <div className="grid gap-4 sm:grid-cols-2">
              {!editing && (
                <Select className="sm:col-span-2" label="Start from a quotation template" value={f.templateId} onChange={(e) => applyTemplate(e.target.value)}
                  placeholder="No template — build from scratch" options={(templates.data?.data ?? []).map((t) => ({ value: t.id, label: `${t.name} · ${t.plan.name}` }))}
                  hint="Fills in the plan, product lines and validity for you." />
              )}
              <Select label="Customer" required value={f.customerId} onChange={set('customerId')} error={errors.customerId} placeholder="Choose a customer…"
                options={(customers.data?.data ?? []).map((c) => ({ value: c.id, label: c.company && c.company !== c.name ? `${c.name} (${c.company})` : c.name }))}
                hint={<>Not listed? <Link to="/customers" className="text-brand hover:underline">Add a customer</Link></>} />
              <Select label="Plan" required value={f.planId} onChange={set('planId')} error={errors.planId} placeholder="Choose a plan…"
                options={(plans.data?.data ?? []).map((p) => ({ value: p.id, label: `${p.name} · ${BILLING_PERIODS.find((b) => b.value === p.billingPeriod)?.label}${Number(p.price) ? ` · ${money(p.price)} fee` : ''}` }))}
                hint={plan ? `Min quantity ${plan.minQuantity}${plan.pausable ? ' · can pause' : ''}${plan.autoClose ? ' · closes at expiry' : ''}` : undefined} />
              <Input label="Start date" type="date" required value={f.startDate} onChange={set('startDate')} error={errors.startDate} />
              <Input label="Expiry date" type="date" value={f.expiryDate} onChange={set('expiryDate')} error={errors.expiryDate} hint="Leave empty for an open-ended subscription" />
              <Input label="Payment terms (days)" type="number" min="0" max="120" value={f.paymentTermDays} onChange={set('paymentTermDays')} hint="Invoice due date = invoice date + these days" />
              <Input label="Quotation valid until" type="date" value={f.quotationValidUntil} onChange={set('quotationValidUntil')} />
            </div>
          </Card>
          <Card title="Product lines">
            {errors.lines && <p role="alert" className="mb-3 rounded-md bg-bad-soft px-3 py-2 text-sm text-bad">{errors.lines}</p>}
            <LinesEditor lines={lines} onChange={setLines} products={productList} taxes={taxList} minQuantity={plan?.minQuantity || 1} />
          </Card>
          <Card title="Notes"><Textarea aria-label="Notes" value={f.notes} onChange={set('notes')} placeholder="Visible to your team on the subscription" /></Card>
        </div>
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <Card title="Estimated per period">
            <dl className="space-y-2 text-base">
              {Number(plan?.price) > 0 && <div className="flex justify-between"><dt className="text-muted">Plan fee</dt><dd className="tabular">{money(plan.price)}</dd></div>}
              <div className="flex justify-between"><dt className="text-muted">Products</dt><dd className="tabular">{money(est.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Tax</dt><dd className="tabular">{money(est.tax)}</dd></div>
              <div className="flex justify-between border-t border-line pt-2 text-md font-semibold"><dt>Total</dt><dd className="tabular">{money(est.total + Number(plan?.price || 0))}</dd></div>
            </dl>
            <Select className="mt-5" label="Discount" value={f.discountId} onChange={set('discountId')} placeholder="No discount"
              options={(discounts.data?.data ?? []).map((d) => ({ value: d.id, label: `${d.name} (${d.type === 'PERCENT' ? `${Number(d.value)}%` : money(d.value)})` }))}
              hint="Product discounts apply automatically on each invoice." />
            <p className="mt-4 text-xs text-muted">Discounts and exact taxes are calculated on the subscription page after saving.</p>
            <Button type="submit" size="lg" className="mt-5 w-full" loading={save.isPending}>{editing ? 'Save changes' : 'Create subscription'}</Button>
          </Card>
        </aside>
      </div>
    </form>
  );
}
