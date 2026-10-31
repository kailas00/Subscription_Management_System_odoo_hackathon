import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Repeat } from 'lucide-react';
import { portalApi } from '../../api/endpoints.js';
import { BILLING_PERIODS } from '../../lib/constants.js';
import { date, relativeDays } from '../../lib/format.js';
import { EmptyState, LifecycleTrack, Spinner, StatusBadge } from '../../components/ui/index.js';

export default function PortalSubscriptions() {
  const q = useQuery({ queryKey: ['portal', 'subs', 'all'], queryFn: () => portalApi.subscriptions({ pageSize: 50 }) });
  const rows = q.data?.data ?? [];
  return (
    <>
      <h1 className="text-2xl font-semibold">Your subscriptions</h1>
      <p className="mt-1 text-base text-muted">Plans you have with us, and where each one stands.</p>
      {q.isLoading ? <Spinner /> : rows.length === 0 ? <EmptyState icon={Repeat} title="No subscriptions yet" description="When we send you a quotation, it will appear here." /> : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {rows.map((s) => (
            <li key={s.id}>
              <Link to={`/portal/subscriptions/${s.id}`} className="card block p-5 transition-shadow hover:shadow-pop">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="font-semibold">{s.plan.name}</p><p className="doc-no text-muted">{s.number}</p></div>
                  <StatusBadge status={s.status} />
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-muted">{s.lines.map((l) => `${l.quantity} × ${l.product.name}`).join(', ') || 'Plan fee only'}</p>
                <div className="mt-4"><LifecycleTrack status={s.status} compact /></div>
                <p className="mt-3 text-sm">
                  {s.status === 'ACTIVE' && s.nextInvoiceDate ? <>Next invoice {relativeDays(s.nextInvoiceDate)} · {BILLING_PERIODS.find((b) => b.value === s.plan.billingPeriod)?.label}</>
                    : s.status === 'QUOTATION' ? <span className="font-medium text-brand">Waiting for your acceptance</span>
                      : s.expiryDate ? `Until ${date(s.expiryDate)}` : `Since ${date(s.startDate)}`}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
