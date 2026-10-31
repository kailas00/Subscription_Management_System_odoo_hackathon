// Product lines editor used by subscriptions (with prices & taxes) and quotation templates (simple mode).
import { Plus, Trash2 } from 'lucide-react';
import { Button, IconButton, Money } from '../ui/index.js';
import { money } from '../../lib/format.js';

let seq = 0;
export const newLine = (l = {}) => ({ key: `l${++seq}`, productId: '', variantId: '', quantity: 1, unitPrice: '', taxId: '', ...l });

/** Client-side estimate (before discounts). Exact totals come from the server preview. */
export function estimateTotals(lines, taxes = []) {
  let subtotal = 0; let tax = 0;
  for (const l of lines) {
    const amount = Number(l.quantity || 0) * Number(l.unitPrice || 0);
    subtotal += amount;
    const t = taxes.find((x) => String(x.id) === String(l.taxId));
    if (t) tax += t.type === 'PERCENT' ? (amount * Number(t.rate)) / 100 : Number(t.rate) * Number(l.quantity || 0);
  }
  return { subtotal: Math.round(subtotal * 100) / 100, tax: Math.round(tax * 100) / 100, total: Math.round((subtotal + tax) * 100) / 100 };
}

export function LinesEditor({ lines, onChange, products = [], taxes = [], simple = false, minQuantity = 1, readOnly = false }) {
  const update = (key, patch) => onChange(lines.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const productOf = (id) => products.find((p) => String(p.id) === String(id));

  const pickProduct = (l, productId) => {
    const p = productOf(productId);
    update(l.key, { productId, variantId: '', unitPrice: p ? Number(p.salesPrice) : '', taxId: p?.taxId ?? p?.tax?.id ?? '' });
  };
  const pickVariant = (l, variantId) => {
    const p = productOf(l.productId);
    const v = p?.variants?.find((x) => String(x.id) === String(variantId));
    update(l.key, { variantId, unitPrice: Number(p?.salesPrice || 0) + Number(v?.extraPrice || 0) });
  };

  const cols = simple ? 'sm:grid-cols-[1fr_200px_96px_36px]' : 'sm:grid-cols-[1fr_170px_80px_120px_150px_110px_36px]';
  return (
    <div>
      <div className={`hidden gap-3 border-b border-line pb-2 text-xs font-semibold uppercase tracking-wide text-muted sm:grid ${cols}`}>
        <span>Product</span><span>Variant</span><span>Qty</span>
        {!simple && <><span>Unit price</span><span>Tax</span><span className="text-right">Amount</span></>}<span />
      </div>
      <ul className="divide-y divide-line">
        {lines.map((l) => {
          const p = productOf(l.productId);
          const low = Number(l.quantity) < minQuantity;
          return (
            <li key={l.key} className={`grid grid-cols-2 items-start gap-3 py-3 ${cols}`}>
              <select aria-label="Product" className="input col-span-2 sm:col-span-1" value={l.productId} disabled={readOnly} onChange={(e) => pickProduct(l, e.target.value)}>
                <option value="">Choose a product…</option>
                {products.map((x) => <option key={x.id} value={x.id}>{x.name} — {money(x.salesPrice)}</option>)}
              </select>
              <select aria-label="Variant" className="input" value={l.variantId || ''} disabled={readOnly || !p?.variants?.length} onChange={(e) => pickVariant(l, e.target.value)}>
                <option value="">{p?.variants?.length ? 'Standard' : 'No variants'}</option>
                {p?.variants?.map((v) => <option key={v.id} value={v.id}>{v.attribute}: {v.value} (+{money(v.extraPrice)})</option>)}
              </select>
              <div>
                <input aria-label="Quantity" type="number" min={minQuantity} className="input tabular" value={l.quantity} disabled={readOnly}
                  aria-invalid={low || undefined} onChange={(e) => update(l.key, { quantity: e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0) })} />
                {low && <p className="mt-1 text-xs text-bad">Min {minQuantity}</p>}
              </div>
              {!simple && (
                <>
                  <input aria-label="Unit price" type="number" min="0" step="0.01" className="input tabular" value={l.unitPrice} disabled={readOnly}
                    onChange={(e) => update(l.key, { unitPrice: e.target.value })} />
                  <select aria-label="Tax" className="input" value={l.taxId ?? ''} disabled={readOnly} onChange={(e) => update(l.key, { taxId: e.target.value })}>
                    <option value="">No tax</option>
                    {taxes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <Money className="pt-2 text-right font-medium" value={Number(l.quantity || 0) * Number(l.unitPrice || 0)} />
                </>
              )}
              {!readOnly && <IconButton icon={Trash2} label="Remove line" onClick={() => onChange(lines.filter((x) => x.key !== l.key))} className="mt-0.5 hover:text-bad" />}
            </li>
          );
        })}
      </ul>
      {!readOnly && <Button variant="secondary" size="sm" icon={Plus} className="mt-3" onClick={() => onChange([...lines, newLine({ quantity: minQuantity })])}>Add product line</Button>}
    </div>
  );
}

/** Converts editor rows to the API body shape */
export const toApiLines = (lines, { simple = false } = {}) => lines.filter((l) => l.productId).map((l) => ({
  productId: Number(l.productId),
  variantId: l.variantId ? Number(l.variantId) : null,
  quantity: Number(l.quantity),
  ...(!simple && { unitPrice: Number(l.unitPrice), taxId: l.taxId ? Number(l.taxId) : null }),
}));
