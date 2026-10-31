// Landing — one page, one action. The visitor came to sign in, so the working sign-in is the hero
// (impeccable "Persuade": the action in its working form). The product itself is the only image.
// Apple principles: simplicity, the most important thing most obvious, one deliberate motion moment.
import { Link } from 'react-router-dom';
import { ArrowRight, UserPlus } from 'lucide-react';
import { useAuth, homeFor } from '../context/AuthContext.jsx';
import { LogoMark } from '../components/layout/Logo.jsx';
import { SignInForm } from '../components/auth/SignInForm.jsx';

const HEAD = "font-['Space_Grotesk',sans-serif]";

const FACTS = [
  ['Renewals', 'Billed on schedule, never twice.'],
  ['Invoices', 'Taxes and discounts applied for you.'],
  ['Payments', 'Matched to invoices, overdue flagged.'],
];

/* ── The product, drawn from its real parts (example data) ── */
const INVOICES = [
  ['SH', 'Saffron Hotels', 'INV/2026/00218', '₹24,780', 'Paid', 'bg-[#ECFDF5] text-[#047857]'],
  ['PF', 'Pixel Forge', 'INV/2026/00219', '₹8,496', 'Unpaid', 'bg-[#EFF6FF] text-[#1D4ED8]'],
  ['KF', 'Kaveri Foods', 'INV/2026/00220', '₹14,160', 'Overdue', 'bg-[#FEF2F2] text-[#B91C1C]'],
  ['NT', 'Northwind Traders', 'INV/2026/00221', '₹11,328', 'Paid', 'bg-[#ECFDF5] text-[#047857]'],
];
const NAV_ITEMS = ['Dashboard', 'Subscriptions', 'Customers', 'Invoices', 'Payments', 'Reports'];

function ProductWindow() {
  return (
    <div className="overflow-hidden rounded-[22px] border border-[#0F1F33]/10 bg-white shadow-[0_40px_100px_-30px_rgb(15_31_51/0.35),0_8px_24px_-12px_rgb(15_31_51/0.12)]">
      <div className="flex h-10 items-center border-b border-[#0F1F33]/[0.07] bg-[#F8FAFC] px-4">
        <span className="flex gap-1.5" aria-hidden>{[0, 1, 2].map((i) => <span key={i} className="size-2.5 rounded-full bg-[#0F1F33]/15" />)}</span>
        <span className="mx-auto rounded-md bg-white px-10 py-1 text-[11px] text-[#64748B] ring-1 ring-[#0F1F33]/[0.07]">brightloop · dashboard</span>
      </div>
      <div className="flex">
        <aside className="hidden w-48 shrink-0 flex-col gap-1 bg-[#0F1F33] p-4 md:flex">
          <span className="mb-4 flex items-center gap-2"><LogoMark size={24} onDark /><span className="wordmark text-[10px] text-white">Brightloop</span></span>
          {NAV_ITEMS.map((n, i) => (
            <span key={n} className={`rounded-lg px-3 py-2 text-[12px] ${i === 0 ? 'bg-white/10 font-semibold text-white' : 'text-[#CBD5E1]'}`}>{n}</span>
          ))}
        </aside>
        <div className="min-w-0 flex-1 bg-[#F8FAFC] p-5 sm:p-7">
          <p className={`${HEAD} text-[19px] font-semibold text-[#0F172A]`}>Good morning, Aisha</p>
          <p className="text-[12px] text-[#475569]">How the subscription book stands for November.</p>
          <div className="mt-5 grid overflow-hidden rounded-2xl border border-[#0F1F33]/10 bg-white sm:grid-cols-[1.3fr_1fr_1fr]">
            <div className="bg-[#0F1F33] p-4">
              <p className="text-[11px] text-[#CBD5E1]">Monthly recurring revenue</p>
              <p className={`${HEAD} mt-1 text-[26px] font-semibold tabular text-white`}>₹4,82,300</p>
              <svg viewBox="0 0 200 40" className="mt-2 h-9 w-full" aria-hidden>
                <path d="M0 34 L20 31 L40 32 L60 25 L80 27 L100 20 L120 21 L140 14 L160 15 L180 8 L200 5" fill="none" stroke="#34D399" strokeWidth="2" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="border-t border-[#0F1F33]/10 p-4 sm:border-l sm:border-t-0">
              <p className="text-[11px] text-[#475569]">Collected this month</p>
              <p className={`${HEAD} mt-1 text-[22px] font-semibold tabular text-[#0F172A]`}>₹3.1L</p>
              <p className="mt-2 text-[11px] text-[#475569]">82% of invoiced</p>
            </div>
            <div className="border-t border-[#0F1F33]/10 p-4 sm:border-l sm:border-t-0">
              <p className="text-[11px] text-[#475569]">Overdue</p>
              <p className={`${HEAD} mt-1 text-[22px] font-semibold tabular text-[#B91C1C]`}>₹14,160</p>
              <p className="mt-2 text-[11px] text-[#475569]">1 invoice past due</p>
            </div>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-[#0F1F33]/10 bg-white">
            {INVOICES.map(([ini, c, n, a, s, cls]) => (
              <div key={n} className="flex items-center gap-3 border-b border-[#0F1F33]/[0.06] px-4 py-2.5 last:border-0">
                <span className="flex size-7 items-center justify-center rounded-full bg-[#E6EEF8] text-[10px] font-semibold text-[#1E3A5F]">{ini}</span>
                <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-[#0F172A]">{c}</span>
                <span className="hidden font-mono text-[11px] text-[#475569] sm:inline">{n}</span>
                <span className="w-20 text-right text-[12.5px] font-semibold tabular text-[#0F172A]">{a}</span>
                <span className={`w-16 rounded-full py-0.5 text-center text-[10.5px] font-semibold ${cls}`}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#FBFCFD] text-[#0F172A]">
      <a href="#main" className="skip-link">Skip to content</a>

      {/* Translucent bar (apple-design §12): content scrolls under it */}
      <header className="sticky top-0 z-30 bg-[#FBFCFD]/75 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Brightloop home">
            <LogoMark size={30} />
            <span className="wordmark text-[13px] text-[#0F1F33]">Brightloop</span>
          </Link>
          {user
            ? <Link to={homeFor(user)} className={`${HEAD} pressable inline-flex h-10 items-center gap-2 rounded-full bg-[#0F1F33] px-5 text-[14px] font-medium text-white hover:bg-[#1E3A5F]`}>Open workspace<ArrowRight className="icon-sm" aria-hidden /></Link>
            : (
              <Link to="/signup"
                className={`${HEAD} pressable inline-flex h-10 items-center gap-2 rounded-full border border-[#0F1F33]/20 bg-white px-4 text-[14px] font-semibold text-[#0F1F33] shadow-[0_1px_2px_rgb(15_31_51/0.06),0_4px_12px_-6px_rgb(15_31_51/0.18)] hover:border-[#0F1F33] hover:bg-[#0F1F33] hover:text-white sm:px-5`}>
                <UserPlus className="icon-sm" aria-hidden />
                <span className="sm:hidden">Create account</span><span className="hidden sm:inline">Create customer account</span>
              </Link>
            )}
        </div>
      </header>

      <main id="main" tabIndex={-1} className="outline-none">
        <section className="mx-auto grid max-w-[1200px] items-center gap-10 px-5 pb-16 pt-10 sm:gap-14 sm:pb-20 sm:pt-12 sm:px-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-20 lg:pt-20">
          {/* The column is a size container: the wide wordmark scales to its own column, never under the sign-in card */}
          <div className="min-w-0" style={{ containerType: 'inline-size' }}>
            <h1 className="wordmark whitespace-nowrap leading-[0.95] tracking-[0.06em] text-[#0F1F33]" style={{ fontSize: 'min(8.4cqi, 5rem)' }}>Brightloop</h1>
            <p className={`${HEAD} mt-7 max-w-[18ch] text-[clamp(1.75rem,3vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.025em] text-[#0F172A]`}>
              Subscription billing that runs itself.
            </p>
            <p className="mt-5 max-w-[34rem] text-[17px] leading-[1.6] text-[#475569]">
              Plans, quotations, recurring invoices and payments in one place — for your billing team and the customers they serve.
            </p>
            <dl className="mt-12 hidden max-w-[40rem] gap-6 border-t border-[#0F1F33]/15 pt-6 sm:grid sm:grid-cols-3">
              {FACTS.map(([k, v]) => (
                <div key={k}>
                  <dt className={`${HEAD} text-[15px] font-semibold text-[#0F1F33]`}>{k}</dt>
                  <dd className="mt-1 text-[14.5px] leading-snug text-[#475569]">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* The one action, working, right here */}
          <div className="landing-panel rounded-[28px] bg-white p-7 shadow-[0_30px_80px_-30px_rgb(15_31_51/0.28)] ring-1 ring-[#0F1F33]/[0.07] sm:p-8">
            {user ? (
              <>
                <h2 className={`${HEAD} text-[24px] font-semibold tracking-[-0.02em]`}>Welcome back</h2>
                <p className="mt-1 text-[15px] text-[#475569]">Signed in as {user.name}.</p>
                <Link to={homeFor(user)} className="pressable mt-6 flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0F1F33] text-[15px] font-semibold text-white hover:bg-[#1E3A5F]">Open your workspace<ArrowRight className="icon-sm" aria-hidden /></Link>
              </>
            ) : (
              <>
                <h2 className={`${HEAD} text-[24px] font-semibold tracking-[-0.02em]`}>Sign in</h2>
                <p className="mt-1 text-[15px] text-[#475569]">One sign-in for admins, billing staff and customers.</p>
                <div className="mt-6"><SignInForm /></div>
                <p className="mt-6 border-t border-[#0F1F33]/[0.08] pt-5 text-center text-[14.5px] text-[#475569]">
                  New customer? <Link to="/signup" className="font-semibold text-[#1E3A5F] hover:underline">Create an account</Link>
                </p>
              </>
            )}
          </div>
        </section>

        <section aria-label="Product preview" className="mx-auto max-w-[1200px] px-5 pb-24 sm:px-8">
          <div className="landing-product">
            <ProductWindow />
          </div>
          <p className="mt-4 text-right text-[12.5px] text-[#64748B]">Example data</p>
        </section>
      </main>

      <footer className="border-t border-[#0F1F33]/[0.08]">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-5 py-7 text-[13.5px] text-[#475569] sm:px-8">
          <span className="flex items-center gap-2"><LogoMark size={22} /><span className="wordmark text-[11px] text-[#0F1F33]">Brightloop</span></span>
          <span>© {new Date().getFullYear()} Brightloop Software</span>
        </div>
      </footer>
    </div>
  );
}
