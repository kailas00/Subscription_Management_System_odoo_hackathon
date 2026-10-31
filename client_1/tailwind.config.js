// Design tokens live in src/index.css (CSS variables). Use these names, never raw hex in components.
/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        ground: v('ground'), surface: v('surface'), sunken: v('sunken'),
        ink: v('ink'), muted: v('muted'), faint: v('faint'), line: v('line'),
        rail: v('rail'), 'rail-ink': v('rail-ink'), 'rail-muted': v('rail-muted'),
        brand: { DEFAULT: v('brand'), strong: v('brand-strong'), soft: v('brand-soft') },
        accent: { DEFAULT: v('accent'), soft: v('accent-soft') },
        ok: { DEFAULT: v('ok'), soft: v('ok-soft') },
        warn: { DEFAULT: v('warn'), soft: v('warn-soft') },
        bad: { DEFAULT: v('bad'), soft: v('bad-soft') },
        info: { DEFAULT: v('info'), soft: v('info-soft') },
      },
      fontSize: {
        // tight, product-grade scale (rem / line-height)
        xs: ['0.75rem', '1rem'], sm: ['0.8125rem', '1.25rem'], base: ['0.875rem', '1.375rem'],
        md: ['1rem', '1.5rem'], lg: ['1.125rem', '1.625rem'], xl: ['1.375rem', '1.75rem'], '2xl': ['1.75rem', '2.125rem'],
      },
      borderRadius: { DEFAULT: '8px', lg: '12px' },
      boxShadow: {
        card: '0 1px 2px rgb(22 32 30 / 0.06), 0 4px 12px -4px rgb(22 32 30 / 0.08)',
        pop: '0 8px 24px -6px rgb(22 32 30 / 0.22), 0 2px 6px rgb(22 32 30 / 0.08)',
      },
    },
  },
  plugins: [],
};
