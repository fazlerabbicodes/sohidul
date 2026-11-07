/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          lime: '#a3e635',
          neon: '#bef264'
        },
        sidebar: {
          bg: '#0f172a',
          active: '#1e293b',
          hover: '#1e293b'
        }
      }
    },
  },
  plugins: [],
}
