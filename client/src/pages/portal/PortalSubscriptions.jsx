// My plans — every service the customer has with us, named by what it is (not by reference number).
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Repeat } from 'lucide-react';
import { portalApi } from '../../api/endpoints.js';
import { date, money, relativeDays } from '../../lib/format.js';
import { amountBeforeTax, mainArt, periodOf, serviceTitle } from '../../lib/portal.js';
import { EmptyState, Spinner, StatusBadge } from '../../components/ui/index.js';
import { ServiceIcon } from '../../components/brand/ServiceArt.jsx';

const GROUPS = [
  { title: 'Needs your approval', match: (s) => s.status === 'QUOTATION' },
  { title: 'Active', match: (s) => ['ACTIVE', 'PAUSED', 'CONFIRMED'].includes(s.status) },
  { title: 'Requested', match: (s) => s.status === 'DRAFT' },
  { title: 'Ended', match: (s) => ['CLOSED', 'CANCELLED'].includes(s.status) },
];

function whenLine(s) {
  if (s.status === 'QUOTATION') return s.quotationValidUntil ? `Offer valid until ${date(s.quotationValidUntil)}` : 'Waiting for your approval';
  if (s.status === 'DRAFT') return 'We are preparing your offer';
  if (s.status === 'CONFIRMED') return `Starts ${date(s.startDate)}`;
  if (s.status === 'PAUSED') return 'Paused — no bills while paused';
  if (s.status === 'ACTIVE' && s.nextInvoiceDate) return `Next bill ${relativeDays(s.nextInvoiceDate)} (${date(s.nextInvoiceDate)})`;
  return s.expiryDate ? `Ended ${date(s.expiryDate)}` : `Since ${date(s.startDate)}`;
}

function PlanRow({ s }) {
  const period = periodOf(s.plan);
  const others = s.lines.slice(1).map((l) => l.product.name);
  return (
    <li>
      <Link to={`/portal/subscriptions/${s.id}`} className="card pressable flex items-center gap-4 p-4 transition-shadow hover:shadow-pop sm:p-5">
        <ServiceIcon artKey={mainArt(s)} size={48} />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1"><span className="font-semibold">{serviceTitle(s)}</span><StatusBadge status={s.status} customer /></p>
          <p className="mt-0.5 truncate text-sm text-muted">{others.length ? `With ${others.join(', ')}` : `${s.lines[0]?.quantity ?? 1} × ${s.lines[0]?.product.name ?? s.plan.name}`}</p>
          <p className={`mt-1 text-sm ${s.status === 'QUOTATION' ? 'font-medium text-brand' : 'text-muted'}`}>{whenLine(s)}</p>
        </div>
        <p className="hidden text-right sm:block">
          <span className="block text-lg font-bold tabular">{money(amountBeforeTax(s))}</span>
          <span className="text-sm text-muted">per {period?.unit}, before tax</span>
        </p>
      </Link>
    </li>
  );
}

export default function PortalSubscriptions() {
  const q = useQuery({ queryKey: ['portal', 'subs', 'all'], queryFn: () => portalApi.subscriptions({ pageSize: 50 }) });
  const rows = q.data?.data ?? [];
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">My plans</h1>
          <p className="mt-1 text-base text-muted">The services you have with us, and what happens next.</p>
        </div>
        <Link to="/portal/add" className="pressable inline-flex h-11 items-center gap-2 rounded bg-brand px-5 font-semibold text-white hover:bg-brand-strong"><Plus className="size-4" aria-hidden />Add a service</Link>
      </div>
      {q.isLoading ? <Spinner /> : rows.length === 0 ? (
        <EmptyState icon={Repeat} title="No plans yet" description="Browse our services and request one — we’ll send you an offer to approve."
          action={<Link to="/portal/add" className="font-semibold text-brand hover:underline">Add a service</Link>} />
      ) : GROUPS.map((g) => {
        const list = rows.filter(g.match);
        if (!list.length) return null;
        return (
          <section key={g.title} className="mt-8">
            <h2 className="text-sm font-semibold text-muted">{g.title} · {list.length}</h2>
            <ul className="mt-3 space-y-3">{list.map((s) => <PlanRow key={s.id} s={s} />)}</ul>
          </section>
        );
      })}
    </>
  );
}
