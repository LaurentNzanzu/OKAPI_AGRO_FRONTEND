/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
    './src/index.css',
  ],
  safelist: [
    { pattern: /^(bg|text|border|divide|ring|hover:bg|focus:ring)-(canvas|surface|sidebar|border|night|petrol|primary)-/ },
    'shadow-card',
    'shadow-dropdown',
  ],
  theme: {
    extend: {
      colors: {
        petrol: {
          DEFAULT: '#0F2A44',
          dark: '#1E2A3D',
          light: '#25344D',
        },
        primary: {
          DEFAULT: '#0F2A44',
          50: '#F8FAFC',
          100: '#E2E8F0',
          200: '#CBD5E1',
          500: '#25344D',
          600: '#0F2A44',
          700: '#1E2A3D',
          800: '#0F172A',
          900: '#0B1220',
        },
        canvas: {
          light: '#F8FAFC',
          dark: '#121A2A',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#1F2937',
        },
        sidebar: {
          light: '#F1F5F9',
          dark: '#172033',
        },
        border: {
          light: '#E5E7EB',
          dark: '#334155',
        },
        night: {
          active: '#24324A',
          'active-sub': '#2B3A55',
          hover: '#273449',
          muted: '#334762',
          'muted-hover': '#3B4F6B',
        },
        success: '#168A5B',
        warning: '#D97706',
        danger: '#DC2626',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'page-title': ['1.75rem', { lineHeight: '2.25rem', fontWeight: '600' }],
        'page-subtitle': ['0.9375rem', { lineHeight: '1.5rem' }],
        stat: ['2rem', { lineHeight: '2.5rem', fontWeight: '700' }],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        dropdown: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
};
