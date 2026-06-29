/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0f172a', // Slate 900
          panel: '#1e293b', // Slate 800
          border: '#334155', // Slate 700
          text: '#f8fafc',
          muted: '#94a3b8'
        },
        brand: {
          primary: '#3b82f6', // Blue 500
          hover: '#2563eb', // Blue 600
          accent: '#8b5cf6' // Violet 500
        }
      }
    },
  },
  plugins: [],
}
