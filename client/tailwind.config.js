/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;
export default {
  // hover: styles only on devices that can hover (no sticky hover on touch)
  future: { hoverOnlyWhenSupported: true },
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"Fira Code"', 'ui-monospace', 'monospace'],
        display: ['Michroma', '"Plus Jakarta Sans"', 'sans-serif'], // wordmark only
      },
      colors: {
        ground: v('ground'), surface: v('surface'), sunken: v('sunken'),
        ink: v('ink'), muted: v('muted'), faint: v('faint'), line: v('line'),
        rail: v('rail'), 'rail-2': v('rail-2'), 'rail-ink': v('rail-ink'), 'rail-muted': v('rail-muted'), signal: v('signal'),
        brand: { DEFAULT: v('brand'), strong: v('brand-strong'), soft: v('brand-soft') },
        accent: { DEFAULT: v('accent'), soft: v('accent-soft') },
        ok: { DEFAULT: v('ok'), soft: v('ok-soft') },
        warn: { DEFAULT: v('warn'), soft: v('warn-soft') },
        bad: { DEFAULT: v('bad'), soft: v('bad-soft') },
        info: { DEFAULT: v('info'), soft: v('info-soft') },
      },
      // Size-specific tracking (apple-design): tighter as type grows, slightly open when small.
      fontSize: {
        xs: ['0.78rem', { lineHeight: '1.1rem', letterSpacing: '0.01em' }],
        sm: ['0.845rem', { lineHeight: '1.3rem', letterSpacing: '0.005em' }],
        // body 15px (16px on phones, set in index.css), ×1.2 steps
        base: ['0.9375rem', { lineHeight: '1.5rem', letterSpacing: '0' }],
        md: ['1rem', { lineHeight: '1.5rem', letterSpacing: '-0.003em' }],
        lg: ['1.125rem', { lineHeight: '1.625rem', letterSpacing: '-0.01em' }],
        xl: ['1.35rem', { lineHeight: '1.875rem', letterSpacing: '-0.015em' }],
        '2xl': ['1.625rem', { lineHeight: '2.125rem', letterSpacing: '-0.022em' }],
        '3xl': ['1.95rem', { lineHeight: '2.375rem', letterSpacing: '-0.026em' }],
        '4xl': ['2.6rem', { lineHeight: '3rem', letterSpacing: '-0.03em' }],
        '5xl': ['3.5rem', { lineHeight: '1.05', letterSpacing: '-0.035em' }],
      },
      // Motion tokens (emil-design-eng): strong ease-out for UI, drawer curve for sheets.
      transitionTimingFunction: {
        out: 'cubic-bezier(0.23, 1, 0.32, 1)',
        'in-out': 'cubic-bezier(0.77, 0, 0.175, 1)',
        drawer: 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
      transitionDuration: { press: '160ms', quick: '140ms', enter: '220ms', sheet: '280ms' },
      // Generous, consistent rounding: controls 10 · cards 16 · panels 20 · hero 28
      borderRadius: { DEFAULT: '10px', md: '10px', lg: '16px', xl: '20px', '2xl': '28px' },
      boxShadow: {
        card: '0 1px 2px rgb(15 23 42 / 0.04), 0 2px 8px -2px rgb(15 23 42 / 0.05)',
        pop: '0 20px 48px -12px rgb(15 31 51 / 0.28), 0 4px 10px rgb(15 23 42 / 0.06)',
        lift: '0 10px 28px -10px rgb(30 58 95 / 0.22)',
        glow: '0 0 0 1px rgb(52 211 153 / 0.25), 0 12px 40px -12px rgb(52 211 153 / 0.35)',
      },
      keyframes: {
        'dialog-in': { from: { opacity: 0, transform: 'scale(0.97)' } },
        'sheet-in': { from: { transform: 'translateX(100%)' } },
        'fade-in': { from: { opacity: 0 } },
        'swap-in': { from: { opacity: 0, filter: 'blur(2px)' } },
      },
      animation: {
        'dialog-in': 'dialog-in 220ms cubic-bezier(0.23, 1, 0.32, 1) both',
        'sheet-in': 'sheet-in 280ms cubic-bezier(0.32, 0.72, 0, 1) both',
        'fade-in': 'fade-in 200ms cubic-bezier(0.23, 1, 0.32, 1) both',
        'swap-in': 'swap-in 200ms ease both',
      },
    },
  },
  plugins: [],
};
