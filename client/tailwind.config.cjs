/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0f172a',
          panel: '#1e293b',
          border: '#334155',
          text: '#f8fafc',
          muted: '#94a3b8'
        },
        brand: {
          primary: '#3b82f6',
          hover: '#2563eb',
          accent: '#8b5cf6'
        }
      }
    },
  },
  plugins: [],
}
