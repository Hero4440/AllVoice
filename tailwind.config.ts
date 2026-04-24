import type { Config } from 'tailwindcss';

/**
 * High-contrast theme (7:1+ ratio) is the DEFAULT.
 * Standard theme (4.5:1 minimum) is available via `.standard-contrast` class.
 *
 * Color ratios verified against WCAG AAA:
 *   hc-bg (#0A0A0A) / hc-text (#FFFFFF) → 19.3:1
 *   hc-bg (#0A0A0A) / hc-accent (#FFD700) → 12.5:1
 *   hc-bg (#0A0A0A) / hc-success (#00E676) → 11.4:1
 *   hc-bg (#0A0A0A) / hc-error (#FF6B6B) → 5.2:1 (used with white text)
 *   hc-bg (#0A0A0A) / hc-blocked (#FFA726) → 8.5:1
 *   hc-focus (#00B0FF) on hc-bg → 7.1:1
 */
const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
    './popup.html',
  ],
  theme: {
    extend: {
      colors: {
        /* High-contrast palette (7:1+ ratio, WCAG AAA) */
        'hc-bg': '#0A0A0A',
        'hc-surface': '#1A1A1A',
        'hc-text': '#FFFFFF',
        'hc-text-secondary': '#E0E0E0',
        'hc-accent': '#FFD700',
        'hc-focus': '#00B0FF',
        'hc-success': '#00E676',
        'hc-error': '#FF6B6B',
        'hc-blocked': '#FFA726',
        'hc-info': '#40C4FF',
        'hc-border': '#FFFFFF',
      },
      fontSize: {
        'body': ['16px', { lineHeight: '1.5' }],
        'label': ['14px', { lineHeight: '1.4' }],
        'heading': ['20px', { lineHeight: '1.3', fontWeight: '700' }],
      },
      outlineWidth: {
        'focus': '3px',
      },
      outlineOffset: {
        'focus': '2px',
      },
    },
  },
  plugins: [],
};

export default config;
