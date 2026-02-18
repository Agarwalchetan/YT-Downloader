/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Zinc base (background surfaces)
        zinc: {
          950: '#09090b',
          900: '#18181b',
          800: '#27272a',
          700: '#3f3f46',
          600: '#52525b',
          500: '#71717a',
          400: '#a1a1aa',
          300: '#d4d4d8',
          200: '#e4e4e7',
          100: '#f4f4f5',
          50:  '#fafafa',
        },
        // Cyan accent
        cyan: {
          950: '#083344',
          900: '#164e63',
          800: '#155e75',
          700: '#0e7490',
          600: '#0891b2',
          500: '#06b6d4',
          400: '#22d3ee',
          300: '#67e8f9',
          200: '#a5f3fc',
          100: '#cffafe',
          50:  '#ecfeff',
        },
        // Semantic
        success: '#10b981',  // emerald-500
        warning: '#f59e0b',  // amber-500
        danger:  '#ef4444',  // red-500
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow':  'spin 3s linear infinite',
        'enter':      'enter 0.40s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'shimmer':    'shimmer 1.8s linear infinite',
        'pulse-dot':  'pulseDot 2s ease-in-out infinite',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      boxShadow: {
        'card':      '0 8px 48px rgba(0, 0, 0, 0.50)',
        'glow-sm':   '0 2px 16px rgba(6, 182, 212, 0.25)',
        'glow':      '0 4px 28px rgba(6, 182, 212, 0.35)',
        'glow-lg':   '0 6px 44px rgba(6, 182, 212, 0.45)',
        'inset-top': '0 1px 0 rgba(255, 255, 255, 0.04) inset',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
