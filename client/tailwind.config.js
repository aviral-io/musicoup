/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        couple: {
          pink: '#f43f5e',
          rose: '#fda4af',
          dark: '#160814',
          accent: '#ec4899',
          purple: '#a855f7'
        },
        group: {
          neon: '#06b6d4',
          accent: '#6366f1',
          dark: '#0a0f1d'
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
