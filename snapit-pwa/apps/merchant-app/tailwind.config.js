/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#FAFAF8',
        surface: '#FFFFFF',
        brand: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        dark: {
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'counter': '0 2px 12px -2px rgba(0, 0, 0, 0.06), 0 4px 24px -4px rgba(0, 0, 0, 0.04)',
        'counter-active': '0 8px 30px -4px rgba(5, 150, 105, 0.15)',
        'counter-urgent': '0 8px 30px -4px rgba(245, 158, 11, 0.25)',
      }
    },
  },
  plugins: [],
}
