// Product artwork for the service catalog. Each service gets a small drawn "product shot" on a flat, calm colour
// (no gradients, no glow). A real photo (product.imageUrl) replaces the drawing when an admin adds one.
import clsx from 'clsx';
import { Building2, Cloud, Headset, KeyRound, Music2, PenTool, Plug, ShieldCheck, Users, Video, Package } from 'lucide-react';

export const SERVICE_KINDS = {
  care:      { label: 'Device protection', icon: ShieldCheck, bg: '#FFF4D6', ink: '#7A4B00' },
  creative:  { label: 'Creative apps',     icon: PenTool,     bg: '#FCE7EF', ink: '#8A1747' },
  cloud:     { label: 'Cloud storage',     icon: Cloud,       bg: '#E3F0FF', ink: '#174A86' },
  meet:      { label: 'Video meetings',    icon: Video,       bg: '#E4F6EE', ink: '#0B5E43' },
  vault:     { label: 'Password security', icon: KeyRound,    bg: '#ECEAFB', ink: '#3E2F92' },
  music:     { label: 'Background music',  icon: Music2,      bg: '#FDEBDD', ink: '#8A3B0B' },
  crm:       { label: 'Sales CRM',         icon: Users,       bg: '#E6EEF8', ink: '#1E3A5F' },
  erp:       { label: 'Business software', icon: Building2,   bg: '#EAF1EC', ink: '#24513A' },
  connector: { label: 'Integration',       icon: Plug,        bg: '#EEF0F3', ink: '#334155' },
  support:   { label: 'Expert support',    icon: Headset,     bg: '#E0F4F6', ink: '#0E5560' },
};
const FALLBACK = { label: 'Service', icon: Package, bg: '#EEF0F3', ink: '#334155' };
export const kindOf = (key) => SERVICE_KINDS[key] || FALLBACK;

/** Small square icon tile — used in lists, plan cards and invoices. */
export function ServiceIcon({ artKey, size = 40, className }) {
  const k = kindOf(artKey);
  const Icon = k.icon;
  return (
    <span className={clsx('inline-flex shrink-0 items-center justify-center rounded-[12px]', className)}
      style={{ width: size, height: size, background: k.bg, color: k.ink }} aria-hidden>
      <Icon style={{ width: size * 0.48, height: size * 0.48 }} strokeWidth={1.8} />
    </span>
  );
}

const W = '#FFFFFF';

/* One small scene per kind, drawn on a 320×200 canvas. */
const SCENES = {
  care: (c) => (
    <>
      <rect x="112" y="26" width="96" height="160" rx="18" fill="#1F2937" />
      <rect x="118" y="32" width="84" height="148" rx="13" fill={W} />
      <rect x="146" y="38" width="28" height="6" rx="3" fill="#1F2937" />
      {/* pineapple mark */}
      <ellipse cx="160" cy="104" rx="15" ry="19" fill="#F5B82E" />
      <path d="M150 94l20 20M170 94l-20 20M148 104h24" stroke="#C98A0B" strokeWidth="1.6" opacity=".6" />
      <path d="M160 85c-6-8-12-9-16-8 5 2 9 5 11 9M160 85c6-8 12-9 16-8-5 2-9 5-11 9M160 85c0-9 3-14 6-16-1 6-2 11-2 16" fill="#3F8F4E" />
      <rect x="138" y="140" width="44" height="7" rx="3.5" fill="#E5E7EB" />
      <rect x="146" y="153" width="28" height="5" rx="2.5" fill="#E5E7EB" />
      {/* shield badge */}
      <path d="M232 70l26 10v20c0 18-12 29-26 34-14-5-26-16-26-34V80z" fill={c.ink} />
      <path d="M220 101l9 9 16-18" fill="none" stroke={W} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="44" y="118" width="54" height="40" rx="6" fill="#1F2937" /><rect x="48" y="122" width="46" height="30" rx="3" fill="#CBD5E1" />
      <rect x="38" y="158" width="66" height="6" rx="3" fill="#374151" />
    </>
  ),
  creative: (c) => (
    <>
      <rect x="40" y="30" width="240" height="146" rx="14" fill={W} />
      <rect x="40" y="30" width="240" height="22" rx="14" fill="#F3F4F6" /><rect x="40" y="44" width="240" height="8" fill="#F3F4F6" />
      {[0, 1, 2].map((i) => <circle key={i} cx={56 + i * 11} cy="41" r="3.5" fill="#D1D5DB" />)}
      <rect x="52" y="62" width="20" height="104" rx="6" fill="#F3F4F6" />
      {[0, 1, 2, 3].map((i) => <rect key={i} x="57" y={70 + i * 22} width="10" height="10" rx="3" fill={i === 1 ? c.ink : '#CBD5E1'} />)}
      <rect x="82" y="62" width="140" height="104" rx="8" fill="#FAFAFA" stroke="#E5E7EB" />
      <path d="M96 146C120 70 160 150 206 82" fill="none" stroke={c.ink} strokeWidth="4" strokeLinecap="round" />
      <circle cx="96" cy="146" r="5" fill={W} stroke={c.ink} strokeWidth="2.5" /><circle cx="206" cy="82" r="5" fill={W} stroke={c.ink} strokeWidth="2.5" />
      <path d="M150 112l26-30" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 3" /><rect x="172" y="77" width="9" height="9" rx="2" fill="#94A3B8" />
      <circle cx="136" cy="96" r="18" fill="#F59E0B" opacity=".85" /><rect x="152" y="118" width="34" height="34" rx="8" fill="#38BDF8" opacity=".8" />
      {['#EC4899', '#F59E0B', '#22C55E', '#3B82F6'].map((col, i) => <rect key={col} x="232" y={64 + i * 24} width="36" height="18" rx="5" fill={col} />)}
    </>
  ),
  cloud: (c) => (
    <>
      <circle cx="122" cy="84" r="28" fill={W} /><circle cx="166" cy="66" r="40" fill={W} /><circle cx="208" cy="88" r="24" fill={W} /><rect x="94" y="82" width="138" height="30" rx="15" fill={W} />
      <path d="M160 64v38M146 78l14-14 14 14" fill="none" stroke={c.ink} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      {[[52, 136, '#3B82F6'], [120, 146, '#F59E0B'], [188, 136, '#22C55E']].map(([x, y, col]) => (
        <g key={x}>
          <path d={`M${x} ${y}h30l12 12v30a4 4 0 0 1-4 4H${x}a4 4 0 0 1-4-4v-38a4 4 0 0 1 4-4z`} transform={`translate(${-2} 0)`} fill={W} />
          <rect x={x + 4} y={y + 20} width="26" height="5" rx="2.5" fill={col} /><rect x={x + 4} y={y + 30} width="18" height="4" rx="2" fill="#CBD5E1" />
        </g>
      ))}
      <rect x="244" y="138" width="40" height="44" rx="8" fill={c.ink} />
      <rect x="252" y="150" width="24" height="5" rx="2.5" fill="#93C5FD" /><rect x="252" y="161" width="24" height="5" rx="2.5" fill="#93C5FD" /><circle cx="276" cy="174" r="2.5" fill="#86EFAC" />
    </>
  ),
  meet: (c) => (
    <>
      <rect x="34" y="26" width="252" height="148" rx="14" fill="#111827" />
      {[[42, 34, '#FDE68A', '#B45309'], [162, 34, '#BFDBFE', '#1D4ED8'], [42, 102, '#FBCFE8', '#BE185D'], [162, 102, '#BBF7D0', '#15803D']].map(([x, y, bg, fg], i) => (
        <g key={i}>
          <rect x={x} y={y} width="116" height="64" rx="9" fill={bg} />
          <circle cx={x + 58} cy={y + 26} r="12" fill={fg} /><path d={`M${x + 36} ${y + 64}a22 18 0 0 1 44 0z`} fill={fg} />
          {i === 1 && <rect x={x + 2} y={y + 2} width="112" height="60" rx="8" fill="none" stroke="#34D399" strokeWidth="3" />}
        </g>
      ))}
      <rect x="114" y="160" width="92" height="28" rx="14" fill={W} />
      <circle cx="136" cy="174" r="7" fill="#E5E7EB" /><circle cx="160" cy="174" r="7" fill="#E5E7EB" /><circle cx="184" cy="174" r="7" fill="#EF4444" />
    </>
  ),
  vault: (c) => (
    <>
      <rect x="62" y="40" width="196" height="124" rx="16" fill={W} />
      <rect x="82" y="60" width="64" height="74" rx="10" fill={c.bg} />
      <path d="M100 92v-8a14 14 0 0 1 28 0v8" fill="none" stroke={c.ink} strokeWidth="6" strokeLinecap="round" />
      <rect x="94" y="90" width="40" height="32" rx="7" fill={c.ink} /><circle cx="114" cy="104" r="4" fill={W} /><rect x="112" y="106" width="4" height="9" rx="2" fill={W} />
      <rect x="160" y="64" width="80" height="20" rx="6" fill="#F3F4F6" />
      {[0, 1, 2, 3, 4, 5].map((i) => <circle key={i} cx={172 + i * 11} cy="74" r="3.5" fill="#1F2937" />)}
      <rect x="160" y="94" width="80" height="20" rx="6" fill="#F3F4F6" /><rect x="168" y="101" width="40" height="6" rx="3" fill="#94A3B8" />
      <rect x="160" y="124" width="80" height="22" rx="7" fill={c.ink} /><rect x="182" y="132" width="36" height="6" rx="3" fill={W} />
      <circle cx="256" cy="44" r="18" fill="#22C55E" /><path d="M248 44l6 6 11-12" fill="none" stroke={W} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  music: (c) => (
    <>
      <circle cx="124" cy="104" r="68" fill="#1F2937" />
      {[56, 46, 36].map((r) => <circle key={r} cx="124" cy="104" r={r} fill="none" stroke="#374151" strokeWidth="1.5" />)}
      <circle cx="124" cy="104" r="22" fill="#F97316" /><circle cx="124" cy="104" r="4" fill="#1F2937" />
      <path d="M196 52l14 6-36 70" stroke="#9CA3AF" strokeWidth="5" strokeLinecap="round" /><rect x="164" y="122" width="16" height="10" rx="3" fill="#6B7280" transform="rotate(25 172 127)" />
      {[0, 1, 2, 3, 4, 5].map((i) => { const h = [34, 58, 44, 72, 50, 28][i]; return <rect key={i} x={216 + i * 12} y={170 - h} width="7" height={h} rx="3.5" fill={c.ink} />; })}
    </>
  ),
  crm: (c) => (
    <>
      {['Lead', 'Proposal', 'Won'].map((t, col) => (
        <g key={t}>
          <rect x={36 + col * 86} y="30" width="78" height="148" rx="12" fill={W} />
          <rect x={46 + col * 86} y="40" width="34" height="6" rx="3" fill="#94A3B8" />
          {[0, 1, 2].slice(0, 3 - (col === 2 ? 1 : 0)).map((r) => (
            <g key={r}>
              <rect x={44 + col * 86} y={56 + r * 38} width="62" height="30" rx="7" fill={col === 2 ? '#DCFCE7' : '#F3F4F6'} />
              <circle cx={56 + col * 86} cy={71 + r * 38} r="6" fill={col === 2 ? '#16A34A' : c.ink} />
              <rect x={66 + col * 86} y={66 + r * 38} width="30" height="4" rx="2" fill="#475569" /><rect x={66 + col * 86} y={74 + r * 38} width="20" height="4" rx="2" fill="#CBD5E1" />
            </g>
          ))}
        </g>
      ))}
      <path d="M114 128c20 0 20-30 36-30" fill="none" stroke={c.ink} strokeWidth="2.5" strokeDasharray="4 4" />
    </>
  ),
  erp: (c) => (
    <>
      <rect x="36" y="30" width="248" height="144" rx="14" fill={W} />
      <rect x="52" y="46" width="66" height="44" rx="8" fill={c.bg} /><rect x="60" y="56" width="30" height="5" rx="2.5" fill="#64748B" /><rect x="60" y="68" width="44" height="10" rx="3" fill={c.ink} />
      <rect x="126" y="46" width="66" height="44" rx="8" fill="#FEF3C7" /><rect x="134" y="56" width="30" height="5" rx="2.5" fill="#64748B" /><rect x="134" y="68" width="38" height="10" rx="3" fill="#B45309" />
      <rect x="200" y="46" width="68" height="112" rx="8" fill="#F8FAFC" />
      {[0, 1, 2, 3, 4].map((i) => <rect key={i} x="208" y={56 + i * 20} width="52" height="10" rx="3" fill={i === 0 ? '#CBD5E1' : '#E2E8F0'} />)}
      {[30, 46, 38, 58, 50].map((h, i) => <rect key={i} x={58 + i * 26} y={158 - h} width="16" height={h} rx="4" fill={i === 3 ? c.ink : '#A7C4B1'} />)}
    </>
  ),
  connector: (c) => (
    <>
      <rect x="40" y="58" width="92" height="92" rx="18" fill={W} /><rect x="188" y="58" width="92" height="92" rx="18" fill={W} />
      <rect x="62" y="84" width="48" height="8" rx="4" fill="#1E3A5F" /><rect x="62" y="98" width="34" height="6" rx="3" fill="#CBD5E1" /><rect x="62" y="110" width="40" height="6" rx="3" fill="#CBD5E1" />
      <circle cx="234" cy="96" r="16" fill="#7C3AED" opacity=".85" /><rect x="212" y="120" width="44" height="6" rx="3" fill="#CBD5E1" />
      <path d="M134 92h52M186 116h-52" stroke={c.ink} strokeWidth="4" strokeLinecap="round" />
      <path d="M176 84l10 8-10 8M144 108l-10 8 10 8" fill="none" stroke={c.ink} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="160" cy="44" r="14" fill="#22C55E" /><path d="M154 44l4 4 8-8" fill="none" stroke={W} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  support: (c) => (
    <>
      <rect x="44" y="38" width="150" height="46" rx="16" fill={W} /><path d="M70 84l-6 14 20-14z" fill={W} />
      <rect x="60" y="54" width="100" height="6" rx="3" fill="#475569" /><rect x="60" y="66" width="70" height="6" rx="3" fill="#CBD5E1" />
      <rect x="126" y="100" width="150" height="46" rx="16" fill={c.ink} /><path d="M250 146l6 14-20-14z" fill={c.ink} />
      <rect x="142" y="116" width="110" height="6" rx="3" fill={W} /><rect x="142" y="128" width="64" height="6" rx="3" fill="#99D5DC" />
      <rect x="208" y="34" width="70" height="26" rx="13" fill="#DCFCE7" /><circle cx="224" cy="47" r="5" fill="#16A34A" /><rect x="234" y="44" width="34" height="6" rx="3" fill="#166534" />
      <path d="M62 150a22 22 0 0 1 44 0" fill="none" stroke="#1F2937" strokeWidth="6" strokeLinecap="round" /><rect x="55" y="144" width="13" height="22" rx="6" fill="#1F2937" /><rect x="100" y="144" width="13" height="22" rx="6" fill="#1F2937" /><path d="M106 164c0 12-8 16-20 16" fill="none" stroke="#1F2937" strokeWidth="3" strokeLinecap="round" /><circle cx="84" cy="180" r="4" fill="#1F2937" />
    </>
  ),
};

/** The product "shot" for a catalog card (16:10). Decorative — the card text names the service. */
export function ServiceArt({ artKey, imageUrl, className, rounded = 'rounded-[16px]' }) {
  const k = kindOf(artKey);
  if (imageUrl) {
    return <img src={imageUrl} alt="" loading="lazy" className={clsx('aspect-[16/10] w-full object-cover', rounded, className)} />;
  }
  const scene = SCENES[artKey];
  return (
    <div className={clsx('relative aspect-[16/10] w-full overflow-hidden', rounded, className)} style={{ background: k.bg }} aria-hidden>
      {scene ? (
        <svg viewBox="0 0 320 200" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid meet">{scene(k)}</svg>
      ) : (
        <div className="flex size-full items-center justify-center"><ServiceIcon artKey={artKey} size={64} /></div>
      )}
    </div>
  );
}
