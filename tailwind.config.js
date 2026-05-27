/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  safelist: [
    'bg-emerald-950/40',
    'bg-emerald-950/30',
    'bg-emerald-950/10',
    'bg-rose-950/30',
    'ring-emerald-700/60',
    'ring-emerald-700/30',
    'border-emerald-700/60',
    'border-emerald-900/50',
    'recipe-scroll',
    'recipe-marquee-run',
    'mono',
  ],
  plugins: [],
}