// Customer home — task first. One sentence tells you where you stand, then only what needs you:
// offers to approve, the services you have, and a quiet way to add more. History lives on "Bills & payments".
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BadgePercent, CheckCircle2, CircleAlert, CreditCard, Mail, Plus, Receipt, X } from 'lucide-react';
import { portalApi } from '../../api/endpoints.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { date, money, relativeDays } from '../../lib/format.js';
import { amountBeforeTax, mainArt, periodOf, serviceTitle } from '../../lib/portal.js';
import { EmptyState, Spinner, StatusBadge } from '../../components/ui/index.js';
import { ServiceArt, ServiceIcon } from '../../components/brand/ServiceArt.jsx';

const WELCOME_KEY = 'bl.portal.welcome.hidden';

/** The one sentence that matters most: do I owe anything? */
function StatusHero({ summary, nextBill, firstDue }) {
  const overdue = summary.overdueCount > 0;
  const owes = summary.outstanding > 0;
  const tone = overdue ? 'border-bad/25 bg-bad-soft' : owes ? 'border-info/20 bg-info-soft' : 'border-ok/20 bg-ok-soft';
  const Icon = overdue ? CircleAlert : owes ? Receipt : CheckCircle2;
  const iconTone = overdue ? 'text-bad' : owes ? 'text-info' : 'text-ok';
  return (
    <section aria-label="What you owe" className={`mt-6 flex flex-wrap items-center gap-5 rounded-[20px] border p-5 sm:p-6 ${tone}`}>
      <span className={`flex size-12 items-center justify-center rounded-2xl bg-surface shadow-card ${iconTone}`}><Icon aria-hidden /></span>
      <div className="min-w-0 flex-1">
        <p className="text-xl font-semibold text-ink">
          {overdue ? `${money(summary.outstanding)} to pay — ${summary.overdueCount} bill${summary.overdueCount === 1 ? ' is' : 's are'} overdue`
            : owes ? `${money(summary.outstanding)} to pay${firstDue ? ` by ${date(firstDue.dueDate)}` : ''}`
              : 'You’re all paid up'}
        </p>
        <p className="mt-0.5 text-base text-muted">
          {overdue ? 'Pay online in a minute to keep your services running.'
            : nextBill ? `Your next bill is about ${money(nextBill.amountBeforeTax)} + tax, ${relativeDays(nextBill.date)} (${date(nextBill.date)}).`
              : 'There are no upcoming bills.'}
        </p>
      </div>
      {owes ? (
        <Link to={firstDue ? `/portal/invoices/${firstDue.id}` : '/portal/invoices'}
          className="pressable inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-5 font-semibold text-white hover:bg-brand-strong">
          <CreditCard className="icon-sm" aria-hidden />{summary.unpaidCount > 1 ? 'Pay bills' : 'Pay now'}
        </Link>
      ) : (
        <Link to="/portal/invoices" className="pressable inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-surface px-5 font-semibold text-ink hover:bg-ground">See bills</Link>
      )}
    </section>
  );
}

function Welcome({ onHide }) {
  const items = [
    ['Pay bills', 'Every bill is under Bills & payments. Pay by card, UPI or bank transfer.'],
    ['Approve offers', 'When we send you an offer, approve it here and it starts on the date shown.'],
    ['Add services', 'Need something new? Pick it from Add a service and we’ll send an offer.'],
  ];
  return (
    <aside aria-label="Getting started" className="relative mt-6 rounded-[20px] border border-line bg-surface p-5 sm:p-6">
      <button onClick={onHide} aria-label="Hide these tips" className="pressable absolute right-3 top-3 rounded-md p-1.5 text-muted hover:bg-sunken hover:text-ink"><X className="icon-sm" /></button>
      <p className="font-semibold">Here’s what you can do in your account</p>
      <ol className="mt-4 grid gap-4 sm:grid-cols-3">
        {items.map(([t, d], i) => (
          <li key={t} className="flex gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand">{i + 1}</span>
            <span><span className="block font-semibold">{t}</span><span className="block text-sm text-muted">{d}</span></span>
          </li>
        ))}
      </ol>
    </aside>
  );
}

function ServiceTile({ s }) {
  const period = periodOf(s.plan);
  return (
    <li>
      <Link to={`/portal/subscriptions/${s.id}`} className="card pressable flex h-full items-start gap-4 p-4 transition-shadow hover:shadow-pop">
        <ServiceIcon artKey={mainArt(s)} size={44} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{serviceTitle(s)}</span>
          <span className="block text-sm text-muted">{money(amountBeforeTax(s))} every {period?.unit} + tax</span>
          <span className="mt-2 block text-sm">
            {s.status === 'PAUSED' ? <StatusBadge status="PAUSED" customer />
              : s.status === 'CONFIRMED' ? <>Starts {date(s.startDate)}</>
                : s.nextInvoiceDate ? <span className="text-muted">Next bill {date(s.nextInvoiceDate)}</span> : null}
          </span>
        </span>
      </Link>
    </li>
  );
}

export default function PortalHome() {
  const { user } = useAuth();
  const summary = useQuery({ queryKey: ['portal', 'summary'], queryFn: portalApi.summary });
  const overview = useQuery({ queryKey: ['portal', 'overview'], queryFn: portalApi.overview });
  const subs = useQuery({ queryKey: ['portal', 'subs', 'all'], queryFn: () => portalApi.subscriptions({ pageSize: 50 }) });
  const unpaid = useQuery({ queryKey: ['portal', 'invoices', 'CONFIRMED'], queryFn: () => portalApi.invoices({ status: 'CONFIRMED', pageSize: 1, sort: 'dueDate', order: 'asc' }) });
  const catalog = useQuery({ queryKey: ['portal', 'catalog'], queryFn: portalApi.catalog, staleTime: 60_000 });
  const [welcomeHidden, setWelcomeHidden] = useState(() => { try { return localStorage.getItem(WELCOME_KEY) === '1'; } catch { return false; } });
  const hideWelcome = () => { setWelcomeHidden(true); try { localStorage.setItem(WELCOME_KEY, '1'); } catch { /* storage blocked */ } };

  if (summary.isLoading || overview.isLoading) return <Spinner />;
  const s = summary.data?.data;
  const o = overview.data?.data;
  if (!s || !o) return <EmptyState title="We couldn't load your account" description={summary.error?.message || overview.error?.message} />;

  const all = subs.data?.data ?? [];
  const offers = all.filter((x) => x.status === 'QUOTATION');
  const requested = all.filter((x) => x.status === 'DRAFT');
  const current = all.filter((x) => ['ACTIVE', 'PAUSED', 'CONFIRMED'].includes(x.status));
  const ownedNames = new Set(current.flatMap((x) => x.lines.map((l) => l.product.name)));
  const suggestions = (catalog.data?.data.products ?? []).filter((p) => !ownedNames.has(p.name)).slice(0, 3);
  const promo = o.offers?.[0];
  const manager = o.accountManager;

  return (
    <>
      <h1 className="text-3xl font-bold">Hello, {user.name.split(' ')[0]}</h1>
      <p className="mt-1 text-md text-muted">{o.customer.company || o.customer.name}</p>

      <StatusHero summary={s} nextBill={o.nextBill} firstDue={unpaid.data?.data?.[0]} />
      {!welcomeHidden && <Welcome onHide={hideWelcome} />}

      {(offers.length > 0 || requested.length > 0) && (
        <section className="mt-10" aria-labelledby="h-offers">
          <h2 id="h-offers" className="text-lg font-semibold">Waiting for you</h2>
          <ul className="mt-3 space-y-3">
            {offers.map((q) => (
              <li key={q.id}>
                <Link to={`/portal/subscriptions/${q.id}`} className="card pressable flex flex-wrap items-center gap-4 border-info/25 p-4 transition-shadow hover:shadow-pop sm:p-5">
                  <ServiceIcon artKey={mainArt(q)} size={48} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">New offer: {serviceTitle(q)}</span>
                    <span className="block text-sm text-muted">{money(amountBeforeTax(q))} every {periodOf(q.plan)?.unit} + tax{q.quotationValidUntil ? ` · approve by ${date(q.quotationValidUntil)}` : ''}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-brand">Review and approve<ArrowRight className="icon-sm" aria-hidden /></span>
                </Link>
              </li>
            ))}
            {requested.map((r) => (
              <li key={r.id}>
                <Link to={`/portal/subscriptions/${r.id}`} className="card flex items-center gap-4 p-4 sm:p-5">
                  <ServiceIcon artKey={mainArt(r)} size={48} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">You asked for {serviceTitle(r)}</span>
                    <span className="block text-sm text-muted">{manager ? `${manager.name} is` : 'We are'} preparing your offer. Nothing to do yet.</span>
                  </span>
                  <StatusBadge status="DRAFT" customer />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10" aria-labelledby="h-services">
        <div className="flex items-end justify-between gap-3">
          <h2 id="h-services" className="text-lg font-semibold">Your services</h2>
          <Link to="/portal/subscriptions" className="text-sm font-semibold text-brand hover:underline">All plans</Link>
        </div>
        {current.length === 0 ? (
          <p className="mt-3 text-base text-muted">You don’t have any active services yet.</p>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">{current.slice(0, 6).map((x) => <ServiceTile key={x.id} s={x} />)}</ul>
        )}
      </section>

      {suggestions.length > 0 && (
        <section className="mt-10 overflow-hidden rounded-[20px] border border-line bg-surface" aria-labelledby="h-add">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 sm:px-6">
            <div>
              <h2 id="h-add" className="text-lg font-semibold">Add to your plan</h2>
              <p className="text-sm text-muted">Popular with teams like yours. You only pay after you approve an offer.</p>
            </div>
            <Link to="/portal/add" className="pressable inline-flex h-10 items-center gap-2 rounded-xl border border-line px-4 font-semibold hover:bg-ground"><Plus className="icon-sm" aria-hidden />Browse all</Link>
          </div>
          <ul className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
            {suggestions.map((p) => (
              <li key={p.id}>
                <Link to="/portal/add" className="group block">
                  <ServiceArt artKey={p.artKey} imageUrl={p.imageUrl} className="transition-transform duration-300 ease-out group-hover:scale-[1.02]" />
                  <span className="mt-3 block font-semibold">{p.name}</span>
                  <span className="block text-sm text-muted">From {money(p.salesPrice)} · {p.tagline}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {promo && (
          <aside aria-label="Current offer" className="flex items-start gap-4 rounded-[20px] border border-ok/20 bg-ok-soft p-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface text-ok shadow-card"><BadgePercent aria-hidden /></span>
            <span className="min-w-0">
              <span className="block font-semibold">{promo.type === 'PERCENT' ? `${promo.value}% off` : `${money(promo.value)} off`} a new plan</span>
              <span className="block text-sm text-muted">Mention code <b className="font-mono text-ink">{promo.code}</b> in your request{promo.endDate ? ` before ${date(promo.endDate)}` : ''}.</span>
            </span>
          </aside>
        )}
        {manager && (
          <aside aria-label="Your account manager" className="flex items-center gap-4 rounded-[20px] border border-line bg-surface p-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft font-semibold text-brand">{manager.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}</span>
            <span className="min-w-0 flex-1"><span className="block text-sm text-muted">Questions? Your account manager</span><span className="block font-semibold">{manager.name}</span></span>
            <a href={`mailto:${manager.email}`} className="pressable inline-flex h-10 items-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold hover:bg-ground"><Mail className="icon-sm" aria-hidden />Email</a>
          </aside>
        )}
      </div>
    </>
  );
}
