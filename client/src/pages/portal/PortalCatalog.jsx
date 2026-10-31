// "Add a service" — the customer browses what we offer (picture, what it does, what it costs) and asks for it.
// Nothing is charged here: the request lands with their account manager, who sends an offer to approve.
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, CheckCircle2, Minus, Plus, Send } from 'lucide-react';
import { portalApi } from '../../api/endpoints.js';
import { useAction } from '../../hooks/useApi.js';
import { BILLING_PERIODS } from '../../lib/constants.js';
import { money } from '../../lib/format.js';
import { Button, Modal, Spinner, Textarea, EmptyState } from '../../components/ui/index.js';
import { ServiceArt, ServiceIcon, kindOf } from '../../components/brand/ServiceArt.jsx';

const unitOf = (p) => (p.notes?.match(/^Per (\w+)/i)?.[1] ?? '').toLowerCase(); // "Per device per period" → "device"
const periodUnit = (plan) => BILLING_PERIODS.find((b) => b.value === plan.billingPeriod)?.unit ?? 'period';
const STEPS = ['Choose a service', 'We send you an offer', 'You approve, it starts'];

function ServiceCard({ p, owned, onChoose }) {
  const k = kindOf(p.artKey);
  const unit = unitOf(p);
  return (
    <li className="card flex flex-col overflow-hidden p-0">
      <button type="button" onClick={onChoose} className="group block text-left" aria-label={`Choose ${p.name}`} tabIndex={-1}>
        <ServiceArt artKey={p.artKey} imageUrl={p.imageUrl} rounded="rounded-none" className="transition-transform duration-300 ease-out group-hover:scale-[1.02]" />
      </button>
      <div className="flex flex-1 flex-col p-5">
        <p className="flex items-center gap-2 text-sm font-medium" style={{ color: k.ink }}>
          <ServiceIcon artKey={p.artKey} size={24} className="rounded-md" />{k.label}
          {owned && <span className="ml-auto rounded-full bg-ok-soft px-2 py-0.5 text-xs font-semibold text-ok">You have this</span>}
        </p>
        <h2 className="mt-3 text-lg font-semibold leading-snug">{p.name}</h2>
        {p.tagline && <p className="mt-1 text-base text-muted">{p.tagline}</p>}
        {p.features?.length > 0 && (
          <ul className="mt-4 space-y-1.5 text-sm">
            {p.features.slice(0, 3).map((f) => (
              <li key={f} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden />{f}</li>
            ))}
          </ul>
        )}
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <p className="leading-tight">
            <span className="text-sm text-muted">From </span>
            <span className="text-lg font-bold tabular">{money(p.salesPrice)}</span>
            <span className="block text-sm text-muted">{unit ? `per ${unit}, ` : ''}each billing period + tax</span>
          </p>
          <Button size="sm" variant={owned ? 'secondary' : 'primary'} onClick={onChoose}>{owned ? 'Add more' : 'Choose'}</Button>
        </div>
      </div>
    </li>
  );
}

function RequestSheet({ product, plans, onClose }) {
  const qc = useQueryClient();
  const [planId, setPlanId] = useState(() => (plans.find((p) => p.billingPeriod === 'MONTHLY') ?? plans[0])?.id);
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? null);
  const plan = plans.find((p) => p.id === planId);
  const min = plan?.minQuantity ?? 1;
  const [qty, setQty] = useState(Math.max(1, min));
  const [note, setNote] = useState('');
  const [done, setDone] = useState(null);
  const quantity = Math.max(qty, min);
  const variant = product.variants.find((v) => v.id === variantId);
  const unitPrice = Number(product.salesPrice) + Number(variant?.extraPrice || 0);
  const estimate = unitPrice * quantity + Number(plan?.price || 0);
  const unit = unitOf(product) || 'unit';

  const send = useAction(() => portalApi.request({ productId: product.id, variantId, planId, quantity, note: note.trim() || null }), {
    invalidate: ['portal'],
    onSuccess: (res) => { setDone(res.data); qc.invalidateQueries({ queryKey: ['portal'] }); },
  });

  return (
    <Modal open onClose={onClose} sheet title={done ? 'Request sent' : product.name} description={done ? undefined : product.tagline}
      footer={done
        ? <><Link to="/portal/subscriptions" className="btn-link pressable inline-flex h-11 items-center rounded px-4 font-semibold text-brand hover:bg-brand-soft">See my plans</Link><Button onClick={onClose}>Done</Button></>
        : <><Button variant="secondary" onClick={onClose}>Not now</Button><Button icon={Send} loading={send.isPending} disabled={!plan} onClick={() => send.mutate()}>Send request</Button></>}>
      {done ? (
        <div className="py-6 text-center">
          <CheckCircle2 className="mx-auto size-12 text-ok" aria-hidden />
          <p className="mt-4 text-lg font-semibold">We’ve got your request for {product.name}</p>
          <p className="mx-auto mt-2 max-w-sm text-base text-muted">Your account manager will check the price and send you an offer. You’ll see it on Home as <b className="text-ink">Awaiting your approval</b>. Nothing is charged until you approve.</p>
          <p className="mt-4 text-sm text-muted">Reference {done.number}</p>
        </div>
      ) : (
        <div className="space-y-6">
          <ServiceArt artKey={product.artKey} imageUrl={product.imageUrl} />
          {product.features?.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold">What you get</h3>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                {product.features.map((f) => <li key={f} className="flex gap-2 text-base"><Check className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden />{f}</li>)}
              </ul>
            </section>
          )}

          <fieldset>
            <legend className="text-sm font-semibold">How often do you want to pay?</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {plans.map((p) => (
                <label key={p.id} className={`pressable cursor-pointer rounded-lg border p-3 ${p.id === planId ? 'border-brand bg-brand-soft ring-1 ring-brand' : 'border-line hover:bg-sunken'}`}>
                  <input type="radio" name="plan" className="sr-only" checked={p.id === planId} onChange={() => setPlanId(p.id)} />
                  <span className="block font-semibold">Every {periodUnit(p)}</span>
                  <span className="block text-sm text-muted">{p.name}</span>
                  {(p.minQuantity > 1 || Number(p.price) > 0) && (
                    <span className="mt-1 block text-xs text-muted">{[p.minQuantity > 1 && `At least ${p.minQuantity}`, Number(p.price) > 0 && `${money(p.price)} plan fee`].filter(Boolean).join(' · ')}</span>
                  )}
                </label>
              ))}
            </div>
          </fieldset>

          {product.variants.length > 0 && (
            <fieldset>
              <legend className="text-sm font-semibold">{product.variants[0].attribute}</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <label key={v.id} className={`pressable cursor-pointer rounded-full border px-4 py-2 text-base ${v.id === variantId ? 'border-brand bg-brand-soft font-semibold text-brand' : 'border-line hover:bg-sunken'}`}>
                    <input type="radio" name="variant" className="sr-only" checked={v.id === variantId} onChange={() => setVariantId(v.id)} />
                    {v.value}{Number(v.extraPrice) > 0 && <span className="ml-1 text-sm font-normal text-muted">+{money(v.extraPrice)}</span>}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <div>
            <p id="qty-label" className="text-sm font-semibold">How many {unit}s?</p>
            <div className="mt-2 inline-flex items-center rounded-lg border border-line" role="group" aria-labelledby="qty-label">
              <button type="button" className="pressable p-3 text-muted hover:text-ink disabled:opacity-40" aria-label="One fewer" disabled={quantity <= min} onClick={() => setQty(quantity - 1)}><Minus className="size-4" /></button>
              <input aria-labelledby="qty-label" inputMode="numeric" className="w-14 border-x border-line bg-transparent py-2 text-center text-lg font-semibold tabular outline-none"
                value={quantity} onChange={(e) => setQty(Math.min(500, Math.max(1, parseInt(e.target.value, 10) || 1)))} />
              <button type="button" className="pressable p-3 text-muted hover:text-ink" aria-label="One more" onClick={() => setQty(Math.min(500, quantity + 1))}><Plus className="size-4" /></button>
            </div>
            {min > 1 && <p className="mt-1 text-sm text-muted">This plan starts at {min}.</p>}
          </div>

          <Textarea label="Anything we should know? (optional)" placeholder="For example: for our two new designers" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />

          <div className="rounded-xl bg-sunken p-4" aria-live="polite">
            <p className="flex items-baseline justify-between gap-3">
              <span className="text-base text-muted">Estimated price</span>
              <span className="text-xl font-bold tabular">{money(estimate)}<span className="ml-1 text-sm font-normal text-muted">/ {plan ? periodUnit(plan) : 'period'}</span></span>
            </p>
            <p className="mt-1 text-sm text-muted">{quantity} × {money(unitPrice)}{Number(plan?.price) > 0 ? ` + ${money(plan.price)} plan fee` : ''}, before tax ({product.tax?.name ?? 'tax'}). Your account manager confirms the final price, including any discounts.</p>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function PortalCatalog() {
  const q = useQuery({ queryKey: ['portal', 'catalog'], queryFn: portalApi.catalog, staleTime: 60_000 });
  const mine = useQuery({ queryKey: ['portal', 'subs', 'all'], queryFn: () => portalApi.subscriptions({ pageSize: 50 }) });
  const [chosen, setChosen] = useState(null);
  const products = q.data?.data.products ?? [];
  const plans = q.data?.data.plans ?? [];
  const owned = useMemo(() => new Set((mine.data?.data ?? []).filter((s) => ['ACTIVE', 'PAUSED', 'CONFIRMED'].includes(s.status))
    .flatMap((s) => s.lines.map((l) => l.product.name))), [mine.data]);

  return (
    <>
      <h1 className="text-2xl font-semibold">Add a service</h1>
      <p className="mt-1 max-w-2xl text-base text-muted">Pick what your team needs. Nothing is charged now — we send you an offer to approve first.</p>
      <ol className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm" aria-label="How it works">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand">{i + 1}</span>{s}
          </li>
        ))}
      </ol>
      {q.isLoading ? <Spinner /> : q.isError ? (
        <EmptyState title="We couldn't load the services" description={`${q.error?.message ?? 'Please try again.'} Refresh the page in a moment.`} />
      ) : products.length === 0 ? (
        <EmptyState title="Nothing to add right now" description="Ask your account manager about other services." />
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => <ServiceCard key={p.id} p={p} owned={owned.has(p.name)} onChoose={() => setChosen(p)} />)}
        </ul>
      )}
      {chosen && <RequestSheet key={chosen.id} product={chosen} plans={plans} onClose={() => setChosen(null)} />}
    </>
  );
}
