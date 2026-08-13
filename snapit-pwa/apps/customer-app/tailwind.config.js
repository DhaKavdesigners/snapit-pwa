/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#FFFFFF',
        surface: '#F8F9FA',
        brand: '#059669', // Emerald Green
        accent: '#2563EB', // Royal Blue
        'text-primary': '#121212',
        'text-secondary': '#6B7280',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      spacing: {
        // Strict 8px grid based extensions if needed, but Tailwind defaults are 4px base (e.g. 2=8px, 4=16px, 8=32px)
      },
      borderRadius: {
        '2xl': '1rem', // matching default 2xl
        'full': '9999px',
      }
    },
  },
  plugins: [],
}
