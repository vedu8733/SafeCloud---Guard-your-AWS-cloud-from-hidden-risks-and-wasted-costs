/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    './node_modules/@shadcn/ui/dist/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        'glass': 'rgba(255,255,255,0.15)',
        // Brand palette (purple focus)
        'brand-bg': '#0b0a12',
        'brand-white': '#ffffff',
        'brand-muted': '#a78bfa', // purple-400
        'brand-primary': '#7c3aed', // purple-600
        'brand-primary-700': '#6d28d9',
        'brand-primary-500': '#8b5cf6',
        'brand-accent': '#c084fc', // purple-300
        'primary-gradient-from': '#7c3aed',
        'primary-gradient-to': '#c084fc',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(124, 58, 237, 0.25)',
        'elevated': '0 10px 30px rgba(0,0,0,0.25)'
      },
      borderRadius: {
        '2xl': '1.5rem',
      },
      keyframes: {
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 700ms ease-out both',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
